# Oh My Teacher

An OMP-native workspace for adaptive learning, language practice, and evidence-based research—from early learning to doctoral work. It uses instructions, skills, and Markdown slash commands; **no SDK, application server, or dependencies**.

The student is the starting point: goals, preferred language, prior knowledge, access needs, time, and demonstrated understanding. Age guides safe presentation, not presumed ability. Models can still make mistakes: this configuration requires checking, honest uncertainty, and source attribution rather than promising infallibility.

The tutor owns grading, feedback, and evaluation justification. Homework uses evidence-selected subject sections A–E; F, if included, is tutor feedback only. Learners provide subject reasoning, checks, and revision evidence, with brief natural-language disclosure of help—not mandatory self-grading, a help table, a remaining doubt, or a closing report. Each assignment ends with a tutor-written one-minute "before you submit" check aimed at omissions; nothing is written, submitted, or graded for it, and points lost to omissions are tracked to judge whether it helps. Missing administrative closure does not block progress; reflection is optional unless it is itself an agreed learning objective.

## Start

1. Install and authenticate [Oh My Pi](https://github.com/can1357/oh-my-pi) using its own setup instructions.
2. Open a terminal **at this repository root** and run:

   ```sh
   omp --no-session
   ```

3. Begin naturally, or invoke a command:

   ```text
   /teach-start I want to understand fractions. Explain in Portuguese. I have 15 minutes.
   ```

`--no-session` avoids saving this OMP conversation. It does **not** change the model provider's retention policy, prevent external integrations from logging, or make the chat confidential. Omit the flag if you intentionally want OMP history. Don't upload sensitive information.

Use any model supported by your OMP installation, for example `omp --no-session --model <your-model-id>`. This repository does not pick a provider or modify global settings. Language quality, tools, context size, instruction following, and speech/image support depend on that model and your installation; universal language fluency and equal results across models are not guaranteed.

## Commands

Arguments are natural language, not a fixed form. Commands work in the learner's language; their names stay stable across languages. Ordinary conversation works too.

| Command | Purpose | Example |
| --- | --- | --- |
| `/teach-start` | Set a goal and find a useful starting point | `/teach-start Quero aprender divisão, com exemplos curtos.` |
| `/teach-lesson` | One manageable concept and a learner turn | `/teach-lesson Explain eigenvectors; I know matrix multiplication.` |
| `/teach-practice` | Exercises or homework with criteria | `/teach-practice Ten minutes of practice on fractions; no answers yet.` |
| `/teach-feedback` | Feedback on actual work and a next attempt | `/teach-feedback I solved 3x = 12 as x = 9. Where did I go wrong?` |
| `/teach-review` | Retrieval of earlier material | `/teach-review Ask me to recall what we studied yesterday.` |
| `/teach-report` | Evidence-based progress and next steps | `/teach-report What have I demonstrated, and what is still untested?` |
| `/teach-language` | Target-language practice with adjustable support | `/teach-language 日本語で買い物の会話を練習したいです。` |
| `/teach-research` | Frame and investigate a research question | `/teach-research What evidence links retrieval practice to delayed recall?` |
| `/teach-sources` | Evaluate a source for a particular claim | `/teach-sources Does this paper support my causal claim? [source]` |
| `/teach-paper` | Develop a supported manuscript or honest protocol | `/teach-paper Help plan a literature review; I have not collected data.` |
| `/teach-profile` | Optional learner selection, saving, corrections, forgetting | `/teach-profile save learner-a` |
| `/teach-typst` | Compile or draft a Typst document (homework, summary, report) into the selected learner's `artifacts/` | `/teach-typst learner-a matematica-1/tarea-01` |
| `/teach-resume` | Continue with a named learner: status, pending homework, then the next step per their plan | `/teach-resume learner-a` |
| `/teach-schedule` | Timed study block on the host clock: plan, check pace, adapt the last task, close | `/teach-schedule learner-a MAT000 for 2 hours from now` |

For source examples, replace `[source]` with an actual link or passage. Links are inspected when tools permit; an inaccessible paper is not treated as read. In an ordinary lesson, expect a brief explanation or worked example followed by something to try—not an entire course dumped into one turn. Request a direct answer or complete worked solution when that is more useful.

## Optional continuity

Learning works without files. If you want continuity between sessions:

1. Ask `/teach-profile save learner-a` with a pseudonymous alias. The teacher explains scope and asks consent **before** creating records.
2. Authorized records live in `.teacher/learners/learner-a/`: `profile.md` (including your study plan), `progress.md`, `reviews.md`, `assignments.md`, and optional `artifacts/`.
3. In another session, explicitly resume that alias: `/teach-resume learner-a` (or only select it with `/teach-profile select learner-a`). Nothing auto-selects a learner.
4. Use `/teach-profile correct ...` or `/teach-profile forget ...` to change or remove selected information. File deletion needs exact-scope approval; it does not erase provider logs, OMP history, or backups.

### Faster teaching turns

Normal saved OMP sessions keep a compact working ledger in the conversation and batch authorized learner-file updates at checkpoints (end of a lesson segment, homework handoff, explicit save/report, pause/end, or profile switch). Micro-exercises do not trigger routine file operations. Loaded instructions and selected records are reused; files are refreshed before actual writes. This reduces administrative tool calls, not reasoning or necessary source checks.

In `--no-session` mode, an explicitly selected profile with ongoing saving consent receives meaningful updates each turn, because the conversation itself will not be saved by OMP. Only changed records are touched: a new explanation alone does not justify rewriting progress or the profile. No profile selection or consent means **no learner-file saves in either mode**.

You can request “save at checkpoints,” “save each meaningful turn,” or “save only when I ask.” Pending changes are not yet in learner files and may be lost on an abrupt exit or context loss; checkpoints are not a background autosave or shutdown guarantee. Conversation history is not a substitute for a flushed learner record when starting a fresh session.

Mode detection uses the project's native `.omp/extensions/session-mode.js`; it exposes only whether OMP persistence is enabled, not the session filename or learner data. If you disable extension discovery, add `--extension .omp/extensions/session-mode.js` to keep detection. Without a runtime notice, mode is unknown and checkpoint cadence applies. Persistence-enabled does not guarantee that a transcript has reached disk.

### Timed study blocks

`.omp/extensions/study-clock.js` gives the teacher a deterministic clock instead of guessed times. It adds the current local time (and any active block) to every turn and provides the `study_clock` tool:

- `plan` a block (“MAT000 for 2 hours, now” or “at 18:00”), `begin` a planned block, `pause`, `resume`, `extend`, `end`, `cancel`, `status`, `list`.
- `pause` freezes the current block and task without ending either; `resume` continues them and moves their deadlines by the break duration. Breaks do not count as study time or task-calibration samples. A paused block still occupies the clock, so another block cannot start over it. Weekly slots are not automatically moved; check the next subject for overlap after a break.
- Before each lesson segment (tasks are 15+ minute segments, not single exercises) the teacher calls `task_start`, or `task_next` to end one segment and start the next, with an estimate. The tool multiplies it by a calibration factor, the median of that learner's past actual/estimate ratios (same subject once three completed tasks exist, otherwise all subjects; clamped 0.5–3), and reports whether the task fits the remaining time. A task that does not fit, or leaves under 10 minutes, is the **last task**; the teacher shrinks its scope rather than overrunning. `task_end` records actual minutes, so estimates adapt over time.
- While the session is open, a check runs every minute and notifies at 15 and 5 minutes left, when a task passes its estimate or will spill past the block end, when the block ends, and when a planned block is due. The model receives the notice before its next step.
- **Weekly plans** (`plan_week`, `plan_view`, `plan_item`, `plan_status`) cover Monday–Sunday with recurring slots, for example “weekdays 19:00 for 2 h, Saturday 09:00 for 3 h, chemistry Tuesday/Thursday”. They run until a date (`until`) or until every topic's hour budget is done. Topics are queued in study order with hour budgets (taken from the learner's plan, labeled as estimates).
  - Grouping: a slot's subject is a preference (or exclusive with `strict`), and otherwise takes the next topic. `days` restricts a topic to certain days, and `after` makes prerequisites go first. Short topics share a slot.
  - Projection and adaptation: the calendar and per-course finish dates are projected from now and from minutes actually studied, so a missed or short session moves the dates. With `until`, the tool reports hours that do not fit and the extra minutes per week needed.
  - Each day: the clock lists that day's session and topics, notifies when it is due, and `begin` with the plan starts it (early or late). Ending the block credits the studied minutes to those topics.

  ```
  /teach-schedule learner-a weekly plan for cycle 1: Mon–Fri 19:00 for 2 h, Saturday 09:00 for 3 h, until done; chemistry Tue/Thu
  ```

Without an alias the schedule lives only in memory for this session. With an explicitly selected alias, `persist: true`, and consent covering the file, it is stored in `.teacher/learners/<alias>/schedule.json`. Checks need a running OMP session: nothing notifies you when OMP is closed, and time on task is planning data, not evidence of learning. With `--no-extensions`, add `--extension .omp/extensions/study-clock.js`. To measure its overhead against a run without it, see [`evals/study-clock/`](evals/study-clock/README.md).

`.teacher/` is Git-ignored, not encrypted or access-controlled. For young children, use trusted-adult supervision and session-only mode until an adult is involved in persistence. For different people, use fresh OMP sessions; for privacy isolation, separate OS accounts/checkouts. Switching a profile cannot remove the previous conversation from context.

The project disables OMP memory, auto-learning, auto-resume, and workspace-tree inclusion. User extensions, MCP services, CLI overrides, provider retention, and operating-system backups remain outside this configuration's control. Review your integrations. Review dates are manual suggestions; the study clock only checks time inside a running session, and no notification service runs when OMP is closed.

## Research and honesty

Research distinguishes actual observations from proposals, sourced claims from inferences, and full text from abstracts or snippets. It tracks sources, methods, limitations, and contradictions. It does not fabricate citations, results, novelty, ethics approval, or publication status. Without enough evidence, it produces a limited answer or a protocol—not a fake completed study. Publication requires human review and your explicit approval for any external action.

## Guides

- [Teaching, homework, review, and language practice](docs/teaching.md)
- [Evidence behind homework design](docs/homework-evidence.md)
- [Research and publication workflows](docs/research.md)
- [Design, evidence basis, native OMP behavior, and privacy](docs/design.md)
- [Observed verification and limits](docs/verification.md)
- [Change history](CHANGELOG.md)

Native configuration is in `.omp/`; blank record formats are in `templates/`. Restart OMP after editing prompts or skills. Launch from the root: starting in a subdirectory can miss commands/settings or select a nearer `.omp/` context. Don't pass `--no-skills`, `--no-rules`, or a replacement system prompt if you want this configuration intact.

Initial compatibility target: OMP 18.12.6. The native session-mode extension is optional for teaching but needed for automatic mode-aware cadence. The SDK is a last resort and will not be introduced without first explaining why native configuration is insufficient and asking you.
