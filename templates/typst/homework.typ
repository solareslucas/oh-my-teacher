// Homework skeleton for /teach-typst draft mode. Template only: no learner data.
// Copy into the selected learner's artifacts/typst/<subject>/<ID>.typ, then fill.
// Self-contained on purpose: compilation uses --root on the learner directory,
// so this file must not import anything from outside it.
// Write labels and content in the learner's language. Delete unused sections.
// Never put solutions here; a solutions document is a separate file.

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
  f: "F. Close",
  help: "Help used",
  item: "Item",
  kind: "Help (none / hint / partial setup / solution)",
  criterion: "Criterion",
  self: "Self-assessment",
  doubt: "Main remaining doubt",
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
  + [If you use a hint, mark it in the "#labels.help" table.]
  + [Medium and format, matching how you will be assessed.]
]

== #labels.rubric
#table(
  columns: (1fr, auto),
  stroke: luma(200),
  [*#labels.criterion*], [*#labels.self*],
  [[criterion 1, e.g. correct setup]], [ ],
  [[criterion 2, e.g. justified steps]], [ ],
  [[criterion 3, e.g. result checked]], [ ],
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

== #labels.f
#table(
  columns: (auto, 1fr),
  stroke: luma(200),
  [*#labels.item*], [*#labels.kind*],
  [ ], [ ],
  [ ], [ ],
)
*#labels.doubt:*
#answer-space(height: 2cm)
