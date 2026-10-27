# Design and boundaries

## Native composition

- `.omp/SYSTEM.md`: teacher/research-mentor identity, pedagogical default, tool discipline. OMP's plain custom-prompt route replaces the coding persona while retaining generated skills, rules, and project context.
- `.omp/RULES.md`: short sticky requirements for adaptation, evidence, privacy, safety, and SDK consent.
- `.omp/AGENTS.md`: workflow routes, explicit profile lifecycle, and repository maintenance.
- `.omp/skills/*/SKILL.md`: on-demand teaching, language, and research procedures. They do not make independent API calls.
- `.omp/commands/teach-*.md`: native Markdown command templates with `$ARGUMENTS`; prefixed names avoid built-in collisions. They route to skills, not executable shell scripts.
- `.omp/config.yml`: project-local skill commands, disabled memory/auto-learning/auto-resume/workspace tree, write approval mode; no chosen model/provider.
- `.omp/extensions/session-mode.js`: side-effect-free native runtime detection via `ctx.sessionManager.getSessionFile()`. Adds only an ephemeral/persistence-enabled/unknown notice before a user turn; never reads learner records, exposes the session path, or writes anything.
- `templates/`: blank record formats, not auto-loaded learner data. Optional private records live in ignored `.teacher/`.

No package manager, service, custom tool, SDK application, or database is needed. One native extension supplies the concrete runtime signal unavailable in static prompt files; it neither saves records itself nor verifies output truth. `--no-extensions` disables auto-discovery; explicitly pass `--extension .omp/extensions/session-mode.js` to retain detection in isolated runs. Without a notice the teacher uses checkpoint cadence and does not guess the mode. The SDK remains reserved for a missing native capability and requires the user's prior agreement.

## Adaptation is a feedback loop

A learner's goals, communication needs, constraints, and actual domain-specific responses determine the next move. Broad age/stage can guide safe presentation, not ceiling or placement. Self-report is useful context, not observed proficiency. An answer after hints is not independent transfer. Confidence is not mastery. Language-production difficulty is not evidence of low subject understanding.

One response cannot establish a permanent student model. The workflows maintain provisional interpretations, revise them after errors or success, and revisit material later. Review intervals are practical adjustable choices, not a validated optimal scheduler. Students can request direct answers, change language, reduce workload, or correct the profile.

## Evidence basis, not a universal prescription

The IES/What Works Clearinghouse [Organizing Instruction and Study to Improve Student Learning](https://ies.ed.gov/ncee/wwc/PracticeGuide/1), released in 2007, recommends spacing, interleaving worked examples with problem solving, connecting concrete/abstract representations, retrieval, and explanatory questions. Its evidence ratings vary: the landing page labels spacing and worked-example interleaving moderate, quiz re-exposure and deep explanatory questions strong, and some metacognitive/pre-question recommendations minimal. These recommendations motivate the teaching loop; they do not establish that this repository is effective for every learner, age, language, subject, or model.

Homework structure, delivery format, and subject profiles rest on a separate bounded scan (2026-10-24) of meta-analyses, trials, and frameworks, including evidence that unrestricted AI help during practice can lower later unaided performance. Its source register, access status, claims, and inferences are in [homework evidence](homework-evidence.md).

The ACRL [Framework for Information Literacy for Higher Education](https://www.ala.org/acrl/standards/ilframework), including its September 2026 revision, treats authority as contextual, research as inquiry, and searching as strategic exploration. It motivates examining the fit between evidence and a claim rather than trusting prestige or output format. It is an information-literacy framework, not a numerical trust detector or a substitute for disciplinary methods.

Both landing pages were opened during initial implementation. Consult the current sources and discipline-specific guidance before making consequential methodological claims. Learning outcomes and research quality for this configuration have not been empirically evaluated.

## Trust and privacy boundaries

Prompt instructions influence models; they are not a security sandbox, factual verifier, ethics board, parent, or licensed adviser. Private records remain plain files readable by accounts/tools with access. `.gitignore` prevents ordinary accidental staging, not deliberate inclusion or disclosure. Git must actually be in use for ignore behavior to apply.

Project settings disable OMP memory and auto-learning here, but sessions persist unless launched with `--no-session`. Provider retention, operating-system backups, previously saved memory, user-installed hooks/extensions, MCP services, and shared-device access remain separate concerns. Never promise legal compliance or perfect isolation. Use separate accounts/checkouts for different people and avoid uploading sensitive or unpublished material.

Native context and skills have differing discovery scopes. Launch at the repository root to load project settings and commands reliably; a nearer non-empty `.omp/` can shadow root context. Restart OMP after modifying prompt or skill files. Explicit CLI prompt overrides, disabled native discovery, `--no-skills`, and `--no-rules` can change or bypass this setup.
