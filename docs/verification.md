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

## What this does not establish

- These are observed smoke scenarios on one model, not empirical validation of learning outcomes, a benchmark, or proof of reliable behavior on every model/language.
- No actual delay was fabricated to test retention. Long-term mastery and later retrieval remain untested.
- No audio, speech recognition, image/sign-language assessment, automatic reminder, publication submission, human-participant study, or empirical teaching-effectiveness evaluation was performed.
- No full systematic review, broad adversarial/security audit, user-extension/MCP compatibility audit, or provider-retention audit was performed. Source appraisal and profile boundaries are instructions, not a sandbox or guarantee of truth.
- The actual headless CLI was exercised; interactive TUI rendering/autocomplete was not visually evaluated.
- No permanent source-text/wiring tests or application build were added: this is a declarative OMP workspace, and runtime command/skill behavior was exercised directly.

For later changes, rerun relevant fictional scenarios with `--no-session`; use only a unique disposable alias for persistence checks, inspect actual tool outcomes, and remove those records afterward. Update this file with observations rather than treating these results as permanent guarantees.
