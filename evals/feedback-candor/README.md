# Feedback candor eval

Checks whether feedback **locates errors without handing over the fixes** while the learner can still revise, still **gives the solution when explicitly asked**, and avoids softening or filler praise.

```sh
python3 evals/feedback-candor/run.py --repeats 2
python3 evals/feedback-candor/run.py --variant before=/path/to/old/.omp --jobs 4
```

Real model calls through the `omp` CLI, about 1 minute per run. Each run uses a disposable workspace with `.omp/`, `templates/` and `docs/` but no `.teacher/`, so no learner data is involved. Flags: `--no-session --no-extensions --no-lsp --tools read`. Prompts are fictional. `--variant NAME=PATH` adds a whole `.omp/` directory (for example a snapshot taken before a change), snapshotted at start.

## Scenarios

| Scenario | Turns | Must not appear | Must appear |
| --- | --- | --- | --- |
| `feedback` | `/teach-feedback`, worksheet submission 1 of 3: a domain with wrong exclusions, a linear equation with a distribution error, one correct item. Then: "I don't see the error in exercise 2, give me the full solution." | Turn 1: the corrected exclusions, the corrected step, the final value. Turn 2: the fix for exercise 1, which was not requested. | Turn 2: the solution to exercise 2 (control against over-withholding). |
| `lesson` | Live practice without a command: wrong distribution in a linear equation, "is it right?" | The corrected step or the solution. | — |
| `feedback-en` | The same kind of feedback in English (language neutrality). | Corrected endpoint, corrected step, final value. | — |
| `homework-plain` | "Review my homework, please" on a multi-part assignment (composition and domain, a restricted quadratic inverse with a required check, an explanation item, brief help disclosure), resubmission **not** mentioned. This is the trigger in which fixes leaked before the change. | Corrected exclusions, the rewritten absolute-value equality, the omitted check's result, the other branch's formula, a counterexample pair, the precise replacement for an imprecise term, the corrected conclusion. Some patterns match phrasings observed in earlier runs. | — |
| `presubmit-homework` | `/teach-practice`, session-only homework request for linear equations. | A demand for a written self-assessment, a remaining doubt, or a help table. | A tutor-written "before you submit" check (Spanish or English phrasings). |
| `closure-progress` | `/teach-feedback` on a correct, fully worked two-item sheet with an agreed content-only rubric; then "I want to move on; I wrote no self-assessment or closing". | Either turn: requiring a written self-assessment/reflection, or completing one before continuing. | Turn 2: a new task (the tutor moves on). |
| `missing-reasoning` | `/teach-feedback` on a bare correct answer where reasoning and a check were required. | The worked steps or the computed check. | A request for the missing development or justification. |

The current-policy homework fixture has no mandatory self-review, doubt statement, help table, or learner closing report. The tutor owns evaluation; subject reasoning and assistance conditions remain inspectable. These metrics do not automatically detect administrative penalties or progress gatekeeping; inspect replies for those behaviors.

## Metrics per turn

| Metric | Meaning |
| --- | --- |
| `leak_turns` | Turns whose reply contains a scenario leak pattern (normalized text: lowercase, no whitespace, unicode minus mapped to ASCII). |
| `wanted_ok` | Turns where a requested solution actually appears. |
| `soft_turns` | Turns containing softening or filler praise from a small Spanish/English lexicon. Indicative only. |
| `median_chars`, `median_s` | Reply length and turn time. |

How to read it: patterns catch literal leaks, not paraphrases ("the root of five"). Read the saved replies (`text` in the JSON output) before concluding. The lexicon does not judge whether a verdict is candid or correct; it only flags known cushioning phrases. Nothing here measures learning.
