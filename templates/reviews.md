# Manual retrieval review queue

Template only: no learner data or scheduled jobs. Keep this queue in chat if session-only; copy to `.teacher/learners/<alias>/reviews.md` only after `/teach-profile` selection and explicit persistence consent. Read the selected current record before use and reread before an authorized update. Do not read another learner's queue. Preserve corrections and evidence history.

The learner returns and requests `/teach-review`; this file does not send reminders or run in the background. Relative intervals work without a calendar. Before assigning a calendar date, establish the learner's local date context rather than guessing. No entry is overdue until a meaningful due date is known; missing a review is not an observed learning failure.

## Queue overview

Maintain one row per narrow objective/retrieval task. Placeholders below are instructions, not actual reviews. IDs such as R001 and E001 describe a local ID format only.

| Review ID | Domain / objective | Queue state | Next learner-chosen opportunity | Basis / evidence IDs |
| --- | --- | --- | --- | --- |
| [stable ID] | [specific objective] | [pending / due / paused / complete] | [relative interval or agreed date; unknown allowed] | [actual evidence or no prior attempt] |

“Complete” means this review task is complete, not that an entire domain is mastered. Preserve prior attempts; update the next opportunity after an actual response or explicit scheduling choice. Do not silently mark a planned attempt as completed.

## Review item details

Repeat this block for each real item only when needed.

### [Review ID — domain / objective]

- Source objective / evidence IDs: [progress.md references or visible session turns]
- Ability and conditions: [e.g. mathematical reasoning; language reading vs writing; target variety/register; actual input modality]
- Retrieval cue: [one fresh prompt to recall/explain/apply before seeing a model; no answer embedded]
- Success criteria: [observable task-specific criteria; valid alternatives and relevant limits]
- Novelty: [how this differs from the worked example; transfer requirement if appropriate]
- Prior attempt reference / actual date: [known value or no attempt yet]
- Prior assistance and access support: [actual help; whether it supplied the answer]
- Proposed next opportunity: [relative interval or agreed local date; learner may change it]
- Scheduling rationale: [recent difficulty, independent recall, elapsed delay, goal, availability]
- Status / uncertainty: [pending, due, paused, complete; unknown evidence stays unknown]

Do not store a model answer beside a learner-facing cue or reveal it before the attempt unless requested. Use a new equivalent task after a solution was shown; repeating the supplied answer is not independent retrieval. A safe feedback explanation can be given after the response without requiring a stored answer bank.

## Attempt history

Append only actual attempts, linking progress evidence as appropriate. Keep original unknowns unknown unless the learner supplies a correction.

### [Review ID / attempt reference]

- Actual date/session and elapsed delay: [known values or unknown; distinguish immediate practice from later retrieval]
- Prompt used / response: [brief relevant excerpt or authorized reference]
- Support: [independent / hint / partial scaffold / model supplied; relevant access support separately]
- Criteria observed: [what succeeded, what failed, what is unobservable]
- Evidence type: [inspected work / self-report / inference, clearly separated]
- Feedback / repair / fresh task: [actual activity, not a future attempt recorded as done]
- Next opportunity and rationale: [agreed or proposed; distinguish proposal from commitment]
- Linked evidence ID: [progress.md or session reference]

## Practical review decisions

- Ask one cue and wait before re-teaching. Retrieve rather than simply reread; allow alternate correct methods or language forms under the stated criteria.
- After unsuccessful or assisted recall, repair the specific gap, try a fresh task, and propose a shorter delay. After independent recall, try a new application and propose a longer delay. Availability and goals matter; no fixed doubling formula is required.
- A possible starting pattern is the next study session, a few days later, then roughly a week later. This is a practical adjustable heuristic, not a validated optimal schedule or a guarantee of retention. Dates are proposals for manual action, not notifications.
- Track independent novel transfer and later independent retrieval separately. Only their joint evidence supports “provisionally secure” for the narrow objective; do not infer durable mastery from one easy item, immediate repetition, recognition, or self-confidence.
- For language, vary meaningful context and keep abilities separate; text recall does not establish pronunciation/listening. For a proof, review assumptions and a changed case; for scientific reasoning, a new prediction; for source analysis, a new passage. Choose relevant tasks rather than applying all categories to everyone.
- If no queue/history exists, start with one learner-chosen objective now. A session-only copyable cue, criteria, and proposed next opportunity are enough for a usable review plan.
