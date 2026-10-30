// Homework skeleton for /teach-typst draft mode. Template only: no learner data.
// Copy into the selected learner's artifacts/typst/<subject>/<ID>.typ, then fill.
// Self-contained on purpose: compilation uses --root on the learner directory,
// so this file must not import anything from outside it.
// Write labels and content in the learner's language. Delete unused sections.
// Never put solutions here; a solutions document is a separate file.
// The tutor fills the rubric and feedback; never require learner self-grading.
// Keep help disclosure conversational and ungraded; no mandatory closing form.
// "Before you submit" is a tutor-written mental check: 2 fixed + 1 task-specific
// question aimed at omissions. Nothing is written, submitted, or graded.

#let labels = (
  homework: "Homework",
  objectives: "Objectives",
  time: "Estimated time",
  delivery: "How to work and submit",
  rubric: "Success criteria",
  a: "A. Retrieval without notes",
  b: "B. New objective: worked example, then your turn",
  c: "C. Mixed practice",
  d: "D. Explain",
  e: "E. Guided investigation",
  check: "Before you submit",
  f: "F. Tutor feedback",
  criterion: "Criterion",
  evidence: "Evidence assessed by the tutor",
  answer: "Your work",
)

#let meta = (
  id: "H000",
  title: "[Title]",
  subject: "[Subject]",
  date: "[date or unknown]",
  lang: "en",
)

#set document(title: meta.id + " " + meta.title)
#set page(paper: "a4", margin: 2cm, numbering: "1 / 1")
#set text(lang: meta.lang, size: 11pt)
#set heading(numbering: none)
#set enum(numbering: "1.")

#let answer-space(height: 4cm) = block(
  width: 100%, height: height, stroke: (paint: luma(180), dash: "dashed"),
  radius: 3pt, inset: 6pt,
  text(fill: luma(150), size: 9pt, labels.answer),
)

#let note(body) = block(
  width: 100%, fill: luma(245), inset: 8pt, radius: 3pt, body,
)

#align(center)[
  #text(size: 16pt, weight: "bold")[#meta.id — #meta.title]\
  #meta.subject · #meta.date
]

#note[
  *#labels.objectives:* [objective 1]; [objective 2]\
  *#labels.time:* [approximate time]
]

== #labels.delivery
#note[
  + [First attempt without notes, AI, or solutions.]
  + [Show your reasoning, not only final answers.]
  + [If help was used, mention it briefly; the tutor asks a focused question if needed.]
  + [Medium and format, matching how you will be assessed.]
]

== #labels.rubric
#table(
  columns: (1fr, 1fr),
  stroke: luma(200),
  [*#labels.criterion*], [*#labels.evidence*],
  [[criterion 1, e.g. correct setup]], [[work to inspect; points only under an agreed grading scheme]],
  [[criterion 2, e.g. justified steps]], [[work to inspect]],
  [[criterion 3, e.g. result checked]], [[work to inspect]],
)

== #labels.a
+ [Prompt on an earlier objective.]
  #answer-space(height: 3cm)

== #labels.b
#note[[Worked example with reasoning. Remove once the learner solves these independently.]]
+ [Parallel problem.]
  #answer-space()

== #labels.c
+ [Problem of type 1.]
  #answer-space(height: 3cm)
+ [Problem of type 2.]
  #answer-space(height: 3cm)

== #labels.d
+ [Why / how / what if / compare question.]
  #answer-space(height: 3cm)

== #labels.e
#note[
  *[Question]*\
  [Steps or scaffolds; data or sources to use; checkpoint.]\
  *[Deliverable]*
]

== #labels.check
#note[
  [Quick check, about one minute. Nothing to write or submit; not graded.]
  + [Did I answer every part of every item?]
  + [Did I do every check the prompt asks for?]
  + [Task-specific question written by the tutor from the rubric and earlier omissions; never reveals an answer.]
]

== #labels.f
#note[
  [Completed by the tutor after reviewing the work: verdict, evidence, errors, and next step.
  No learner self-assessment, mandatory doubt, closing report, or points for administrative formatting.
  Missing closure does not require resubmission or block the next topic.]
]
