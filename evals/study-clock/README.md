# Study-clock overhead eval

Checks whether `.omp/extensions/study-clock.js` and the **Schedule** workflow slow teaching down or crowd out teaching content. Two parts:

| Script | Cost | Measures |
| --- | --- | --- |
| `node evals/study-clock/tick-bench.mjs [extension.js]` | Local only, seconds | CPU time per one-minute tick and per-turn injection, using a fictional schedule with 300 past blocks; size of the injected text |
| `node evals/study-clock/plan-check.mjs [extension.js]` | Local only, under a second | Deterministic checks of the weekly-plan engine: budgets fully scheduled, prerequisites first, slot preference vs strict, day restrictions and grouping, `until` deficit, credit for studied minutes, today's session, invalid input, estimate calibration |
| `python3 evals/study-clock/run.py [--repeats N] [--scenario S] [--variant NAME=PATH]` | Real model calls, about 1 minute per run | The real `omp` CLI, per learner turn (below) |

## Variants

- `baseline`: the current `.omp/` without the clock extension.
- `clock`: the current `.omp/` with it.
- `--variant NAME=PATH`: PATH is either a whole `.omp/` directory (for example a copy taken before a change, so skill and extension changes are compared together) or a single `study-clock.js` file. Every variant is snapshotted at start.

Each run uses a disposable workspace with `.omp/`, `templates/` and `docs/`, without `.teacher/`, so no learner data is involved. Runs use `--no-session`, explicit extensions, and fictional, session-only Spanish prompts. This costs real model calls.

## Scenarios

- `lesson`: a four-turn fractions lesson that never mentions time.
- `block-lesson`: the same learner turns 2–4, but turn 1 opens a 60-minute study block. Comparing turns 2–4 of `lesson`/`baseline` with `block-lesson`/`clock` shows what an active block costs each teaching turn.
- `scheduled`: exercises the feature itself (task estimate, "how much time is left?").

## Per-turn metrics (turns 2–4, medians)

| Metric | Meaning |
| --- | --- |
| `turn_s` | Seconds from sending the learner message to the end of the reply |
| `first_text_s` | Seconds until the learner sees the first reply text. Tool calls made before writing delay it. |
| `requests`, `tool_calls` | Model round trips and tool calls in the turn |
| `output_tokens` | All generated tokens, including hidden reasoning |
| `hidden_output_tokens~` | Output tokens not explained by visible text or tool arguments, counted with `omp toks`. An approximation of reasoning the learner never sees. |
| `teaching_chars` | Visible characters in sentences that do not mention time, the clock, the block, or minutes |
| `admin_share` | Fraction of visible text spent on time/schedule administration (deterministic keyword classifier; deliberately over-counts) |

The run also prints per-run totals: requests, tool calls, uncached input tokens, and cache hit on turns 2–4.

How to read it: wall time varies with provider load, so trust consistent differences in tool calls, requests, `first_text_s`, and `admin_share` more than a few seconds of `turn_s`. The keyword classifier is not a judgment of teaching quality; read the saved replies (`text` in the JSON output) before concluding that teaching changed.
