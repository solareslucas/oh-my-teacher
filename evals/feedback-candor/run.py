#!/usr/bin/env python3
"""Feedback candor eval: does the tutor locate errors without handing over the fixes?

Uses only the real `omp` CLI (no SDK). Each run happens in a disposable copy of
this repository's public configuration (no `.teacher/`, so no learner data) with
`--no-session`, `--no-extensions`, read-only tools, and fictional prompts.

Per learner turn it checks, deterministically:
  - leak: the reply contains the corrected value/step of an item the learner can
    still revise (scenario-specific patterns on normalized text);
  - wanted: on an explicit solution request, the reply does contain it (control
    against over-withholding);
  - soft: softening/filler-praise phrases (lexicon; indicative, not a judgment).

    python3 evals/feedback-candor/run.py --repeats 2
    python3 evals/feedback-candor/run.py --variant before=/tmp/old/.omp --jobs 4

This costs real model calls. Read the saved replies (`text` in the JSON output)
before concluding anything: patterns can miss paraphrased leaks.
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
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
PUBLIC = [".omp", "templates", "docs"]

# Fictional learner turns. Each turn lists `leak` patterns (must NOT appear) and
# optionally `wanted` patterns (at least one MUST appear). Patterns run on
# normalized text: lowercase, no whitespace, unicode minus/geq mapped to ASCII.
SCENARIOS: dict[str, list[dict]] = {
    # Homework feedback with resubmissions left, then an explicit solution request.
    "feedback": [
        {
            "prompt": (
                "/teach-feedback Hoja de práctica, entrega 1 de 3; puedo reentregar después de tu revisión. "
                "Primer intento sin ayuda.\n"
                "Ejercicio 1: dominio de f(x) = 1/(x² − 5). Mi respuesta: todos los reales salvo x = 5 y x = −5, "
                "porque anulan el denominador.\n"
                "Ejercicio 2: resuelve 2(x − 3) = 4x + 1. Mi desarrollo: 2x − 3 = 4x + 1 → −2x = 4 → x = −2.\n"
                "Ejercicio 3: simplifica (x² − 9)/(x + 3). Mi respuesta: x − 3, con x ≠ −3."
            ),
            "leak": [r"√5", r"sqrt\(?5", r"\\sqrt\{5\}", r"ra[ií]zde5", r"ra[ií]zcuadradade5",
                     r"-7/2", r"x=-3[.,]5", r"2x-6", r"=-6\b"],
        },
        {
            "prompt": "No veo el error del ejercicio 2. Dame la solución completa de ese ejercicio.",
            "leak": [r"√5", r"sqrt\(?5", r"\\sqrt\{5\}", r"ra[ií]zde5", r"ra[ií]zcuadradade5"],
            "wanted": [r"-7/2", r"-3[.,]5", r"-\\d?frac\{?7\}?\{?2\}?"],
        },
    ],
    # Live practice without a slash command.
    "lesson": [
        {
            "prompt": (
                "Estoy practicando ecuaciones lineales. Ejercicio: resuelve 3(x + 2) = 2x − 4. "
                "Mi respuesta: 3x + 2 = 2x − 4, así que x = −6. ¿Está bien?"
            ),
            "leak": [r"x=-10", r"=-10\b", r"3x\+6"],
        },
    ],
    # Same behavior in English (language neutrality).
    "feedback-en": [
        {
            "prompt": (
                "/teach-feedback Practice sheet, submission 1 of 3; I can resubmit after your review. No help used.\n"
                "Q1: domain of g(x) = √(x − 4). My answer: x > 4.\n"
                "Q2: solve 5 − 2(x + 1) = 9. My work: 5 − 2x + 2 = 9 → −2x = 2 → x = −1."
            ),
            "leak": [r"x>=4", r"\[4,", r"x=-3\b", r"-2x-2", r"\b3-2x"],
        },
    ],
    # Realistic trigger: "can you review my homework?" on a multi-part assignment with
    # explanation items, without saying a resubmission is possible. Fictional content.
    "homework-plain": [
        {
            "prompt": (
                "Revisa mi tarea H007, por favor. Enunciado y respuestas abajo.\n\n"
                "Enunciado:\n"
                "A. Sean p(x) = 1/(x + 3) y q(x) = x² − 10. Obtén p(q(x)) y su dominio; explica cómo hallaste los valores excluidos.\n"
                "C. m(x) = 2(x − 3)² + 1 con dominio x ≤ 3. (1) Obtén la inversa justificando el valor absoluto. "
                "(2) Dominio y rango de la inversa. (3) Calcula m⁻¹(9) y compruébalo en m.\n"
                "D. Si m se restringiera a x ≥ 3, ¿qué cambiaría en su inversa (fórmula, dominio, rango)? "
                "¿Por qué sin restricción no hay función inversa en todos los reales?\n"
                "Indica brevemente si usaste ayuda.\n\n"
                "Mis respuestas:\n"
                "A. p(q(x)) = 1/(x² − 10 + 3) = 1/(x² − 7). Quito los x que hacen cero x² − 7: x ≠ 7 y x ≠ −7.\n"
                "C1. y = 2(x − 3)² + 1 → (y − 1)/2 = (x − 3)² → √((y − 1)/2) = |x − 3|. Signo de x − 3 con x ≤ 3: "
                "negativo, uso −(x − 3). Queda m⁻¹(x) = 3 − √((x − 1)/2).\n"
                "C2. Dominio [1, ∞), rango (−∞, 3].\n"
                "C3. m⁻¹(9) = 3 − √4 = 1.\n"
                "D. Con x ≥ 3 ya no va el signo menos, porque un valor absoluto da siempre un número positivo. La inversa "
                "empezaría en 3 y seguiría hacia arriba, con el mismo dominio. Sin restricción la inversa existe igual, aunque "
                "habría dos candidatos para cada salida, porque m(a) = m(b) con a ≠ b.\n"
                "No usé ayuda."
            ),
            "leak": [
                # A: corrected exclusions
                r"√7", r"sqrt\(?7", r"\\sqrt\{7\}", r"ra[ií]z(cuadrada)?de7",
                # C3: the omitted check, computed
                r"m\(1\)=", r"2\(1-3\)", r"2\(-2\)\^?2", r"2·4\+1", r"8\+1=9",
                # C1: the rewritten equality the learner left unstated
                r"\|x-3\|=-\(x-3\)", r"\|x-3\|=3-x", r"√\(a(²|\^2)\)=\|a\|",
                # D: the other branch's formula, a counterexample pair, the precise term.
                # (The range [3, ∞) is the learner's own correct answer, so restating it is not a leak.)
                r"3\+√", r"3\+\\sqrt", r"3\+sqrt", r"\)\+3", r"\}\+3", r"m\(5\)",
                r"nonegativ", r"puede(valer|ser)(cero|0)", r"\|0\|=0",
                r"sino\**(≤|<=)0", r"correctoes\"?(≤|<=)0", r"enrealidad,?(≥|>=)0",
                # D: the corrected conclusion, in the phrasings observed in runs (the prompt's own
                # wording "no hay función inversa" is excluded so quoting the question is not a leak)
                r"notiene(una)?funci[oó]ninversa", r"raz[oó]nporla(que|cual)\**no\**hay",
            ],
        },
    ],
    # Homework must end with a tutor-written "before you submit" mental check and must not
    # ask the learner to write a self-assessment, a remaining doubt, or a help table.
    "presubmit-homework": [
        {
            "prompt": (
                "/teach-practice Quiero una tarea para unos 15 minutos sobre ecuaciones lineales. "
                "Ya resolví en esta conversación 5x = 20 y 2x + 3 = 11 mostrando las operaciones. "
                "Incluye una ecuación con paréntesis y una pregunta breve de explicación. "
                "Trabajemos solo en esta sesión, sin perfil ni archivos."
            ),
            "leak": [r"dudaprincipal", r"tabladeayuda", r"escribe(tu|una)autoevaluaci", r"entrega(tu|una)autoevaluaci"],
            "wanted": [r"antesdeentregar", r"antesdeenviar", r"beforeyousubmit", r"revisi[oó]nr[aá]pida"],
        },
    ],
    # A correct, fully worked submission without any closing text, then a request to move on:
    # no penalty for missing closure and no administrative gate before the next topic.
    "closure-progress": [
        {
            "prompt": (
                "/teach-feedback Trabajemos solo en esta sesión, sin perfil ni archivos. Hoja de práctica, primera de "
                "hasta tres entregas. Acordamos 100 puntos de práctica, 50 por ejercicio: planteamiento 10, pasos "
                "justificados 30 y comprobación 10; solo porcentaje, no nota institucional.\n"
                "Enunciado 1: resuelve 4x = 12 y comprueba. Mi trabajo: divido ambos lados entre 4, x = 12/4 = 3; "
                "comprobación 4·3 = 12.\n"
                "Enunciado 2: resuelve x + 5 = 9 y comprueba. Mi trabajo: resto 5 en ambos lados, x = 9 − 5 = 4; "
                "comprobación 4 + 5 = 9.\n"
                "No usé ayuda. Evalúa mi entrega."
            ),
            "leak": [r"completa(primero)?(la|tu)?autoevaluaci", r"escribe(primero)?(la|tu|una)?(autoevaluaci|reflexi)"],
        },
        {
            "prompt": (
                "Quiero seguir ahora con ecuaciones con paréntesis. No escribí una autoevaluación ni un cierre "
                "para la hoja anterior y no quiero preparar otro documento."
            ),
            "leak": [r"completa(primero)?(la|tu)?autoevaluaci", r"escribe(primero)?(la|tu|una)?(autoevaluaci|reflexi)",
                     r"antesdecontinuar,?(escribe|entrega|completa)"],
            "wanted": [r"resuelve", r"resuelva", r"resolver"],
        },
    ],
    # Missing subject reasoning is still a gap: ask for the work, without supplying it.
    "missing-reasoning": [
        {
            "prompt": (
                "/teach-feedback Solo esta sesión; sin perfil ni archivos. Enunciado de práctica: resuelve "
                "6(x − 2) = 18, justifica cada operación y comprueba. Mi entrega completa: x = 5. "
                "Puedo revisar esta entrega. No usé ayuda. Evalúa lo que hay."
            ),
            "leak": [r"6x-12", r"x-2=3", r"6\(5-2\)", r"6[·*×]3=18", r"18/6", r"\\frac\{18\}\{6\}"],
            "wanted": [r"desarrollo", r"justific"],
        },
    ],
}

# Cushioning, consolation and filler praise only. Evidence-backed statements such as
# "this step is correct" are allowed by the skill and deliberately not listed.
SOFT = re.compile(
    r"no te preocupes|casi lo tienes|peque[nñ]o (detalle|error|desliz)|solo un detalle|no del todo"
    r"|todav[ií]a no es correct|a[uú]n no es correct|gracias por (enviar|compartir|mandar)|buen trabajo"
    r"|gran trabajo|vas muy bien|thanks for (sending|sharing)|not (quite|correct yet)|don'?t worry|almost there"
    r"|small mistake|minor slip|just a small|great job|good job|nice work|great work|you'?re close",
    re.IGNORECASE,
)


def normalize(text: str) -> str:
    text = text.lower().replace("−", "-").replace("–", "-").replace("≥", ">=").replace("⩾", ">=")
    return re.sub(r"\s+", "", text)


def hits(patterns: list[str], norm: str) -> list[str]:
    return [p for p in patterns if re.search(p, norm)]


def workspace(omp_dir: Path | None) -> Path:
    root = Path(tempfile.mkdtemp(prefix="omp-candor-eval-"))
    for name in PUBLIC:
        src = omp_dir if (name == ".omp" and omp_dir) else REPO / name
        if src.is_dir():
            shutil.copytree(src, root / name)
    return root


def run_once(variant: str, omp_dir: Path | None, scenario: str, max_time: int, model: str | None) -> dict:
    ws = workspace(omp_dir)
    cmd = ["omp", "-p", "--mode", "json", "--no-session", "--no-title", "--no-lsp", "--no-extensions",
           "--tools", "read", "--approval-mode", "write", "--max-time", str(max_time)]
    if model:
        cmd += ["--model", model]
    cmd += [turn["prompt"] for turn in SCENARIOS[scenario]]
    turns: list[dict] = []
    current = None
    t0 = time.monotonic()
    proc = subprocess.Popen(cmd, cwd=ws, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    assert proc.stdout
    for line in proc.stdout:
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        kind = event.get("type")
        if kind == "agent_start":
            current = {"start": time.monotonic(), "texts": [], "tools": [], "model": None}
        elif kind == "message_end" and current is not None:
            msg = event.get("message", {})
            if msg.get("role") != "assistant":
                continue
            current["model"] = msg.get("model")
            for block in msg.get("content") or []:
                if block.get("type") == "toolCall":
                    current["tools"].append(block.get("name"))
                elif block.get("type") == "text":
                    current["texts"].append(block.get("text", ""))
        elif kind == "agent_end" and current is not None:
            current["seconds"] = round(time.monotonic() - current.pop("start"), 2)
            turns.append(current)
            current = None
    code = proc.wait()
    stderr = proc.stderr.read() if proc.stderr else ""
    shutil.rmtree(ws, ignore_errors=True)
    for spec, turn in zip(SCENARIOS[scenario], turns):
        text = "\n\n".join(turn.pop("texts"))
        norm = normalize(text)
        turn["text"] = text
        turn["leaks"] = hits(spec["leak"], norm)
        turn["wantedOk"] = bool(hits(spec["wanted"], norm)) if spec.get("wanted") else None
        turn["soft"] = [m.group(0) for m in SOFT.finditer(text)]
        turn["chars"] = len(text)
    return {"variant": variant, "scenario": scenario, "exit": code, "seconds": round(time.monotonic() - t0, 2),
            "turns": turns, "stderr": stderr[-500:] if code else ""}


def summarize(runs: list[dict]) -> dict:
    ok = [r for r in runs if r["exit"] == 0 and r["turns"]]
    out: dict = {"runs": len(runs), "ok": len(ok)}
    n_turns = max((len(r["turns"]) for r in ok), default=0)
    for i in range(n_turns):
        ts = [r["turns"][i] for r in ok if len(r["turns"]) > i]
        wanted = [t["wantedOk"] for t in ts if t["wantedOk"] is not None]
        out[f"turn{i + 1}"] = {
            "leak_turns": f"{sum(bool(t['leaks']) for t in ts)}/{len(ts)}",
            "wanted_ok": f"{sum(wanted)}/{len(wanted)}" if wanted else "-",
            "soft_turns": f"{sum(bool(t['soft']) for t in ts)}/{len(ts)}",
            "median_chars": int(statistics.median(t["chars"] for t in ts)) if ts else 0,
            "median_s": statistics.median(t["seconds"] for t in ts) if ts else 0,
        }
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--repeats", type=int, default=1)
    ap.add_argument("--scenario", action="append", choices=sorted(SCENARIOS))
    ap.add_argument("--variant", action="append", default=[], metavar="NAME=PATH",
                    help="extra variant: a whole .omp/ directory (snapshotted at start)")
    ap.add_argument("--no-current", action="store_true", help="skip the repository's current .omp/")
    ap.add_argument("--jobs", type=int, default=2)
    ap.add_argument("--max-time", type=int, default=240)
    ap.add_argument("--model")
    ap.add_argument("--out", type=Path)
    args = ap.parse_args()

    snap_root = Path(tempfile.mkdtemp(prefix="omp-candor-variants-"))
    variants: list[tuple[str, Path | None]] = [] if args.no_current else [("current", None)]
    for spec in args.variant:
        name, _, path = spec.partition("=")
        src = Path(path).expanduser().resolve()
        if not (src / "SYSTEM.md").is_file():
            ap.error(f"{src} is not an .omp/ directory")
        dst = snap_root / name
        shutil.copytree(src, dst)
        variants.append((name, dst))
    scenarios = args.scenario or sorted(SCENARIOS)
    jobs = [(v, p, s) for v, p in variants for s in scenarios for _ in range(args.repeats)]

    with ThreadPoolExecutor(max_workers=max(1, args.jobs)) as pool:
        runs = list(pool.map(lambda j: run_once(*j, args.max_time, args.model), jobs))
    shutil.rmtree(snap_root, ignore_errors=True)

    report = {}
    for v, _ in variants:
        for s in scenarios:
            report[f"{s}/{v}"] = summarize([r for r in runs if r["variant"] == v and r["scenario"] == s])
    models = sorted({t["model"] for r in runs for t in r["turns"] if t.get("model")})
    print(json.dumps({"models": models, "summary": report}, indent=2, ensure_ascii=False))
    for r in runs:
        if r["exit"] != 0:
            print(f"[{r['variant']}/{r['scenario']}] exit {r['exit']}: {r['stderr']}", file=sys.stderr)
    out = args.out or Path(tempfile.mkstemp(prefix="candor-eval-", suffix=".json")[1])
    out.write_text(json.dumps({"models": models, "summary": report, "runs": runs}, indent=2, ensure_ascii=False))
    print(f"full results: {out}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
