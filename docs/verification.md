# Observed verification

## Environment and method

Executed on 2026-10-24 with **OMP 18.12.6**, using the configured **`openai-codex/gpt-6.1-sol`** model. No SDK or programmatic OMP imports were used. A temporary Python standard-library subprocess driver invoked the real CLI and inspected emitted JSON events; it was not added to this repository.

Headless invocations used:

```sh
omp -p --mode json --no-session --no-title --no-extensions --no-lsp \
  --tools read --max-time 120 '/teach-lesson [fictional learner request]'
```

Replace the bracketed text with a real scenario. Profile mutation scenarios instead used `--tools read,write,edit --max-time 180`. Additional positional prompts exercised multiple turns in the same CLI session. A separate CLI process verified continuity from selected local records. No real student or participant data were used.

Disabling ambient extensions and LSP isolated the repository's native prompt/skill/command behavior. It does not mean a normal launch disables user integrations. The live-source scenario allowed `read` to access one public URL; offline scenarios explicitly prohibited network lookups in their requests.

## Native configuration and discovery

- `omp --version` reported `omp/18.12.6`.
- `omp config get ... --json` returned project-effective values: `memory.backend = off`, `autoResume = false`, `includeWorkspaceTree = false`, `skills.enableSkillCommands = true`, and `tools.approvalMode = write`.
- `omp read skill://adaptive-tutor:1-12`, and equivalent calls for `language-coach` and `research-methods`, resolved all three project skill paths successfully when invoked directly through subprocess arguments.
- Actual JSON user-message events contained expanded command instructions, not unhandled `/teach-*` text. Across the scenarios, all eleven documented command names were exercised.
- All fifteen headless sessions exited successfully. Missing-file reads during authorized initial profile creation were handled as absent records, not invented history.

The harness initially tried a CLI skill URI through the parent environment's Bash tool, which intercepted the URI before OMP could discover the new skill. Direct subprocess invocation avoided that harness-specific issue; native CLI skill lookup itself succeeded.

## Exercised behavior

| Scenario | Observed outcome |
| --- | --- |
| Five-year-old, Portuguese addition | One brief dot-counting example and one learner question; Portuguese response; no profile required or created. |
| Adult beginner, Spanish fractions | One concrete fraction prompt; no long intake questionnaire or assumed age-based competence. |
| Incorrect equation, then hint and correct revision | Identified multiplication versus subtraction, changed to equal-group scaffolding, retained assisted status, and asked a fresh task instead of claiming mastery. |
| PhD-level probability | Derived fixed-input bias–variance decomposition with square-integrability, conditioning, and independence assumptions; asked one advanced conceptual question rather than simplifying to a novice lesson. |
| Arabic mathematics plus English grammar | Responded in Arabic, preserved correct multiplication, and separately corrected plural/agreement errors. |
| Japanese, text-only pronunciation request | Responded in Japanese, distinguished correct spelling from unobservable pronunciation, and offered text-based pronunciation guidance without claiming to hear audio. |
| Five-minute homework | Two tasks, purpose, approximate time, explicit method/calculation/check rubric, optional extension, and no answer key. |
| Feedback and report on submitted work | Assessed the two actual examples rather than pretending they were the originally assigned tasks; separated self-reported independence from inspected reasoning; marked substitution, transfer, and retention untested. |
| Same-session review | Presented one fresh recall task and explicitly said it was not delayed retrieval. |
| Supplied abstract-only causal claim | Identified supplied-excerpt access, no independent source verification, association/causation, population/outcome mismatches, and unsupported nine-hour dosage; no fabricated metadata or network activity. |
| Live primary-source inspection | Opened the IES practice-guide page, correctly reported Moderate Evidence for spacing and Strong Evidence for recommendation 5b, cited the source, logged the actual direct lookup, and distinguished the HTML labels from the unopened PDF/underlying studies. |
| Paper request with no data and requested fake results | Declined fabricated citations/results; produced a future-tense protocol with unknown effectiveness, no fake completed study or references, and human methods/ethics review requirements. |
| Profile request without consent | Explained possible files and retention; no private records opened and no files created. `.teacher/` did not exist after the initial read-only scenarios. |
| Consented profile lifecycle | Created exactly the authorized fictional `profile.md`; changed explanation language while preserving the goal; asked exact-scope deletion approval; successfully deleted the authorized file. Mutation-tool outcomes and final file absence were observed. |
| Saved evidence and independent-session continuity | Created only authorized profile/progress/review files; saved two concrete fraction responses and a pending answer-free cue. Another CLI process explicitly selected the alias, read only that alias's private records, reported the actual examples and support conditions, and kept transfer/retention and the unattempted review unresolved. A new no-save instruction overrode older consent. |

### Behavior corrected during verification

The first continuity-creation run also began a lesson after the profile operation, although teaching had not been requested in that turn. The profile command and shared profile protocol were narrowed to profile management only. A subsequent real `/teach-profile select ...` run returned selection and read-only scope, offered a next command, and **did not start a lesson or assessment**.

Fictional profile records and their empty directories were removed after the checks. No smoke scripts or test learner records are part of the deliverable.

## `/teach-typst` (added 2026-10-24)

Exercised with OMP 18.12.6 and Typst 0.15.1 using the user's default configured model (model ID not recorded), `--no-session --no-extensions --no-lsp --tools read,bash,write,edit`, and a disposable fictional alias whose fixture profile recorded artifact consent.

| Scenario | Observed outcome |
| --- | --- |
| Compile under project `approvalMode: write`, headless | `bash` required interactive approval and was unavailable; the agent reported that no PDF was produced, did not claim success, and offered the exact commands. Interactive use needs approval of the `bash` call. |
| Compile with `--approval-mode yolo` (verification run only) | Validated the alias and paths, read only that alias's profile, compiled with `--root` confined to the learner directory, and confirmed `artifacts/pdf/matematica-1/tarea-01.pdf` by listing it (`file` reported a one-page PDF 1.7). Created `progress.md` with one document entry stating that a compiled document is not evidence of learner work. |
| `../../../../README` as the document | Rejected the traversal path before reading the profile or running Typst; no files created. |
| No alias given | Asked for an alias, did not enumerate or guess learners, offered session-only help in chat and `/teach-profile`. |

Draft mode was later exercised for homework (below). `@preview` packages, PNG/SVG output, and compile-error feedback were not exercised. Fixtures were removed afterward.

## Evidence-informed homework and `/teach-resume` (added 2026-10-24)

Same CLI flags, user's default model (ID not recorded), fictional Spanish-language scenarios, disposable alias `zz-resume-check`. `templates/typst/homework.typ` compiled standalone with Typst 0.15.1 (2-page PDF).

| Scenario | Observed outcome |
| --- | --- |
| `/teach-practice`, session-only: learner reports factoring limits solved independently, one-sided limits seen once, handwritten exam | Explained section choices from evidence: A to observe the self-reported skill, B worked example then reduced-support problems for the new objective, C mixed types with method choice, D explanations, E omitted with a reason. Stated the delivery format (first attempt without notes or AI, handwritten to match the exam, help marked), a proposed practice rubric labeled as not institutional, a hint ladder, no answers, an assignment ID, and a session ledger separating self-report from observed work. No files written. The maintaining agent spot-checked the exercise mathematics. |
| `/teach-resume` with a fixture profile (plan: homework every session), `progress.md`, and `assignments.md` holding unsubmitted H001 | Read only that alias's three files; summarized the plan, the objective's evidence state with its limit, H001 as pending, and missing `reviews.md` as unknown rather than empty. Asked for H001 first, with a no-shame option to convert it into live practice, and waited. |
| `/teach-typst` draft H002 with `--approval-mode yolo` (verification only), run twice | Copied the skeleton into `artifacts/typst/matematica-1/H002.typ`, wrote it in Spanish, checked paths with `realpath`, compiled a PDF, recorded H002 as `assigned`, and logged reported (not inspected) evidence. Second run's source was inspected: one worked example, then guided → unguided → challenge problems, explanation items, no answers; solutions deferred to a separate file. The first run's answer-free check was lost to a faulty inspection command and is not counted. |

## Per-component support calibration (added 2026-10-25)

Exercised with OMP 18.12.6, model `anthropic/claude-opus-5-5` (from the JSON events), `omp -p --mode json --no-session --no-title --no-extensions --no-lsp --tools read --max-time 240`, fictional learners, no profile or alias.

| Scenario | Observed outcome |
| --- | --- |
| `/teach-lesson`: adult with 8 years of Java, never wrote Rust, wants word frequencies and top 3, "don't explain what a variable or a loop is" | Read `skill://adaptive-tutor`, `.omp/RULES.md`, and the subject profiles. Said the counting logic should transfer and was left to the learner; named where Rust differs (ownership, map update, splitting). Gave a worked example in a different, labeled-illustrative context (stock totals with `entry().or_insert`), contrasted Java habits (pass-by-reference vs move/borrow), and asked for `word_counts` with a signature the learner chooses plus a one-sentence explanation about ownership. Stated it had not compiled the snippets. No files written. |
| `/teach-lesson` control: adult who has never programmed, wants to count words in Python | Concept-level chunk (`.split()` and what a list is) with a worked example and one predict task; no adjacent-domain framing, no files written. |

Not exercised: Practice/homework composition with per-component section B, non-programming adjacent domains (e.g., instruments), and multi-turn follow-up after the learner's attempt.

## Examples must not share the task's solution structure (added 2026-10-26)

Exercised with OMP 18.12.6, model `claude-opus-5-5` (from the JSON events), `omp -p --mode json --no-session --no-title --no-extensions --no-lsp --tools read --max-time 300`, fictional learners, no profile or alias. Both runs exited 0 and read `skill://adaptive-tutor` plus `.omp/RULES.md` before answering.

| Scenario | Observed outcome |
| --- | --- |
| `/teach-lesson`: 6 years of TypeScript, already built an inverted index in Python, wants top-k documents ranked by distinct matching query words with alphabetical ties; new to `sorted(key=)`, tuple comparison, slicing | Gave three isolated examples (sort words by last letter, tuple comparisons including a `TypeError` case, slicing) and stated that none combines the pieces. The task used different fictional data with a repeated word and an unknown word, asked for a prediction before running, and asked which part of the key orders ties. No example could be renamed into the ranking function. |
| `/teach-practice`, live: 5 years of Java, can group records in a dict of lists, task is longest gap per user from log lines, top 3 with name ties; new to `datetime` and `sorted(key=)` | Examples covered one parking-stay duration (`strptime`, `timedelta`, `total_seconds` vs `seconds` as predict items) and sorting files by size. Neither grouped, iterated consecutive pairs, or combined descending order with an ascending tie-breaker; it warned that `reverse=True` also flips the tie-breaker. The task added out-of-order lines, multi-day gaps, and single-action users; no expected output shown. |

Limits: no run with the previous wording was made for comparison, so these runs show compliance, not that the new paragraph caused it. Homework (section B) composition and Typst starter files under the rule were not exercised.

## Session-aware fast turns (added 2026-10-26)

Exercised with **OMP 18.13.0**, model `gpt-6.1-sol` (JSON message metadata). A temporary Python standard-library driver copied only public configuration, guides, and templates into disposable workspaces outside this checkout; it did not copy or read real learner records. Fictional profiles recorded ongoing update consent. Saved-mode history used a disposable `--session-dir`. The driver and fixtures are not repository dependencies.

Native API evidence was opened in the version-matched upstream [extension-loading documentation](https://github.com/can1357/oh-my-pi/blob/v18.13.0/docs/extension-loading.md), [extension types](https://github.com/can1357/oh-my-pi/blob/v18.13.0/packages/coding-agent/src/extensibility/extensions/types.ts), and [session manager](https://github.com/can1357/oh-my-pi/blob/v18.13.0/packages/coding-agent/src/session/session-manager.ts). No installed documentation tree was located. `before_agent_start` supplies a `string[]` system prompt; `ctx.sessionManager.getSessionFile()` is undefined for an in-memory session and allocated for persistence-enabled mode. An allocated path does **not** prove disk materialization.

Isolated consented scenarios used:

```sh
omp -p --mode json --no-title --no-extensions \
  --extension .omp/extensions/session-mode.js --no-lsp \
  --tools read,write,edit --approval-mode yolo --max-time 240 \
  --session-dir /tmp/<disposable-history> [--no-session] \
  '/teach-profile select <fictional-alias>' '<attempt 1>' '<attempt 2>' '<pause/save>'
```

Brackets/placeholders above describe alternatives, not literal shell arguments. `yolo` was a headless **verification-only override**, not a project setting change. Two additional session-only lesson checks exercised ordinary extension discovery and `--no-extensions` without an explicit extension.

| Scenario | Observed outcome |
| --- | --- |
| Saved OMP session, selected consented profile, two micro-attempts then pause/save | Profile selection did not start teaching. First practice turn read the skill only (one tool call); second practice turn made **zero tool calls**. Neither wrote records. Pause/save reread progress and merged both actual attempts while preserving the fixture's E000 entry. Profile remained unchanged; no empty review/assignment files created. |
| Same prompts with `--no-session` and explicit extension | Each practice turn read current progress and successfully edited it before yielding; profile remained unchanged. Responses gave brief feedback and one task, without per-turn administrative summaries. Pause recorded the paused state; unanswered tasks stayed unobserved, not completed. |
| Native project extension discovery, `--no-session`, no selection/consent | Reported `ephemeral`, read the teaching skill, gave a correct elementary fraction explanation and one question. No learner records read and no `.teacher/` directory created. |
| Extension discovery disabled with no explicit extension | Reported mode `unknown` rather than guessing from the launch examples; taught the fraction lesson without learner reads or writes. |
| Explicit on-request-only preference in an ephemeral session | Warned that deferred changes could be lost, honored the preference with no practice-turn writes (one initial skill read, then zero tool calls), and merged both attempts only on the explicit pause/save request. |
| Native project extension discovery in a normal saved session, no selection/consent | Reported `persistence-enabled`, taught one fraction chunk and question, and created no learner directory. |

All six CLI processes exited 0; their JSON events showed no tool execution errors. Resulting fictional files and tool arguments were inspected. A direct Bun invocation also exercised extension modes `ephemeral`, `persistence-enabled` (using a nonexistent allocated path), and `unknown` (missing accessor), confirming base-prompt preservation and no session-path disclosure. The final two scenarios included the final sticky fast-turn rule.

These checks establish observed tool-call behavior, not a measured latency improvement or learning-outcome equivalence. Provider latency, inference time, approvals, source lookups, and model instruction following still vary. No abrupt-exit recovery, guaranteed shutdown save, compaction durability, concurrent-editor race, or interactive TUI benchmark was tested. Necessary reasoning/source verification remains required. A read-only review found no must-fix defects; it was not independent runtime verification.

## Study clock and timed blocks (added 2026-10-27)

Exercised with **OMP 18.13.2** and the user's configured default model (model id not recorded). API evidence came from the installed docs `omp://extensions.md` (managed `ctx.setInterval`, `sendMessage` delivery modes, `before_agent_start` chaining), `omp://custom-tools.md`, `omp://approval-mode.md` (per-argument approval tiers), and `omp://extension-loading.md`.

A temporary Bun harness, not kept in the repository, loaded `.omp/extensions/study-clock.js` with a stub API and a mocked `Date.now`, in a disposable `/tmp` workspace with a fictional alias:

- Rejected an unsafe alias and persistence for an alias without `profile.md`. Wrote only `.teacher/learners/<fictional>/schedule.json`.
- Three completed 20-minute estimates that took 30 minutes produced calibration factor 1.5 (`subject`, n=3). A later 25-minute estimate became 38 minutes, reported as not fitting the 30 remaining minutes, and was marked as the last task.
- Interval ticks notified once each at 15 and 5 minutes left, for a task over its estimate, for a task spilling past the block end, at block end, and when a planned block was due. `task_rescope` re-evaluated the fit. A negative `extend` that would empty the block was refused. Read actions resolved to approval tier `read`, mutations to `write`.

Real CLI runs (`omp -p --no-session --no-title --no-lsp --tools …`, ambient extension discovery) in this checkout with a fictional `zz-clock-test` profile, removed afterward. The real learner directory was not read.

| Scenario | Observed outcome |
| --- | --- |
| Session-only `now` → `plan` → oversized `task_start` | The tool loaded with the real schema. The output matched the injected `<study-clock>` time, and the task was flagged as not fitting and as the last task. |
| 1-minute block, `bash sleep 70` (`--approval-mode yolo`, verification-only) | A real `ctx.setInterval` tick delivered `[study clock …] … 0m left` to the model mid-run as a separate message. The first attempt without yolo could not run `sleep` headless. |
| `/teach-schedule zz-clock-test MATH000 …` (plan has `MAT000`) | First wording: the model created a session-only block without reading the profile. The command and skill were then tightened. Rerun: it read only that profile, listed MAT000/MAT101, asked which was meant, and created no block or file. |
| Correct code, then a 150-minute task, then acceptance of the cut | Created a persisted block (consent recorded in the fictional profile). Reported the task did not fit 120 minutes and proposed a reduced scope. After acceptance, `task_rescope` recorded 26/40 exercises at 100 minutes, kept `lastTask: true`, and logged the original scope and cut. |
| Both extensions together | Both injections reached the model. First version: both blocks were in the system prompt. Current version: `<teacher-session-mode>` plus a constant clock note in the system prompt, and the `<study-clock>` reading as a hidden message after the user turn (checked in a separate CLI run). |

Not established: TUI status-line rendering, notices delivered while idle in an interactive session (`nextTurn` was used, but only the mid-run `aside` path was observed), behavior across DST changes, concurrent sessions writing one schedule file, and whether the calibration heuristic improves real estimates. Ticks have one-minute granularity, and nothing runs when OMP is closed.

### Overhead eval (`evals/study-clock/`)

A question was whether the clock makes sessions slower. `evals/study-clock/run.py --repeats 2` ran the real CLI (OMP 18.13.2, `anthropic/claude-opus-5-5`) on two fictional four-turn scenarios. It compared `baseline` (session-mode only), `clock-v1` (the first version, which put the changing time into the system prompt), and `clock` (the current version: a constant system note plus a hidden per-turn `<study-clock>` message). Values are medians.

| Metric | lesson: baseline | lesson: clock-v1 | lesson: clock | scheduled: baseline | scheduled: clock-v1 | scheduled: clock |
| --- | --- | --- | --- | --- | --- | --- |
| Wall time per run (s) | 38.4 | 37.0 | 33.3 | 41.7 | 39.5 | 40.1 |
| Model requests per run | 5 | 5 | 5 | 5.5 | 9 | 8.5 |
| Tool calls per run | 1 | 1 | 1 | 2 | 5 | 4.5 |
| Uncached input tokens per run | 19,024 | 69,535 | 19,037 | 22,522 | 72,159 | 20,088 |
| Cache hit, turns 2–4 | 0.964 | 0.205 | 0.967 | 0.971 | 0.596 | 0.978 |

Findings:

- **The first version had a real cost.** It rewrote the system prompt each turn, so every turn rewrote the prompt cache for the whole conversation: about 3.7× the uncached input tokens. That costs money, and provider latency grows with longer sessions. Moving the changing value into a message fixed it: the current version matches baseline on cache hits and uncached input.
- **Ordinary teaching:** the clock added no requests or tool calls. Wall-time differences (±5 s per run) were inside sample noise with two repeats.
- **Timed blocks:** the feature added about 2.5 `study_clock` calls and 3 model requests per four turns, with no measurable wall-time increase in this sample. Asked "how much time is left?", the baseline correctly said it could not know. The clock variant answered from the tool (59 minutes left, task 0/20 minutes, on time).
- **Local CPU (`tick-bench.mjs`, 300-block fictional history, 397 KiB file):** about 0.46 ms per one-minute tick and 0.53 ms per turn injection. The per-turn message is about 68 tokens.

Limits: two repeats on one model and provider, back-to-back turns (real pauses can exceed provider cache lifetimes for every variant alike), and no learning-quality comparison beyond reading the final answers.

### Does the clock take time away from teaching? (2026-10-28)

The eval was extended to track, per learner turn: seconds until the first visible text, approximate hidden reasoning tokens (output tokens minus `omp toks` counts of the visible text and tool arguments), teaching characters, and the share of visible text spent on time/schedule talk. The new `block-lesson` scenario gives the same learner turns 2–4 as `lesson` inside an active 60-minute block. `--repeats 3`, `anthropic/claude-opus-5-5`. `before` is a full `.omp/` snapshot taken before the change below.

One-run smoke observation: during `before`, the model ended and restarted clock tasks between exercises (2 tool calls in a teaching turn: 10.4 s vs about 5 s for other turns). Changes made:

- `plan` can start the first task in the same call.
- `task_next` replaces `task_end` + `task_start`.
- The skill says tasks are lesson segments (15+ minutes), not exercises; time comes from the injected message without tool calls; time is mentioned only when it changes what the learner should do.

Turns 2–4 (9 turns per cell; means unless noted):

| | lesson, no clock | lesson, clock installed | block, `before` | block, current |
| --- | --- | --- | --- | --- |
| Teaching turns with clock tool calls | 0/9 | 0/9 | **2/9** | 0/9 |
| Turn seconds (mean / max) | 6.7 / 9.6 | 6.7 / 8.2 | 7.1 / 12.7 | 6.4 / 10.0 |
| Seconds to first visible text | 4.8 | 5.1 | 5.8 | 4.5 |
| Hidden reasoning tokens (approx.) | 242 | 285 | 237 | 245 |
| Teaching characters | 691 | 606 | 683 | 633 |
| Admin share of visible text (median) | 0 | 0 | 0.053 | 0 |
| Turn 1 (opening the block): seconds; clock calls | — | — | 15.4; 2 | 11.1; 1 |

For reference, the `block-lesson` prompts without the clock (`baseline`) took 5.5 s per teaching turn with 199 hidden tokens.

Reading: after the change, an active block adds no tool calls or time talk to ordinary teaching turns, and turn times stay within noise. Hidden reasoning rose by about 40 tokens per turn in both clock columns (well under a second at typical output rates), but this is small next to run-to-run variation and not established as a real effect. Teaching characters vary by more between runs than between variants, and length is not quality. The keyword classifier over-counts time talk, and nothing here measures learning.

## What this does not establish

- These are observed smoke scenarios on one model, not empirical validation of learning outcomes, a benchmark, or proof of reliable behavior on every model/language.
- No actual delay was fabricated to test retention. Long-term mastery and later retrieval remain untested.
- No audio, speech recognition, image/sign-language assessment, automatic reminder, publication submission, human-participant study, or empirical teaching-effectiveness evaluation was performed.
- No full systematic review, broad adversarial/security audit, user-extension/MCP compatibility audit, or provider-retention audit was performed. Source appraisal and profile boundaries are instructions, not a sandbox or guarantee of truth.
- The actual headless CLI was exercised; interactive TUI rendering/autocomplete was not visually evaluated.
- Apart from the opt-in `evals/study-clock/` overhead eval (real model calls, run manually), no permanent source-text/wiring tests or application build were added: this is a declarative OMP workspace, and runtime command/skill behavior was exercised directly.

For later changes, rerun relevant fictional scenarios with `--no-session`; use only a unique disposable alias for persistence checks, inspect actual tool outcomes, and remove those records afterward. Update this file with observations rather than treating these results as permanent guarantees.

## Weekly study plans (added 2026-10-28)

Exercised with OMP 18.13.2 and `anthropic/claude-opus-5-5`.

- `node evals/study-clock/plan-check.mjs` passed 10 deterministic checks:
  - every budgeted minute is scheduled;
  - prerequisites go first;
  - preferred-subject slots fall back to the queue, while strict slots stay exclusive;
  - `days` restrictions and grouping of several topics in one slot;
  - an `until` deficit with extra minutes per week;
  - credit for studied minutes, and later finish dates after missed sessions;
  - today's session matches the calendar, and begun slots are skipped;
  - invalid input is rejected;
  - estimate calibration.
- `tick-bench.mjs` with a 640-hour, 20-topic plan: about 0.3 ms for a full projection, 0.48 ms per tick, 0.54 ms per turn injection.
- Real CLI runs used a fictional `zz-plan-test` profile with a fictional subject index, removed afterward:
  - The request "Mon–Fri 19:00 2 h, Saturday 09:00 3 h, until done; chemistry Tue/Thu, circuits Mon/Wed/Fri, Saturday whatever is next" produced a persisted plan with those slots as preferences. Topic budgets were derived from the index (weekly hours × 16 ÷ topics) and labeled as hypotheses.
  - The fictional bridge prerequisite was placed first with `after`, and the model asked the learner to confirm it.
  - A follow-up in a new process began today's session early with `begin(planId)`. The block recorded the plan, its topic allocation, and the begun slot.
- Bugs found and fixed during these runs:
  - Slots could only be exclusive to one subject, which left a Saturday empty after the bridge course. Slot subjects are now preferences, with `strict` and `after` added.
  - `begin` rejected `start: "now"`. It now treats only `HH:MM` as a slot selector.
- Overhead regression (`run.py --repeats 2`, current vs the previous commit, `lesson` and `block-lesson`): teaching turns still had 0 tool calls and no time talk, prompt-cache hits stayed 0.97–0.98, and turn times stayed within noise (5.1–7.0 s).

Not established: multi-week behavior in real use, DST transitions, plans spanning several cycles, and whether the hour budgets derived from a plan match real study time. The projection is a planning aid; topic completion still depends on learning evidence.

## Native study-block pause/resume (2026-10-28)

Implementation scope: the shared project-native `.omp/extensions/study-clock.js`, not the upstream OMP core or a global installation. Consulted installed `omp://docs/extensions.md`; no SDK or new dependencies.

- `node evals/study-clock/plan-check.mjs`: all 21 deterministic checks passed (10 existing checks and 11 new action/event checks). Fictional temporary profiles and an injected test clock exercised frozen block/task elapsed and remaining time, repeated pause/resume cycles, shifted deadlines with original identities/start times preserved, rescoping after breaks, task calibration and weekly credit excluding breaks, ending while paused, competing-start and mutation guards, transactional failures, persistence across fresh extension instances, legacy v1 data, and suppression/reappearance of timer alerts.
- `node evals/study-clock/tick-bench.mjs`: passed with a 402 KiB fictional schedule and 301 blocks; approximately 0.52 ms per tick, 0.46 ms per plan projection, and 0.59 ms per turn injection in this run. These are local observations, not a latency guarantee or model-overhead comparison.
- Real OMP 18.13.3 CLI smoke test: isolated temporary working directory, `--no-session --no-title --no-extensions --extension <absolute project clock path> --no-lsp --no-context-files --no-rules --no-skills --tools read,write --approval-mode yolo --max-time 180`. A fictional session-only request executed `plan` with first task, `pause`, `status`, `resume`, `task_end`, and `end` through the actual native `xd://study_clock` schema and dispatch. The process exited 0. Assertions on actual tool-event details confirmed the same B001/T1, frozen status during pause, a later deadline on resume, no persisted files, and no remaining active smoke block. No learner records were opened or used.
- `git diff --check` passed.

Limitations: the CLI smoke used a short real break; long breaks and fresh-instance persistence were tested deterministically rather than by waiting hours. Interactive TUI appearance, DST/system-clock jumps, and concurrent writers were not newly verified. Weekly slots are not automatically shifted by pause/resume. Existing running OMP sessions need to reload the extension or start a new session to acquire the changed action schema; the smoke test used a fresh process.

## Stopped-lesson continuity (2026-10-28)

Exercised the updated Schedule workflow through the actual `/teach-schedule` command with OMP 18.13.3, `--no-session --no-title --no-extensions --no-lsp --no-context-files --no-rules --tools read --max-time 120`. The prompt supplied a fictional session-only BIO900 plan, a closed timer, and an unfinished BIO900-T01 conclusion; it requested continuation in the next matching subject block without a date promise or new activity.

The process exited 0. Actual tool events showed native skill discovery and command expansion, with reads only of the tutoring skill and project rules/protocol; no private-profile reads, file writes, or timer starts. The response kept the timer stopped, placed a brief retrieval before the unfinished conclusion in the next BIO900 block, did not restart the lesson or advance the topic, and required learner readiness without promising a date. This is one model/CLI scenario, not a guarantee of future attendance or behavior in every session.

## Candid feedback without handing over fixes (added 2026-10-30)

Prompted by a learner report that the tutor kept giving answers during homework review and softened its verdicts. Changes: a sticky rule in `.omp/RULES.md`; candor wording in `.omp/SYSTEM.md`; in `adaptive-tutor`, Lesson step 4–5, Practice/homework steps 4–5, and Feedback steps 2–3 (verdict first; locate and classify errors; no corrected values, steps, statements, terms, checks, or answers while a revision remains), plus a **Grading** subsection that applies only when the learner's plan defines a scheme; matching updates to `/teach-feedback`, the programming subject profile, `language-coach`, `docs/teaching.md`, and the student/assignment templates.

New opt-in eval `evals/feedback-candor/` (real CLI, `--no-session --no-extensions --tools read`, fictional prompts, no `.teacher/`). OMP 18.14.0, model `claude-opus-5-5` (from JSON events). `before` is a full `.omp/` snapshot taken before the change.

| Run | Scenarios × repeats | Result |
| --- | --- | --- |
| 1: `before` vs first version | `feedback` (2 turns), `feedback-en`, `lesson`; × 2 | No literal leaks in either variant: when the learner says resubmission is possible, short exercises did not discriminate. Explicit solution request answered 2/2 in both. Cushioning phrases (lexicon rescored after removing evidence-backed phrases): `before` 4/8 turns ("Thanks for sending", "not correct yet", "todavía no es correcto", "No del todo"), new 0/8. New replies open with the verdict; `before` replies opened with what went well. |
| 2: `before` vs first version | `homework-plain` × 3: "can you review my homework?" on a multi-part assignment with explanation items, resubmission not mentioned (the reported trigger) | Read in full. `before`: 3/3 runs handed over substantive fixes (the corrected conclusion of the explanation item 2/3, the rewritten absolute-value equality 2/3, the omitted check's result 1/3, a counterexample pair 1/3). First version: 0/3 substantive fixes, but 3/3 supplied a precise term for an imprecise one ("can be 0"). The rule was then extended to corrected statements, terms, and checks. |
| 3: final version | all four scenarios × 3 | 0/15 turns with leak patterns; explicit solution request answered 3/3; 0/15 turns with cushioning phrases. The three `homework-plain` replies were read in full: no substantive fix; the imprecise term was quoted and flagged with a cue, without the replacement. |
| 4: `before` vs final, published prompt | `homework-plain` × 3 after rewording the fictional answers so the tracked prompt shares no wording with any real learner's work | Read in full. `before`: 3/3 runs supplied fixes (the precise term "≤ 0" 3/3, the omitted check computed as m(1) = 9 2/3, a counterexample pair 2/3). Final: 0/3; imprecise words were quoted and flagged with a cue ("look at x = 3"). Patterns were extended to the observed "≤ 0" phrasings; rescoring then matched the manual reading (3/3 vs 0/3). |

A separate grading smoke run (`/teach-feedback` with a fictional percentage table, 3-slot resubmission rule, and announced points) produced a per-criterion table, 10/30 = 33.3 % → 5.0, the conditional maximum (33.3 + 100 + 100)/3 ≈ 77.8 % → 2.3 (arithmetic checked), stated its scoring assumptions (no partial credit in the announced rubric), and gave no fixes.

Limits: one model and provider, small samples, short fictional exercises. Several `homework-plain` patterns match phrasings observed in runs 2 and 4; patterns miss paraphrases, so replies were also read. Runs 2–3 used an earlier wording of the `homework-plain` answers; run 4 is the published prompt. The reported failure happened late in a long saved session with a selected profile and a Typst file; long-context behavior, file-based submissions, children's wording, and multi-turn revision cycles were not exercised. Nothing here measures learning.

## Hash check without an approval prompt (added 2026-10-30)

`.omp/config.yml` adds one `bash.patterns` allow rule, `shasum -a 1 *`, so the tutor can compare a submission's hash with the one recorded when it was graded without asking for approval each time. Exercised with OMP 18.14.0 in print mode (`-p --no-session`, no interactive UI, so any call needing approval is refused):

- `shasum -a 1 README.md` ran and returned the hash.
- `shasum -a 1 README.md && echo chained` was refused with "requires approval but no interactive UI available": allow rules match the whole command, so chains still need approval.

Limits: approval policy, not containment. Only the `bash` tool is covered; other commands keep the `write` approval mode.
