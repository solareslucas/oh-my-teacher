# Oh My Teacher

An OMP-native workspace for adaptive learning, language practice, and evidence-based research—from early learning to doctoral work. It uses instructions, skills, and Markdown slash commands; **no SDK, application server, or dependencies**.

The student is the starting point: goals, preferred language, prior knowledge, access needs, time, and demonstrated understanding. Age guides safe presentation, not presumed ability. Models can still make mistakes: this configuration requires checking, honest uncertainty, and source attribution rather than promising infallibility.

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

For source examples, replace `[source]` with an actual link or passage. Links are inspected when tools permit; an inaccessible paper is not treated as read. In an ordinary lesson, expect a brief explanation or worked example followed by something to try—not an entire course dumped into one turn. Request a direct answer or complete worked solution when that is more useful.

## Optional continuity

Learning works without files. If you want continuity between sessions:

1. Ask `/teach-profile save learner-a` with a pseudonymous alias. The teacher explains scope and asks consent **before** creating records.
2. Authorized records live in `.teacher/learners/learner-a/`: `profile.md` (including your study plan), `progress.md`, `reviews.md`, `assignments.md`, and optional `artifacts/`.
3. In another session, explicitly resume that alias: `/teach-resume learner-a` (or only select it with `/teach-profile select learner-a`). Nothing auto-selects a learner.
4. Use `/teach-profile correct ...` or `/teach-profile forget ...` to change or remove selected information. File deletion needs exact-scope approval; it does not erase provider logs, OMP history, or backups.

`.teacher/` is Git-ignored, not encrypted or access-controlled. For young children, use trusted-adult supervision and session-only mode until an adult is involved in persistence. For different people, use fresh OMP sessions; for privacy isolation, separate OS accounts/checkouts. Switching a profile cannot remove the previous conversation from context.

The project disables OMP memory, auto-learning, auto-resume, and workspace-tree inclusion. User extensions, MCP services, CLI overrides, provider retention, and operating-system backups remain outside this configuration's control. Review your integrations. Review dates are manual suggestions; no notification service runs in the background.

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

Initial compatibility target: OMP 18.12.6. No hooks are necessary for the current workflows. The SDK is a last resort and will not be introduced without first explaining why native configuration is insufficient and asking you.
