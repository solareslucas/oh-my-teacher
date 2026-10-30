# Adaptive teaching and language learning

This repository supplies OMP-native instructions and commands, not a teaching service, hidden learner database, voice engine, or background reminder service. A native study clock times study blocks only while an OMP session is open (see `/teach-schedule`). The same workflow can support an age-five counting activity, a beginner adult's new subject, an expert child's interest, or PhD-level argument. **Age guides safety and presentation, not assumed competence.** The learner's actual response determines the next step; a model can make errors, and important work needs appropriate source checking and human review.

## Start without a profile

```text
/teach-start Help me understand equivalent fractions in Portuguese. I have ten minutes.
/teach-lesson Explain one proof step in the dominated convergence theorem; assume measure theory basics.
/teach-language I want to practice polite Japanese requests. Explain in Spanish; text only.
```

No learner file is needed. Intake reuses known information, asks only 1–3 relevant questions when necessary, and can start from one safe diagnostic. With a young learner, prefer one simple question or activity rather than a form. Explanation language, prior knowledge, goal, time, and access preferences matter; broad age/stage is optional. Exact birthdate, school, address, diagnoses, and private contact details are not needed.

“Session-only” means no learner record files are written. It does **not** mean the conversation disappears: OMP history and the model provider may retain chat. Keep sensitive information out of requests. The session can still contain a complete lesson, practice, feedback, review cue, and evidence-grounded report. At the end, ask for a copyable summary if continuity would help.

For optional persistence, use `/teach-profile` to explicitly consent and select a pseudonymous alias. Only the selected learner's current `.teacher/learners/<alias>/profile.md`, `progress.md`, `reviews.md`, and authorized optional `artifacts/` are used. Alias syntax is `[a-z0-9][a-z0-9-]{0,47}`; never use a real name as an arbitrary path. No default learner, private-profile discovery, or cross-learner reading is needed. Selection and saving are explicit; permission to save does not authorize exporting or sharing. The templates contain instructions and placeholders, not actual student records. Profile correction and forgetting are handled by `/teach-profile`; deleting local learner files does not erase provider or OMP history/backups.

## A short teaching loop

| Command | What it does now |
| --- | --- |
| `/teach-start` | Conversational intake and one useful starting prompt. |
| `/teach-lesson` | One measurable objective, short explanation, worked example, and learner turn. |
| `/teach-practice` | One live task, or homework built from subject sections A–E chosen by evidence, with a delivery format, rubric, ID, and no answers; F is tutor feedback only. |
| `/teach-feedback` | Inspect actual work, identify a consequential gap, and invite one revision. |
| `/teach-review` | Ask one manual retrieval cue before reteaching; propose the next opportunity. |
| `/teach-report` | Summarize evidence, limits, and next steps; no invented grades. |
| `/teach-language` | Distinguish subject support from target-language learning and use the matching workflow. |
| `/teach-typst` | Draft or compile a Typst document from `artifacts/typst/` into `artifacts/pdf/` for the explicitly selected, consenting learner; Typst must already be installed. |
| `/teach-resume` | For an explicitly named learner: status, pending homework, due review, then continue per the recorded study plan. |
| `/teach-schedule` | Plans or runs a timed study block on the host clock. Each task gets a calibrated estimate; a task that would not fit becomes the last one and is cut down to the remaining time. Checks run every minute only while OMP is open. |

Commands accept ordinary requests after their names. `/teach-language` can also select Lesson, Practice/homework, Feedback, Review, or Report explicitly. A command routes to a skill section; it is not a background process or an assurance that facts have already been verified.

Each live turn should contain **one useful chunk, then a chance to respond**. It should not front-load an entire course or keep questioning before teaching. Adaptation depends on observed performance:

- **Independent success:** ask for reasoning or a fresh transfer task; increase one dimension of challenge if appropriate.
- **Success after a hint/model:** acknowledge the success, record the support, fade it, and try a new parallel task. Do not call it independent mastery.
- **An error:** locate the first consequential gap; offer a small hint, then a partial scaffold or worked contrast if needed. Revisit a prerequisite when the response supports that choice.
- **Unclear response, overload, or fatigue:** clarify one point, change response mode, reduce the load, or pause. Do not infer a diagnosis or ability ceiling.

Feedback is candid: a plain verdict, then each consequential error located and classified, without softening or unearned praise. While the learner can still revise, the tutor does not write the corrected value, step, or answer; the learner repairs it, asking for the next hint-ladder rung if needed. Full solutions are available on explicit request or once no revision remains. There is no punitive lock on requests; showing an answer simply changes what subsequent performance can establish (and, under a learner-defined grading scheme, freezes that item's score). Grades appear only when the learner's plan defines a scheme. Access support is recorded separately from answer-supplying hints: an accessible format is not automatically evidence of dependence.

Support is calibrated **per component, not per person**. An experienced developer learning a new language, or a musician on a new instrument, may solve the design or musical problem alone yet need a worked example for the new syntax, library, or technique. Give that example in a different context so it does not solve the task, leave the demonstrated parts to the learner, and treat a tool name or documentation link as a pointer, not an example. Where the familiar domain's rules differ, probe for carried-over habits with a predict-then-explain item.

"Different context" means a different solution structure, not renamed variables. An example that becomes the solution after swapping its nouns, values, or identifiers, or that follows the task's step sequence, lets the learner copy instead of design. The tutor checks each example, hint, and starter file against the task before sending it, and cuts it down to the isolated new component or changes the task. Section B's worked example/parallel problem pairs remain for novices, but success on a structural twin is recorded as supported, and project deliverables never get one.

## Homework design

Homework is built from subject sections chosen by the learner's evidence, not from fixed counts: **A** retrieval without notes on earlier objectives, **B** a worked example then a parallel problem (faded as independence appears), **C** interleaved practice, **D** explanation, **E** guided investigation. **F**, if used, is tutor feedback only: the tutor owns grading, feedback structure, and evaluation justification. Every assignment states its delivery format: first attempt without notes or AI, reasoning submitted, and a format matching how the learner will be assessed. Help disclosure is brief natural language; ask a focused question if needed, not for a table or report. Learner self-grading, a remaining doubt, a closing report, and an administrative change note are not completion or progress gates. Reflection is optional unless it is itself an agreed learning objective; subject reasoning, checks, drafts, and revision evidence remain necessary. Answers never appear in the assignment; solutions are separate. Subject-specific evidence (code that runs, proofs, drafts, recordings, sources) follows `.omp/skills/adaptive-tutor/references/subjects.md`. Sources and limits: [homework evidence](homework-evidence.md).

Each assignment ends with a **before you submit** check written by the tutor: two fixed questions (every part answered? every requested check done?) and one question specific to the task, built from its rubric and the learner's earlier omissions, never revealing an answer. It is a one-minute mental pass: nothing is written, submitted, or graded. Its purpose is to practise catching omissions before single-attempt exams, where no tutor points them out. When grading, the tutor records how many points were lost to omissions in each submission; if that number does not fall over several assignments, the check is revised or dropped. The rationale and its limits are in [homework evidence](homework-evidence.md) (C12).

A learner who wants homework every session records that in the study plan of their profile; the tutor then assigns it without asking again, until the learner changes the plan.

## From age-five activities to PhD rigor

The following are **illustrative designs, not learner observations or fixed age tracks**. Use demonstrated knowledge and access needs to choose among them.

- **Age-five-friendly start:** a caregiver may read, “Here are three dots: ● ● ●. Add one dot. How many now?” Accept a typed number or described drawing, give one concrete response, and stop for the child's turn. If successful independently, vary the arrangement rather than merely repeating the same display. Do not claim to see a drawing that was not provided or accessible. Use safe materials; avoid small choking hazards and ask for caregiver help with physical activities when appropriate.
- **New subject at any age:** show why two equal-sized halves make one whole, then ask the learner to describe a different example. An adult novice deserves clear examples without baby talk; a child with strong prior knowledge may need a harder problem rather than more repetition.
- **Secondary/undergraduate reasoning:** work through one dimensional-analysis example, then ask for a new setup with different units and a reasonableness check. Distinguish an arithmetic slip from a misunderstanding of the model.
- **PhD-level rigor:** focus on one claim and its assumptions. For example, derive why pointwise convergence alone does not justify exchanging a limit and integral: on `[0,1]`, let `f_n(x) = n` when `0 < x < 1/n`, and `0` otherwise. For every fixed `x`, eventually `f_n(x)=0`, so the pointwise limit is zero; each integral is `n × (1/n)=1`. Then ask the learner which hypothesis of the theorem they intended to use has not been established. This is a derivation/counterexample, not a claim that the learner has mastered measure theory. A specialist empirical claim, current literature judgment, or assertion of research novelty requires verified sources and human scrutiny, not confident prose.

For every level, choose one reachable objective and assess the response. Do not make safety hazardous in pursuit of realism, contact a child privately, request secrecy, or arrange off-platform meetings. Respect graded-assessment rules: explain, scaffold, and provide permitted feedback instead of supplying dishonest submissions. No diagnosis or authoritative clinical/legal/financial directives.

## Multilingual subjects are not language placement tests

Examples of requests in several scripts:

```text
/teach-start Explique frações em português; quero entender por que 1/2 = 2/4.
/teach-language Subject support: اشرح الكسور بالعربية، خطوة واحدة ثم سؤال.
/teach-language Acquisition: 日本語で丁寧な依頼を練習したいです。説明はスペイン語で。
/teach-start प्रकाश संश्लेषण हिंदी में समझाइए। पहले एक छोटा उदाहरण दीजिए।
/teach-language Lesson: Help me revise an English seminar argument for careful academic hedging, not casual conversation.
```

The first, second, and fourth requests concern a **subject in a chosen explanation language**. The third and fifth concern **acquiring or refining a target language/register**. A learner may combine both, but the evidence must separate subject knowledge from language proficiency. Correct science with imperfect grammar is not failed science; fluent grammar does not prove correct science.

Support any requested language to the model's real ability. There is no promise of equal quality across languages, scripts, dialects, or technical registers. State a specific limitation, ask for a trusted sample/source, narrow the task, or recommend qualified review rather than silently using English or inventing native-speaker authority. No English pivot is required. Preserve scripts and right-to-left ordering; offer transliteration/glosses only when useful or requested. Preferred language is not a proxy for nationality or first language.

Keep reading, writing, listening, spoken production, interaction, mediation/translation, and script familiarity distinct. A text conversation can demonstrate written performance; it cannot establish listening comprehension or pronunciation. Text-only coaching may describe articulation, syllables, stress, or cautiously labeled IPA/transliteration, but cannot claim to hear an accent, play audio, inspect signing, or confirm a sound. Even with genuinely accessible audio, feedback is limited to what can actually be heard; a transcript is not acoustic evidence.

Vary communicative difficulty and register from a meaningful beginner phrase to advanced argument, pragmatics, or specialist genre. Ask about target variety when consequential; do not treat dialect differences as defects. In a fluency task, meaning-first feedback with one or two selected corrections can preserve the conversation. Controlled form practice may justify immediate correction; detailed editing is available on request. These are agreed practical strategies, not a universal method.

Label a natural translation, literal gloss, transliteration, and paraphrase differently. Retain original text when useful, explain ambiguity or lost nuance, and do not claim certified equivalence. Cultural/register claims can be uncertain too. Children practice with fictional safe situations, not real private contacts; high-stakes translations need qualified human review.

## Homework that can actually be used

Request a manageable assignment rather than a worksheet dump:

```text
/teach-practice Homework: equivalent fractions, about ten minutes, paper or text only. Include a rubric and an optional extension, not the answers yet.
```

A usable assignment names its purpose, materials/prerequisites, approximate time, instructions, and visible success criteria. For instance, a **proposed practice rubric**, not a school grade, might check equal partitioning, equivalent values, and an explanation. Return one approachable example and a fresh application; add transfer only when appropriate. An optional extension is not required to count the work as complete. If the learner asks for an answer key, provide it and record its effect on independence.

On return, use `/teach-feedback` with the task, actual attempt, and any agreed rubric. Feedback should reference the visible work, distinguish conceptual and execution errors, provide a concrete next step, and invite revision. An inaccessible photo or audio file cannot be scored as though inspected. If necessary, ask for a readable transcription or assess only the available part.

## Evidence, review, and cautious mastery

`templates/progress.md` records narrow domain objectives and actual evidence: task, visible work or labeled self-report, known date/session, independence/assistance, access support, criterion results, uncertainty, and next step. `templates/reviews.md` supplies answer-free cues, criteria, evidence links, actual attempt history, and a learner-chosen next opportunity. The same small ledger can remain entirely in chat.

Evidence states are deliberately narrow:

1. **Not observed:** no relevant work available.
2. **Supported:** success used a hint, scaffold, or model.
3. **Independent now:** fresh task completed without answer-supplying help.
4. **Transfer observed:** independent use in a genuinely changed context/representation.
5. **Retention observed:** independent retrieval after an actual delay.
6. **Provisionally secure:** both independent novel transfer and later independent retrieval documented for this objective, with their evidence and limits.

These are recordkeeping labels, not validated measurement scales. One retained vocabulary item is not language proficiency; one successful proof step is not mastery of a field. Immediate repetition, confidence, copied examples, attendance, and homework completion cannot establish durable mastery. Later difficulty reopens an objective without erasing its earlier evidence.

Run reviews manually: return with `/teach-review`, attempt one cue **before** the explanation, receive feedback, and agree on a next opportunity. After unsuccessful/assisted recall, repair and propose a shorter delay; after independent recall, try a changed application and propose a longer delay. “Next study session, a few days later, roughly a week later” is one adjustable starting heuristic, **not an optimal algorithm**. Use relative intervals if dates are unknown; confirm local date context for calendar plans. The repository does not send reminders. A missed appointment is not a failed retrieval attempt.

## Reports without guessed grades

```text
/teach-report Summarize today's fraction reasoning for me. Separate independent and hinted work, and tell me what is still not observed.
/teach-language Report: summarize written Japanese polite-request practice; do not infer speaking or listening ability.
```

A report states scope, evidence coverage, strengths/gaps tied to actual tasks or evidence IDs, support conditions, transfer/retrieval status, rubric findings for observed criteria only, and concrete next steps. Separate inspected work, learner self-report, interpretation, and unknowns. If no attempts are available, produce a baseline plan with “not yet observed,” not a story of improvement.

An **illustrative reporting pattern**, only to be filled with real evidence, is: “On [task/evidence ID], you [observed action] independently. On [other actual task], a hint supplied [specific step]. Novel transfer is [evidenced/not observed]; later retrieval is [evidenced/not observed]. Next, try [task] and revisit it at [chosen opportunity].” Do not treat the brackets as completed history. No chat length or confident style justifies a school grade, CEFR certification, diagnosis, intelligence judgment, or publication-readiness claim. A requested practice score needs an explicit rubric and sufficient visible evidence; missing criteria remain not observed.

Reports appear in chat by default. Saving/exporting needs explicit consent and an approved destination; publishing or sharing externally needs separate approval and appropriate human review. Do not cross-read learners to create rankings.

## Evidence basis and limits

The [IES/What Works Clearinghouse practice guide, *Organizing Instruction and Study to Improve Student Learning* (2007)](https://ies.ed.gov/ncee/wwc/PracticeGuide/1) gives recommendations on spacing, alternating worked examples and problem solving, connecting representations, retrieval, and explanatory questions. Its opened recommendation page rates evidence differently: spacing and alternating examples/practice are marked moderate; retrieval quizzes to re-expose key content and deep explanatory questions strong; some pre-questioning and study-allocation recommendations minimal. This is not evidence that every implementation works equally or that a chat model has been validated as a tutor for every age, language, disability, or discipline.

The short-turn interaction, hint fading choices, separate ability records, status labels, feedback preferences, and manual review intervals here are **practical design heuristics informed by those principles**, not a clinically or educationally validated optimal teaching algorithm. The guide does not validate this repository, prescribe these exact intervals, or prove the mastery labels. Language examples illustrate workflow behavior, not efficacy findings or universal cultural norms.

During actual teaching, distinguish a checked derivation from a sourced empirical claim and an illustrative story. Important empirical, contested, current, and specialist claims require opening relevant authoritative passages; a search snippet or DOI resolution alone is not verification. If browsing/source access is unavailable, say what is unverified, request a source, or narrow the activity to derivations and explicitly provisional explanations. Never fabricate citations, promise infallibility, exhaustive coverage, or research novelty.
