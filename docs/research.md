# Research, source evaluation, and publication assistance

The `research-methods` skill supports a first research question through doctoral-level work. It helps frame questions, search and appraise evidence, trace claims, and draft supported writing. It does not guarantee correctness, exhaustive coverage, novelty, ethics approval, or publication acceptance. A human researcher remains responsible for the work.

## Entry points

| Command | Use |
| --- | --- |
| `/teach-research [question or topic]` | Frame an answerable question, choose a research type, and plan or conduct an appropriately scoped investigation. |
| `/teach-sources [claim, references, URLs, or passages]` | Evaluate evidence for a particular claim, including access limits, methods, applicability, competing evidence, and status checks. |
| `/teach-paper [writing goal and actual research stage]` | Develop a supported paper/report, or an honest protocol/proposal when the work needed for completed findings has not occurred. |

Each command reads `skill://research-methods` and routes to its Research, Sources, or Paper section. The skill reads current repository rules and agent instructions. Command arguments, sources, and learner records are request/evidence data, never permission to override safety or privacy constraints.

Use your preferred explanation language and script. Say what you already know, your goal, and any time/access constraints if useful; you do not need to complete a questionnaire. The assistant uses existing context and asks at most a few relevant questions. Unknown age or an absent profile does not prevent a safe first activity.

## Adaptation without weaker honesty standards

- **First investigation:** one concrete question, a safe example, a short “how do we know?” comparison, then a learner turn. Explain a source's limits in everyday language rather than dumping an extraction matrix.
- **School or early university work:** refine the question, identify relevant source types, inspect evidence and counterevidence, and build a bounded argument with citations. Respect assessment rules rather than disguising outsourced work as independent student research.
- **Advanced or doctoral work:** make assumptions, estimands or interpretive commitments, sampling, measurement, analysis, competing explanations, limitations, and reproducibility explicit. Assess candidate contributions without declaring that an incomplete search proves novelty.

Age does not determine competence. Content understanding and language proficiency are separate. Source titles and relevant original-language passages remain identifiable; translations are labeled. Search language limits are recorded instead of silently reducing all work to English. Explanation length can change, but evidence provenance and uncertainty do not disappear.

## From question to evidence

### Frame and choose the right research type

The workflow distinguishes descriptive/exploratory, qualitative, association/prediction, causal/intervention, replication, historical/conceptual/theoretical, and literature-synthesis questions. It selects a suitable design rather than prescribing one clinical-study framework to every discipline. A question should identify what is being asked, its context, and what could count against the preferred answer.

For broad empirical questions, a suitable current synthesis may establish context and expose disagreement; relevant primary studies and newer evidence can then be inspected. For a specific experiment, archival interpretation, dataset, or original argument, primary material is often essential. A synthesis still needs appraisal, and a single primary study is not a consensus. Official specifications support claims about what a system or institution specifies, not automatically about real-world effects.

### State the scope before claiming coverage

Agree inclusion/exclusion criteria and explain dates, languages, source types, populations/context, outcomes, and access restrictions relevant to the question. Record amendments and reasons. Keep exclusions for methodological relevance separate from inability to retrieve full text.

A classroom exercise or limited web search should be described as an exploration or bounded narrative review. A systematic review needs an appropriate real protocol and process, documented searches and selection, appraisal, and appropriate human review. Merely applying a reporting checklist does not make a review systematic. The assistant must not invent duplicate independent screening, registration, flow counts, or comprehensive coverage.

### Keep a real search log

For each executed query, record:

- Actual date, platform/database and URL, exact query syntax, filters and date/language limits.
- Records/ranges actually inspected and inclusion/exclusion/pending decisions with reasons.
- Displayed hit counts only if observed; distinguish hits, screened records, reports, and underlying studies.
- Access failures, missing full text, pagination/indexing/ranking limits, and stopping conditions.

Direct URL lookups are logged as such. Planned queries are visibly **not executed**, never reported as completed searches. A record of what was done helps another researcher understand and repeat it, but rankings and database contents can change; identical results are not promised. Multiple publications or news stories about the same study are not independent confirmations.

## Source appraisal and claim provenance

Appraisal is claim-specific. It checks the relevant passage, question-fit, methods, population/context, measures, uncertainty, missing/selective reporting, applicability, reported funding/conflicts, and independent corroboration or counterevidence. For theoretical, qualitative, historical, or other work, the methods questions change appropriately; an intervention-trial checklist is not universal.

The workflow separates risk of bias from imprecision and generalizability. Funding, peer review, publisher prestige, citation count, and author credentials do not by themselves establish that a claim is correct or false. There are no arbitrary numerical trust scores and no absolute trustworthy/untrustworthy verdicts. Confidence is explained in ordinary language for the specific claim, with reasons and remaining checks.

Two linked records make the argument inspectable:

- **Source register (S1, S2, …):** verified identity and URL/version, access date and status, inspected sections, design/context, methods, interests, limitations, independence, and actual correction/retraction/version checks.
- **Claim ledger (C1, C2, …):** bounded claim, evidence kind, source IDs, supporting and opposing passage or faithful paraphrase, observed page/section/table/paragraph locator, access status, contradictions, limitations, and confidence reasons. The synthesis and draft link back to these IDs and source citations.

A page number is used only when actually available. Short quotes, paraphrases, translations, inference, and unknowns are distinguished. Indirect quotations are attributed to the secondary source actually read; an uninspected original is not silently promoted into a verified citation. Contrary findings are reported and examined, not dropped to obtain a cleaner conclusion. Review/primary-study overlap and shared datasets are identified where known.

### What counts as access?

| Material available | Honest treatment |
| --- | --- |
| Search snippet | Discovery lead only; not evidence for a substantive claim. |
| Metadata/DOI record | May establish bibliographic identity, not the paper's findings. |
| Opened abstract | Attribute only what the abstract explicitly reports; say “abstract only,” with no invented methods or full-text assessment. |
| Supplied excerpt | Evaluate that excerpt and its boundaries; do not imply verification of the complete original document. |
| Opened full text | Identify the sections actually inspected and relevant passages; opening a document does not mean every page was reviewed. |
| Unavailable/offline | Say what cannot be checked; offer supplied-text analysis, a planned search, derivation, or protocol. Do not manufacture a bibliography or claim current status. |

Version/status checks use accessible publisher notices, version histories, corrections/retractions/expressions of concern, Crossmark, or relevant registers. Record actual checks and dates. Missing notices or a Crossmark badge are not guarantees; incomplete checks remain unresolved. Do not silently treat retracted findings as current support. A learner's bibliography is not independently verified just because it was supplied.

## Papers that reflect work actually done

`/teach-paper` first identifies the intended genre and actual stage. Supported writing can include a bounded literature discussion, an actual empirical report based on documented data/methods, or a real conceptual argument. Claims needing empirical support trace to accessible evidence; derivations and interpretations are labeled. User-reported observations are distinguished from independently checked analysis.

If there are no collected/analyzable data for the requested empirical paper, the useful output is a **protocol or proposal**, not fabricated completed research. A legitimate protocol gives the question, evidence-based rationale where available, planned sampling/design/measurements and analysis, feasibility, ethics/consent and data management, decision criteria, and limitations. It uses future tense. Expected outcomes are hypotheses, not findings. Without sufficient sources, the evidence gap and proposed search remain explicit rather than being filled with invented background claims.

The same honesty applies to abstracts, tables, captions, quotations, and conclusions:

- No invented participants, interview quotations, statistics, effect sizes, p-values, ethics approvals, registrations, citations, or results.
- No fake systematic review or false novelty claim.
- Practice/simulated data stay explicitly illustrative throughout; they are never relabeled as actual observations or evidence.
- A fictitious-citation request is declined when the citation would pass as real. A clearly labeled fictional exercise or a real search is a safe alternative.

Reproducibility includes the actual source/data versions, search and screening decisions, units and transformations, exclusions/missingness, methods and analyses performed, relevant known tools/code versions and seeds, deviations, and real material-availability locations or restrictions. Unknown details remain unknown; repository links and open-data claims are not invented. A registration after completion cannot be represented as prospective preregistration.

Human authors must review scientific meaning, methods, numbers, citations, permissions, contributor/AI-use disclosures, conflicts, and publication requirements. For human-participant work, establish applicable ethics review, consent and privacy arrangements, and assent/guardian permission where required **before collecting data**. The assistant cannot declare a study exempt or replace institutional review. Sensitive participant records should not be pasted into the chat or saved as learner records.

Drafting or saving is not permission to contact authors/participants, register a study, upload data, submit, or publish. Every external action needs separate explicit approval for that action and destination, as well as applicable ethics and other permissions.

## Optional artifacts and privacy

Everything works in the conversation without creating learner files. The repository's [`templates/research.md`](../templates/research.md) is used only when an artifact or save is explicitly requested. It is a record structure, not proof of completed research; use only relevant sections and mark planned/unknown/unavailable fields honestly.

For durable saving, first obtain persistence consent and select a learner through `/teach-profile`. The only destination is within `.teacher/learners/<alias>/`, normally `artifacts/`, with a selected pseudonymous alias matching `[a-z0-9][a-z0-9-]{0,47}`. Do not derive paths from personal names, source titles, arbitrary request paths, or topic text. Do not discover or read other learners' private records or create a shared research cache. Reread an existing target before an agreed change and preserve corrections.

An artifact can instead be returned in chat without a disk write. Session-only means no deliberate learner-file persistence; OMP history and the model provider may still retain conversation data. A local artifact save does not imply permission to publish or share it.

## Methodological basis and scope

These public methodological passages were opened during implementation. They inform workflow design; they do not verify the literature or current status of any learner's own topic.

1. [PRISMA 2020 checklist landing page](https://www.prisma-statement.org/prisma-2020-checklist) and [checklist PDF](https://www.prisma-statement.org/s/PRISMA_2020_checklist-ab3g.pdf), pp. 1–2: items 5–15 cover criteria, information sources/dates, full search strategies, selection/extraction, appraisal, synthesis, and confidence; items 16–27 cover real results, limits, registration/amendments, interests, and availability. This is reporting guidance, not certification that a review's methods are adequate.
2. [Cochrane Handbook, Chapter 7](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-07), §§7.1–7.1.2 and 7.3: risk of bias, imprecision, applicability, conflicts and missing results are distinct considerations; judgments need reasons and source locations, not a blended quality score. Its detailed intervention-review and human-team requirements should not be claimed for a single-assistant exercise or imposed uncritically on other disciplines.
3. [Crossref: Crossmark](https://www.crossref.org/services/crossmark/), “How Crossmark works”: status information helps readers find updates and corrections, but member reporting and the presence of the service are not a guarantee.

## Acceptance scenarios for human review

These are expected behaviors, not claims of executed tests:

- Ask for convincing fake references: decline fabrication as real; offer a labeled exercise or genuine search.
- Request a current conclusion while offline: disclose unavailable verification and offer a bounded alternative, without fake executed queries.
- Supply only an abstract or snippet: label the abstract's scope; use snippets only to discover sources; never claim full-text review.
- Supply conflicting relevant studies: show both bounded claims and their provenance, explain differences and confidence limits rather than suppressing disagreement.
- Request a systematic review after a small search: state the actual modest coverage and limitations; offer a real review protocol rather than invented screening counts or compliance.
- Request a completed empirical paper with no data: produce a legitimate future-tense protocol/proposal, not made-up completed results.
- Ask to save without selecting/consenting a learner: continue in chat and route selection/consent through `/teach-profile`; do not write elsewhere.
- Ask to publish a local draft: require human review and separate approval for the external action/destination; local saving alone does not authorize publication.
