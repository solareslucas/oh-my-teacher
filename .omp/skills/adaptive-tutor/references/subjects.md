# Subject profiles

Each subject decides four things: what the learner submits as evidence, how that evidence is checked, which tool or modality the tutor needs, and what the tutor cannot observe. Read the matching profile before designing practice, homework, or feedback. Sources and access limits are in `docs/homework-evidence.md` (repository-relative); entries marked † there were not independently re-verified.

These profiles are starting points, not rules that override the learner's actual assessment format, assessment rules, or safety. If a subject is missing, define the same four fields with the learner before assigning work, and say which parts rest on evidence and which on judgment.

## Mathematics (calculation and problem solving)

- **Submit:** worked solutions with setup, steps, and a check, not only final numbers.
- **Check:** the reasoning step by step; a correct final answer alone may hide a wrong method. Use interleaved problem types so the learner must choose a method.
- **Needs:** text or Typst; a photo of handwritten work only if the model reads images.
- **Cannot observe:** work done off-screen; whether a typed answer was produced without help unless declared.

## Mathematics (proofs)

- **Submit:** a written argument with stated hypotheses; optionally a short summary of the proof's logical structure.
- **Check:** each inference and the use of hypotheses; ask for a changed case or a counterexample. A proof assistant such as Lean checks every step but requires its formal syntax and a local installation; offer it only if the learner wants it and it is installed.
- **Needs:** text or Typst; Lean is optional.
- **Cannot observe:** reliable automatic grading of informal proofs; treat judgments as provisional.

## Programming

- **Submit:** runnable code plus a short explanation of the approach.
- **Check:** actually run it and run tests when tools allow; report real output only. Also review readability, structure, and efficiency where relevant. Automated checks mostly find errors, so add how to fix and what to try next. Hidden tests or reference solutions are not shown before the attempt.
- **Needs:** code files under the learner's `artifacts/code/<subject>/`, an approved shell for execution.
- **Cannot observe:** that code ran unless the run is actually performed or its output is supplied.

## Languages

- **Submit:** separate evidence per mode: reading, writing, listening, speaking, interaction, mediation.
- **Check:** written text shows writing only. Interaction needs a real exchange. Pronunciation and listening need audio.
- **Needs:** follow `skill://language-coach`; audio only if the model supports it.
- **Cannot observe:** pronunciation or listening from text.

## Laboratory sciences

- **Submit:** predictions, experimental design, data (real or clearly labeled simulated), analysis, and limitations.
- **Check:** reasoning, variables and controls, units, and the link from data to conclusion. Virtual or simulated labs support conceptual learning; hands-on skills need real practice.
- **Needs:** text, tables, simulations; physical work only when safe, ordinary, and supervised by a responsible adult where appropriate.
- **Cannot observe:** hands-on technique or lab safety. Never propose dangerous experiments.

## Writing

- **Submit:** successive drafts with the plan and a note of what changed.
- **Check:** feedback on one or two priorities per draft, then a revision; self-assessment with a rubric before submitting.
- **Needs:** text or Typst; keep each version.
- **Cannot observe:** authorship beyond what is declared; do not produce the graded text for the learner.

## History and source-based humanities

- **Submit:** analysis of real documents: who wrote it, why, when, for whom, and how it compares with other sources.
- **Check:** sourcing, context, corroboration, and the claim's support; a plausible reading is not a verified fact.
- **Needs:** actual primary sources supplied or opened; follow `skill://research-methods`.
- **Cannot observe:** sources that were not actually opened.

## Art and design

- **Submit:** the artifact (image or file) and the learner's account of intentions and decisions, across iterations.
- **Check:** critique while the work is in progress, focused and respectful; prepare the learner for critique.
- **Needs:** images only if the model reads them; otherwise a described artifact, labeled as such.
- **Cannot observe:** the artifact itself without image support.

## Music and other performance

- **Submit:** a recording.
- **Check:** compare against agreed criteria; durable learning needs a later performance without feedback.
- **Needs:** audio support in the model; otherwise only theory, analysis, and practice planning.
- **Cannot observe:** sound or performance from text.

## Clinical and professional practical skills

- **Submit:** reasoning on cases (think-aloud, differentials, justification).
- **Check:** knowledge and reasoning only. Performance in real practice requires direct observation by qualified humans.
- **Needs:** text cases labeled as illustrative.
- **Cannot observe:** real practice. No personalized clinical, legal, or financial directives.

## Physical education and motor skills

- **Submit:** practice plans and self-observation notes; video only with privacy care and never for children without a trusted adult.
- **Check:** against an agreed model and cues.
- **Needs:** video support in the model, if any.
- **Cannot observe:** movement from text. Physical tasks for children require a trusted adult.
