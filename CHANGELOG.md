# Changelog

## 2026-10-24

- Added an OMP-native adaptive teacher/research-mentor role, sticky safeguards, and project-local privacy defaults without SDK usage, hooks, runtime dependencies, or a pinned model.
- Added `adaptive-tutor`, `language-coach`, and `research-methods` skills, with eleven `/teach-*` command entry points.
- Added manageable lessons, homework rubrics, evidence-aware feedback/reports, manual retrieval review, and separate subject/language/modality evidence.
- Added opt-in pseudonymous learner profiles, scoped consent, corrections, local forgetting, selected-record continuity, and Git-ignored private storage.
- Added source-access distinctions, reproducible search records, claim-level provenance, bias/applicability/version checks, and honest paper/protocol workflows with human review.
- Added blank record templates and setup, teaching, research, architecture, privacy, and observed-verification guides.
- Corrected profile operations to stop after profile management instead of silently beginning a lesson; verified the corrected behavior through OMP.
- Added `/teach-typst`, which compiles (or drafts and compiles) a Typst document from the selected, consenting learner's `artifacts/typst/` into `artifacts/pdf/` with `--root` confined to that learner directory; verified compile, path-traversal rejection, and no-alias behavior through OMP.
- Rebuilt homework around a bounded evidence scan (`docs/homework-evidence.md`): sections A–F chosen from the learner's evidence (retrieval, faded worked examples, interleaving, explanation, guided investigation, self-assessment), an explicit delivery format (first attempt without notes or AI, reasoning submitted, format matching the target assessment), assignment IDs, and no answers in assignments.
- Added subject profiles (`.omp/skills/adaptive-tutor/references/subjects.md`) defining what to submit, how it is checked, needed modality, and what the tutor cannot observe, for mathematics, proofs, programming, languages, labs, writing, history, art/design, music, clinical, and motor skills.
- Added a learner-set study plan to the profile template; a recorded homework expectation is followed without re-asking until changed.
- Added `templates/assignments.md`, `templates/typst/homework.typ`, the `/teach-resume` command and **Resume** workflow, and homework drafting in `/teach-typst`.

## 2026-10-25

- `adaptive-tutor` now calibrates support per component rather than per person: Intake notes which prior knowledge from an adjacent area transfers and where rules differ; Lesson gives worked examples for new tools/notation in a different context while leaving already demonstrated parts to the learner, treats naming a tool as a pointer rather than an example, and checks carried-over habits with predict-then-explain items; homework section B applies fading per component. Documented in `docs/teaching.md`; evidence and its limits (an extension of the expertise-reversal source, not a direct finding) in `docs/homework-evidence.md`; verified through OMP with fictional scenarios.

## 2026-10-26

- `adaptive-tutor` now requires examples, hints, and starter files to differ from the task in solution structure, not just in names: if renaming an example's identifiers, values, or nouns produces the solution, or it follows the task's step sequence, the tutor cuts it down to the isolated new component or changes the task. Success on a structurally identical parallel problem (section B) is recorded as supported, and project deliverables never get a structural twin. Documented in `docs/teaching.md`; the rule is labeled a design inference in `docs/homework-evidence.md`; checked through OMP with two fictional scenarios (`docs/verification.md`).
- Added a dependency-free native session-mode extension: `--no-session` uses per-turn meaningful learner-record updates only with explicit selection and ongoing saving consent; normal sessions batch updates at checkpoints. Teaching reuses loaded instructions and records, avoids rewriting unchanged profiles, and keeps pending evidence in a compact conversation ledger. Explicit cadence preferences and immediate save/correction requests remain available; unknown mode falls back to checkpoints. Abrupt exits can lose unflushed changes. Reasoning, evidence checks, and privacy requirements are unchanged. See `docs/verification.md` for exercised CLI scenarios and limits.
