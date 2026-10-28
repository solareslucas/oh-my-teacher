#!/usr/bin/env python3
"""Study-clock overhead eval: compares OMP runs with and without the study clock.

Uses only the real `omp` CLI (no SDK). Each run happens in a disposable copy of
this repository's public configuration (no `.teacher/`, so no learner data) with
`--no-session`, fictional session-only prompts, and `--no-extensions` plus
explicitly passed extension files, so variants differ only in the clock.

Measures per learner turn: wall time, model requests, tool calls, and token
usage (input, output, cache read, cache write). This costs real model calls.

    python3 evals/study-clock/run.py --repeats 3
    python3 evals/study-clock/run.py --variant clock-v1=/tmp/old-study-clock.js

Results are printed and written as JSON to --out (default: a temp file).
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import statistics
import subprocess
import sys
import tempfile
import time
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
PUBLIC = [".omp", "templates", "docs"]

# Fictional learner turns. Turns 2-4 of "lesson" and "block-lesson" are identical,
# so those turns compare the same teaching with and without an active study block.
# "scheduled" exercises the feature itself (task estimate, "how much time is left?").
LESSON_TURNS = [
    "Creo que 2/4 y 1/2 son iguales porque las dos son la mitad.",
    "Entonces 3/6 también sería equivalente, ¿no? Multiplico arriba y abajo por 3 a 1/2.",
    "¿Y 4/10 y 2/5? Divido entre 2 arriba y abajo y me da 2/5, así que sí.",
]
SCENARIOS = {
    "lesson": [
        "/teach-lesson Quiero entender fracciones equivalentes. Sesión solo en esta conversación, sin perfil.",
        *LESSON_TURNS,
    ],
    "block-lesson": [
        "/teach-schedule Bloque de 60 minutos desde ahora para aprender fracciones equivalentes, solo en esta sesión, sin perfil ni guardar archivos. Empecemos la lección.",
        *LESSON_TURNS,
    ],
    "scheduled": [
        "/teach-schedule Bloque de 60 minutos desde ahora para fracciones equivalentes, solo en esta sesión, sin perfil ni guardar archivos.",
        "Empecemos con una tarea corta de 10 ejercicios; creo que me toma 20 minutos.",
        "Ya hice los primeros: 2/4 = 1/2 y 3/9 = 1/3 porque divido arriba y abajo por el mismo número.",
        "¿Cuánto tiempo me queda y voy bien?",
    ],
}

# Deterministic, conservative classifier for time/schedule administration in the
# visible reply. A sentence counts as administration if it mentions the clock,
# the block, minutes, or a clock time. Everything else counts as teaching text.
ADMIN = re.compile(
    r"(reloj|study[_ ]clock|bloque|\bB\d{3}\b|\bT\d\b|minuto|\bmin\b|\d+\s*min|\bhoras?\b|\b\d{1,2}:\d{2}\b|"
    r"a tiempo|te queda|quedan|tiempo|estimad|calibra|clock|minutes?|remaining|on time)",
    re.IGNORECASE,
)


def admin_split(text: str) -> tuple[int, int]:
    """Return (admin_chars, teaching_chars) of visible text, by sentence/line."""
    admin = teaching = 0
    for piece in re.split(r"(?<=[.!?¿¡:])\s+|\n+", text):
        piece = piece.strip()
        if not piece:
            continue
        if ADMIN.search(piece):
            admin += len(piece)
        else:
            teaching += len(piece)
    return admin, teaching


def workspace(omp_dir: Path | None = None) -> Path:
    root = Path(tempfile.mkdtemp(prefix="omp-clock-eval-"))
    for name in PUBLIC:
        src = omp_dir if (name == ".omp" and omp_dir) else REPO / name
        if src.is_dir():
            shutil.copytree(src, root / name)
    return root


def run_once(scenario: str, extensions: list[Path], max_time: int, model: str | None,
             omp_dir: Path | None = None) -> dict:
    ws = workspace(omp_dir)
    cmd = ["omp", "-p", "--mode", "json", "--no-session", "--no-title", "--no-lsp",
           "--no-extensions", "--tools", "read" + (",study_clock" if len(extensions) > 1 else ""),
           "--approval-mode", "write",
           "--max-time", str(max_time)]
    for ext in extensions:
        cmd += ["--extension", str(ext)]
    if model:
        cmd += ["--model", model]
    cmd += SCENARIOS[scenario]
    turns: list[dict] = []
    current = None
    t0 = time.monotonic()
    proc = subprocess.Popen(cmd, cwd=ws, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    assert proc.stdout
    for line in proc.stdout:
        now = time.monotonic()
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        kind = event.get("type")
        if kind == "agent_start":
            current = {"start": now, "requests": 0, "toolCalls": 0, "input": 0, "output": 0,
                       "cacheRead": 0, "cacheWrite": 0, "tools": [], "texts": [], "toolArgs": [],
                       "firstText": None, "model": None}
        elif kind == "message_update" and current is not None and current["firstText"] is None:
            if (event.get("assistantMessageEvent") or {}).get("type") in ("text_start", "text_delta"):
                current["firstText"] = round(now - current["start"], 2)
        elif kind == "message_end" and current is not None:
            msg = event.get("message", {})
            if msg.get("role") != "assistant":
                continue
            usage = msg.get("usage") or {}
            current["requests"] += 1
            current["model"] = msg.get("model")
            for key in ("input", "output", "cacheRead", "cacheWrite"):
                current[key] += int(usage.get(key) or 0)
            for block in msg.get("content") or []:
                if block.get("type") == "toolCall":
                    current["toolCalls"] += 1
                    current["tools"].append(block.get("name"))
                    current["toolArgs"].append(json.dumps(block.get("arguments") or block.get("input") or {}, ensure_ascii=False))
                elif block.get("type") == "text":
                    current["texts"].append(block.get("text", ""))
        elif kind == "agent_end" and current is not None:
            current["seconds"] = round(now - current.pop("start"), 2)
            turns.append(current)
            current = None
    code = proc.wait()
    stderr = proc.stderr.read() if proc.stderr else ""
    shutil.rmtree(ws, ignore_errors=True)
    for turn in turns:
        visible = "\n\n".join(turn.pop("texts"))
        args_text = "\n".join(turn.pop("toolArgs"))
        admin, teaching = admin_split(visible)
        turn["visibleChars"] = len(visible)
        turn["adminChars"] = admin
        turn["teachingChars"] = teaching
        # Output tokens not accounted for by visible text or tool arguments:
        # an approximation of hidden reasoning (offline tokenizer, model-family guess).
        shown = count_tokens(visible + "\n" + args_text, turn["model"])
        turn["hiddenOutput"] = max(0, turn["output"] - shown) if shown is not None else None
        turn["text"] = visible
    return {"exit": code, "seconds": round(time.monotonic() - t0, 2), "turns": turns,
            "stderr": stderr[-500:] if code else ""}


def count_tokens(text: str, model: str | None) -> int | None:
    encoding = "claude-v5" if model and ("claude" in model or "opus" in model or "sonnet" in model) else "o200k_base"
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as fh:
        fh.write(text)
        path = fh.name
    try:
        out = subprocess.run(["omp", "toks", path, "--json"], capture_output=True, text=True, timeout=60)
        data = json.loads(out.stdout)
        return next(e["tokens"] for e in data["encodings"] if e["name"] == encoding)
    except (subprocess.SubprocessError, json.JSONDecodeError, StopIteration, KeyError):
        return None
    finally:
        Path(path).unlink(missing_ok=True)


def cache_hit(turn: dict) -> float:
    total = turn["input"] + turn["cacheRead"] + turn["cacheWrite"]
    return turn["cacheRead"] / total if total else 0.0


def summarize(runs: list[dict]) -> dict:
    ok = [r for r in runs if r["exit"] == 0 and r["turns"]]
    if not ok:
        return {"runs": len(runs), "ok": 0}
    med = lambda xs: round(statistics.median(xs), 3)
    later = [t for r in ok for t in r["turns"][1:]]  # turns 2-4: identical learner input across lesson scenarios
    hidden = [t["hiddenOutput"] for t in later if t.get("hiddenOutput") is not None]
    first = [t["firstText"] for t in later if t.get("firstText") is not None]
    return {
        "runs": len(runs),
        "ok": len(ok),
        "wall_s_per_run": med([r["seconds"] for r in ok]),
        "requests_per_run": med([sum(t["requests"] for t in r["turns"]) for r in ok]),
        "tool_calls_per_run": med([sum(t["toolCalls"] for t in r["turns"]) for r in ok]),
        "uncached_input_per_run": med([sum(t["input"] + t["cacheWrite"] for t in r["turns"]) for r in ok]),
        "cache_hit_t2_4": med([cache_hit(t) for t in later]) if later else None,
        "-- per turn 2-4 --": "",
        "turn_s": med([t["seconds"] for t in later]) if later else None,
        "first_text_s": med(first) if first else None,
        "requests": med([t["requests"] for t in later]) if later else None,
        "tool_calls": med([t["toolCalls"] for t in later]) if later else None,
        "output_tokens": med([t["output"] for t in later]) if later else None,
        "hidden_output_tokens~": med(hidden) if hidden else None,
        "visible_chars": med([t["visibleChars"] for t in later]) if later else None,
        "teaching_chars": med([t["teachingChars"] for t in later]) if later else None,
        "admin_share": med([t["adminChars"] / t["visibleChars"] for t in later if t["visibleChars"]]) if later else None,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--repeats", type=int, default=3)
    ap.add_argument("--scenario", action="append", choices=sorted(SCENARIOS))
    ap.add_argument("--variant", action="append", default=[],
                    help="extra variant NAME=PATH to a study-clock.js version (repeatable)")
    ap.add_argument("--max-time", type=int, default=300)
    ap.add_argument("--model")
    ap.add_argument("--out")
    args = ap.parse_args()

    if shutil.which("omp") is None:
        print("omp not found on PATH", file=sys.stderr)
        return 2
    # Each variant is a full .omp snapshot (skills, commands, extensions), so prompt
    # and extension changes are compared together and edits during a run cannot leak in.
    # NAME=PATH: PATH is either an .omp directory or a study-clock.js file (used with
    # this repository's current .omp).
    snap = Path(tempfile.mkdtemp(prefix="clock-eval-omp-"))
    sources = {"baseline": (REPO / ".omp", False), "clock": (REPO / ".omp", True)}
    for spec in args.variant:
        name, _, path = spec.partition("=")
        sources[name] = (Path(path).resolve(), True)
    variants: dict[str, tuple[list[Path], Path]] = {}
    for name, (src, with_clock) in sources.items():
        omp_copy = snap / name / ".omp"
        if src.is_dir():
            shutil.copytree(src, omp_copy)
        else:
            shutil.copytree(REPO / ".omp", omp_copy)
            shutil.copy2(src, omp_copy / "extensions" / "study-clock.js")
        exts = [omp_copy / "extensions" / "session-mode.js"]
        if with_clock:
            exts.append(omp_copy / "extensions" / "study-clock.js")
        variants[name] = (exts, omp_copy)

    results: dict = {"omp": subprocess.run(["omp", "--version"], capture_output=True, text=True).stdout.strip(),
                     "repeats": args.repeats, "scenarios": {}}
    for scenario in args.scenario or sorted(SCENARIOS):
        results["scenarios"][scenario] = {}
        for name, (exts, omp_dir) in variants.items():
            runs = []
            for i in range(args.repeats):
                print(f"[{scenario}] {name} run {i + 1}/{args.repeats}…", file=sys.stderr, flush=True)
                runs.append(run_once(scenario, exts, args.max_time, args.model, omp_dir))
            results["scenarios"][scenario][name] = {"summary": summarize(runs), "runs": runs}

    out = Path(args.out) if args.out else Path(tempfile.mkstemp(prefix="clock-eval-", suffix=".json")[1])
    out.write_text(json.dumps(results, ensure_ascii=False, indent=2))
    for scenario, by_variant in results["scenarios"].items():
        print(f"\n## {scenario}")
        keys = [k for k in next(iter(by_variant.values()))["summary"] if k not in ("runs",)]
        print("metric".ljust(26) + "".join(v.rjust(14) for v in by_variant))
        for key in keys:
            print(key.ljust(26) + "".join(str(by_variant[v]["summary"].get(key)).rjust(14) for v in by_variant))
    lessons = results["scenarios"]
    wanted = [("lesson", "baseline"), ("lesson", "clock")] + [("block-lesson", v) for v in variants if v != "baseline"]
    columns = [(s, v) for s, v in wanted if s in lessons and v in lessons[s]]
    if len(columns) > 1:
        print("\n## Same learner turns 2-4: no clock vs clock installed vs active block")
        print("metric".ljust(26) + "".join(f"{s}/{v}".rjust(22) for s, v in columns))
        for key in ("turn_s", "first_text_s", "requests", "tool_calls", "output_tokens",
                    "hidden_output_tokens~", "teaching_chars", "admin_share"):
            print(key.ljust(26) + "".join(str(lessons[s][v]["summary"].get(key)).rjust(22) for s, v in columns))
    print(f"\nFull results: {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
