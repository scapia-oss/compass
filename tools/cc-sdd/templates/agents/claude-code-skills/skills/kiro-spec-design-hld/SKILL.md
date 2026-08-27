---
name: kiro-spec-design-hld
description: Generate high-level design (architecture, flows, component overview) for a specification. Use when creating architectural overview before detailed component design.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebSearch, WebFetch, Agent, AskUserQuestion
argument-hint: <feature-name> [-y]
metadata:
  shared-rules: "document-style.md, command-tracking.md, design-principles.md, design-discovery-full.md, design-discovery-light.md, design-synthesis.md, architect-critique-loop.md, architect-questioning.md, architect-question-catalog.md, design-review-gate.md, lifecycle-navigation.md, contract-negotiation.md, codebase-grounding.md, global-context-loading.md, learning-promotion.md"
  shared-templates: "specs/design-hld.md, specs/research.md, specs/design-qa-log.md"
  shared-scripts: "record-command-fired.py, validate-patterns-append-only.py"
---

# kiro-spec-design-hld Skill

## Stance
You are a **ruthless technical architect critic** for this codebase, not a stenographer for the
requirements. Before committing to an architecture, you stress it against how the system actually works —
and you break it on paper, now, not in production. Default to skepticism: the requirement and any
proposed approach are wrong until the code says otherwise. Be brutally honest, bring alternatives, and
ask the question a sharp principal engineer would ask in review. The critique loop in Step 3.5 is where
this happens; do not skip it on a Standard/Deep change because the design "seems obvious."

## Core Mission
- **Success Criteria**:
  - Architecture and system boundaries clearly defined
  - Component summary with requirement coverage provided
  - Appropriate discovery and research completed
  - Design aligns with steering context and existing patterns
  - Visual diagrams included for complex architectures

## Execution Steps

### Step 1: Gather Context

**Spec Path Resolution**: The feature directory may be in one of five locations (check in this order):
1. `{{KIRO_DIR}}/specs/features/<feature>/spec.json` (categorized feature)
2. `{{KIRO_DIR}}/specs/bugs/<feature>/spec.json` (categorized bugfix)
3. `{{KIRO_DIR}}/specs/tech-debt/<feature>/spec.json` (categorized tech debt)
4. `{{KIRO_DIR}}/specs/chores/<feature>/spec.json` (categorized chore)
5. `{{KIRO_DIR}}/specs/<feature>/spec.json` (legacy flat structure)

If `spec.json` contains a `spec_path` field, use that as the canonical path. Otherwise, use whichever location exists. All subsequent file reads/writes for this spec use the resolved path. Throughout this skill, `{spec_dir}` denotes that resolved path; project-global paths under `{{KIRO_DIR}}/steering/`, `{{KIRO_DIR}}/learnings/`, and `{{KIRO_DIR}}/settings/` are NOT spec-relative and keep their `{{KIRO_DIR}}/` form.

**Record command fired**: Read `rules/command-tracking.md`, then run
`python3 "${CLAUDE_SKILL_DIR}/scripts/record-command-fired.py" "{spec_dir}" "kiro-spec-design-hld" "design-hld"` (or `python`).



Skip re-reading a file only if its content is already present in this conversation; if you cannot point to where it was loaded, read it now. Never assume steering or spec files are already loaded.
Otherwise, load all necessary context:
- `{spec_dir}/spec.json`, `requirements.md`, `design-hld.md` (if exists). **For a bugfix spec** (`spec_type: "bugfix"`), the requirement input is `{spec_dir}/bugfix.md` (Current/Expected/Unchanged behavior) instead of `requirements.md` — treat its sections as the behavior contract the design must satisfy and trace to them.
- `{spec_dir}/research.md` (if exists, contains gap analysis from `/kiro-validate-gap`)
- `templates/specs/design-hld.md` from this skill's directory (repo override: `{{KIRO_DIR}}/settings/templates/specs/design-hld.md`) for document structure
- Read `rules/design-principles.md` from this skill's directory for design principles
- Read `rules/document-style.md` from this skill's directory for plain writing style
- `templates/specs/research.md` from this skill's directory (repo override: `{{KIRO_DIR}}/settings/templates/specs/research.md`) for discovery log structure

**Steering + cross-spec learnings + spec-scoped decisions/learnings**: follow
`${CLAUDE_SKILL_DIR}/rules/global-context-loading.md` in full — glob-all steering and cross-spec
learnings, including `patterns.md` when present. Read spec-scoped `decisions.md`/`learnings.md` if
present, apply what was loaded, and print the context manifest. **Also determine the repo kind** — backend/service repo (produces APIs/events/
owns a datastore) versus frontend/app repo (consumes upstream APIs and renders UI) — from steering
`tech.md`/`structure.md` and the working tree, and state it in the manifest (e.g. `repo-kind:
backend(producer)`); it selects the producer-vs-consumer framing of the Change Surface section.

**Validate requirements approval**:
- If auto-approve flag is true: Auto-approve requirements in spec.json
- Otherwise: Verify approval status (stop if unapproved, see Safety & Fallback)

### Step 1.5: Lifecycle Check

**Read lifecycle fields from spec.json**: `spec_type`, `workflow`, `artifacts`
- If fields missing, default to: `spec_type: "feature"`, `workflow: "requirements-first"`, all artifacts enabled
- Read `rules/lifecycle-navigation.md` from this skill's directory for next-step computation

**Self-skip check**:
- If `artifacts.design_hld` is `false`: Output "HLD disabled for this spec. Next step: [computed from lifecycle-navigation]" then **STOP**. (This is the single skip gate — for a bugfix with `design_hld: false` it fires here, exactly as before.)
- **Bugfix with `design_hld: true`** (a complex bugfix promoted by the bugfix complexity gate): do NOT skip — run the HLD using `bugfix.md` as the requirement input (see Step 1). The architecture/blast-radius critique is the whole reason design was enabled for this bug.

**Design-first prerequisite relaxation**:
- If `workflow` is `"design-first"`: Do NOT require approved requirements. Accept project description and steering context as sufficient input for design generation.
- If `workflow` is `"requirements-first"`: Keep existing behavior (require approved requirements or auto-approve with `-y`).

**Research toggle**:
- If `artifacts.research` is `false`: During the discovery phase (Step 2), do NOT persist **discovery** findings to `research.md` (technology comparisons, API investigations, pattern evaluations, synthesis notes) — retain those in working context to inform the design.
- If `artifacts.research` is `true`: Persist findings to `research.md` as normal.
- **EXEMPT from this toggle — the "Codebase Grounding" section is written either way** (see `rules/codebase-grounding.md` → "The grounding log is EXEMPT from the `artifacts.research` toggle"). The HLD carries no current-state section, so this section is the only durable record of how the system works today, and `/kiro-spec-design-lld` reads it as its reality trace without re-running discovery. With `research: false`, still create/update `research.md` containing the Codebase Grounding section **only** — short, evidence-only.

### Step 2: Discovery & Analysis

**Critical: This phase ensures design is based on complete, accurate information.**

1. **Classify Feature Type**:
   - **New Feature** (greenfield) -> Full discovery required
   - **Extension** (existing system) -> Integration-focused discovery
   - **Simple Addition** (CRUD/UI) -> Minimal or no discovery
   - **Complex Integration** -> Comprehensive analysis required

2. **Execute Appropriate Discovery Process**:

   **For Complex/New Features**:
   - Read and execute `rules/design-discovery-full.md` from this skill's directory
   - Conduct thorough research using WebSearch/WebFetch:
     - Latest architectural patterns and best practices
     - External dependency verification (APIs, libraries, versions, compatibility)
     - Official documentation, migration guides, known issues
     - Performance benchmarks and security considerations

   **For Extensions**:
   - Read and execute `rules/design-discovery-light.md` from this skill's directory
   - Focus on integration points, existing patterns, compatibility
   - Use Grep to analyze existing codebase patterns

   **For Simple Additions**:
   - Skip formal discovery, quick pattern check only

#### Parallel Research (subagent dispatch)

The following research areas are independent and can be dispatched as **subagents** via the Agent tool. The agent should decide the optimal decomposition based on feature complexity -- split, merge, add, or skip subagents as needed. Each subagent returns a **findings summary** (not raw data) to keep the main context clean for synthesis.


For simple additions, skip subagent dispatch entirely and do a quick pattern check in main context.

After all findings return, synthesize in main context before proceeding.

3. **Retain Discovery Findings for Step 3**:
   - External API contracts and constraints
   - Technology decisions with rationale
   - Existing patterns to follow or extend
   - Integration points and dependencies
   - Identified risks and mitigation strategies
   - Potential architecture patterns and boundary options (note details in `research.md`)
   - Parallelization considerations for future tasks (capture dependencies in `research.md`)

4. **Persist Findings to Research Log** (**the discovery-log writes below are skipped only when `artifacts.research` is explicitly `false`** — an absent key means enabled, per the Step 1.5 default; the "Codebase Grounding" section is exempt from the toggle and is written either way):
   - Create or update `{spec_dir}/research.md` using the shared template
   - Summarize discovery scope and key findings (Summary section)
   - Record investigations in Research Log topics with sources and implications
   - Document architecture pattern evaluation, design decisions, and risks using the template sections
   - Use the language specified in spec.json when writing or updating `research.md`
   - **With `artifacts.research: false`**: skip the four bullets above and create/update `research.md` with the **Codebase Grounding section only** (the grounded findings, blast-radius results, and their queries/sources) — keep the discovery findings in working context for Step 3 instead of writing them.

### Step 3: Synthesis

**Apply design synthesis to discovery findings before writing.**

- Read and apply `rules/design-synthesis.md` from this skill's directory
- This step requires the full picture from discovery findings -- execute in main context, not in a subagent
- Record synthesis outcomes (generalizations found, build-vs-adopt decisions, simplifications) in `research.md` — **unless `artifacts.research` is explicitly `false`**; with `research: false` these are synthesis notes, so keep them in working context and leave `research.md` holding the Codebase Grounding section only

### Step 3.5: Architecture Critique Loop

**Run the code-grounded architect critique BEFORE writing the HLD.** This is the step that turns the
skill from a design-transcriber into an architect: you diff the emerging architecture against how the
system actually works and surface the gaps the requirements and the engineer didn't — failure paths,
blast radius, consistency, build-vs-adopt — *before* the design is frozen.

1. **Load the engine** (from this skill's `rules/` directory):
   - `rules/architect-critique-loop.md` — the dialogue engine (phases, tiers, exit, synthesis gate)
   - `rules/architect-questioning.md` — the design↔reality diff + reflection checklist
   - `rules/architect-question-catalog.md` — anti-pattern → sharper question
   These loads are **non-optional** — improvising the loop produces a question gauntlet or agree-by-default.

2. **Classify the tier (scope-gated auto-fire)** using the change shape (per the loop's tier table):
   - **Lightweight** (trivial/config/non-behavioral, single internal file): run one reality check; if it
     surfaces nothing real, skip the loop and proceed to Step 4. Do NOT manufacture interrogation.
   - **Standard / Deep** (normal feature → cross-cutting / money / auth / IO-critical / multi-service):
     run the full loop. Money/auth/IO-critical or multi-service changes are **Deep** by default.

3. **Trace, then critique — against the architecture lens set.** The Step 2 discovery +
   `rules/codebase-grounding.md` (from this skill's directory) already produced the verified reality and
   blast-radius picture (recorded in `research.md`) — reuse it as the reality trace (don't re-sweep). **Inherit discovery's ledger**
   from `spec.json.critique_coverage[]` (phase `discovery`) so you don't re-ask settled scope questions.
   The applicable lenses here are the **HLD set** (`rules/architect-critique-loop.md` → Coverage lenses):
   **EL1 contracts · EL2 blast-radius · EL3 state/consistency · EL5 failure-paths · EL7 amplified-asymmetry
   · EL11 build-vs-adopt · EL12 stack-fidelity · EL13 coupling** (tier-scoped). Run the design↔reality
   diff, draft the candidate question set internally, then run the dialogue loop: **one question per turn**,
   closed turns via `AskUserQuestion` with 2–4 concrete options (recommended option first, labelled),
   open-ended failure/rigor probes as plain prose. Show the `🔧 basis` on every code-grounded question.
   Adaptive re-plan after every answer. Pushback max twice per topic, quoting the engineer verbatim.

4. **Synthesize and gate** per the loop's Phase C: present "What we're building · trade-offs/risks ·
   not-in-scope · call-outs · **coverage map** (per-lens ledger for the HLD set)" and wait for explicit
   confirmation (Path B). Exit only when every applicable HLD lens is `saturated` or `N/A`. A revision is
   not a confirmation — re-present after each change.

5. **Persist the output:**
   - **Every Q&A turn (incl. bot-answered self-resolved ones) → append to `design-qa-log.md`** (question ·
     answer · `Answered by:` human|bot · timestamp · EL lens · `🔧 basis` · surfaced · seeds).
   - **The per-lens ledger → `spec.json.critique_coverage[]`** (phase `spec-design-hld`) so LLD and
     validate-design inherit it.
   - Surfaced edge cases / failure paths / blast-radius findings + their `🔧 basis` → `research.md`.
   - Items needing a spike/benchmark/longer investigation → an **Assumptions-to-Verify** ledger in
     `research.md` (basis + which design decision rests on each), so LLD and implementation inherit them.
   - Decision-relevant choices the engineer made here are recorded in Step 5.5 (Record Feedback).

This loop replaces agree-by-default with evidence-first critique; it does not replace the Step 5 review
gate (mechanical readiness check) — both run.

### Step 4: Generate HLD Document

1. **Load HLD Template and Rules**:
   - Read `templates/specs/design-hld.md` from this skill's directory for structure
   - Read `rules/design-principles.md` from this skill's directory for principles
   - Read `rules/document-style.md` from this skill's directory for plain writing style

2. **Generate HLD Document**:
   - **Follow specs/design-hld.md template structure and generation instructions strictly**
   - **Integrate all discovery findings and synthesis outcomes**: Use researched information (APIs, patterns, technologies) and synthesis decisions throughout architecture decisions and component overview
   - If existing design-hld.md found in Step 1, use it as reference context (merge mode)
   - Apply design rules: Type Safety, Visual Communication, plain simple tone
   - Use language specified in spec.json
   - **Code blocks use the repo's IMPLEMENTATION language — never a default.** `spec.json.language` controls *prose* only. Write any code block (interfaces, contracts, type/data-model definitions, snippets) in the repo's implementation language, detected from its build manifests (`pom.xml`/`build.gradle` → Java/Kotlin · `pubspec.yaml` → Dart · `go.mod` → Go · `package.json` → TypeScript) and confirmed against `tech.md` steering (steering wins on conflict). **Never default interface/contract blocks to TypeScript.** If the language is genuinely unknown, use clearly-labeled language-neutral pseudocode, not TS.
   - **HLD scope**: Overview, Goals/Non-Goals, Architecture, System Flows, Change Surface (APIs/contracts + impacted areas + impacted repos), Requirements Traceability, Component Summary table
   - **Repo-kind framing**: Frame the Change Surface section by the repo kind determined in Step 1 — producer (APIs/events/schemas this repo exposes or changes) for a backend/service repo, consumer (upstream contracts this repo binds to and pins, plus the routes/screens affected) for a frontend/app repo. Keep it to contract names and their change class (additive/breaking/unchanged) plus a coarse area map; defer request/response bodies and the exact file list to the LLD.
   - **Do NOT include**: Detailed component interfaces, data models, error handling, testing strategy, or a file-by-file enumeration -- these belong in the LLD phase
   - **Do NOT include a current-state narrative**: no "Current State", "As-Is", or "Existing Architecture Analysis" section, and no walkthrough of how the system works today. Grounding still runs and its evidence goes to `research.md`; the HLD states the architecture and the delta. The only grounding output that belongs here is the Impacted Repositories table plus each contract's change class.
   - Keep this as a draft until the review gate passes; do not write `design-hld.md` yet

### Step 5: Review Design Draft

- Read and apply `rules/design-review-gate.md` from this skill's directory
- Verify requirements coverage, architecture readiness, and component boundary clarity before finalizing
- If issues are local to the draft, repair the design and review again
- Keep the review bounded to at most 2 repair passes
- If the draft exposes a real requirements/design gap, stop and return to requirements clarification instead of papering over it in `design-hld.md`

### Step 5.5: Record Feedback

**During the review conversation with the user:**

**Record only directional corrections — NOT cosmetic fixes.** A correction worth recording changes the approach, scope, architecture, or technical choice. Wording tweaks, typo fixes, formatting requests, and minor clarifications are NOT worth recording.

Examples of corrections to record:
- "No, use SSE instead of WebSockets — our load balancer doesn't support WS"
- "Remove the caching layer, we don't need that complexity yet"
- "This should be async, not sync — we can't block the main thread"
- "Add rate limiting — you missed that requirement entirely"

Examples to skip (do NOT record):
- "Fix the typo in the description"
- "Rename this variable to something clearer"
- "Move this section above that one"
- "Add a comma here"

If the user provides feedback that meets the directional threshold:
- Record the learning **synchronously now** (use Write/Edit directly — do NOT dispatch a background subagent; a fire-and-forget call can be dropped when the turn ends and silently lose the learning):
  - Steps (do these yourself, do not delegate): "Record a LEARNING for phase 'design-hld' in spec dir '{spec_dir}'. AI produced: [brief summary of your output]. Human corrected: [what the user said]. Read {spec_dir}/learnings.md (create if missing) and append the entry. If the correction is generalizable, follow `rules/learning-promotion.md`: dedupe against {{KIRO_DIR}}/learnings/*.md, update {{KIRO_DIR}}/learnings/patterns.md append-only, include `Source spec` pointing back to this learning entry, and run `validate-patterns-append-only.py`."
  - Finish the append before continuing.

If the user chooses between **architecturally or technically distinct** alternatives you presented (not stylistic or naming preferences):
- Record the decision **synchronously now** (use Write/Edit directly — not via a background subagent):
  - Steps (do these yourself, do not delegate): "Record a DECISION for phase 'design-hld' in spec dir '{spec_dir}'. Alternatives: [list]. Chosen: [which and why]. Read {spec_dir}/decisions.md (create if missing) and append the entry."
  - Finish the append before continuing.

### Step 6: Finalize HLD Document

1. **Write Final HLD**:
   - Write `{spec_dir}/design-hld.md` only after the design review gate passes
   - Write `research.md` (if not already written): the **Codebase Grounding** section always; discovery findings and synthesis outcomes **unless `artifacts.research` is explicitly `false`**

2. **Update Metadata** in spec.json:
   - Set `phase: "hld-generated"`
   - Set `approvals.design_hld.generated: true, approved: false`
   - Set `approvals.requirements.approved: true`
   - Update `updated_at` timestamp

### Step 7: Journey Output
After completing this phase:
- Load `rules/lifecycle-navigation.md` from this skill's directory
- Compute the next enabled phase based on workflow and artifact toggles
- Display progress indicator: "Phase N/M complete: [phase list with check/pending/disabled indicators]"
- Display next step: "Next: [exact command]"

## Critical Constraints
 - **Type Safety**:
   - Enforce strong typing aligned with the project's technology stack.
   - For statically typed languages, define explicit types/interfaces and avoid unsafe casts.
   - For TypeScript, never use `any`; prefer precise types and generics.
   - For dynamically typed languages, provide type hints/annotations where available (e.g., Python type hints) and validate inputs at boundaries.
   - Document public interfaces and contracts clearly to ensure cross-component type safety.
- **Latest Information**: Use WebSearch/WebFetch for external dependencies and best practices
- **Steering Alignment**: Respect existing architecture patterns from steering context
- **Template Adherence**: Follow specs/design-hld.md template structure and generation instructions strictly
- **Design Focus**: Architecture and boundaries ONLY, no detailed implementation contracts
- **Requirements Traceability IDs**: Use numeric requirement IDs only (e.g. "1.1", "1.2", "3.1", "3.3") exactly as defined in requirements.md. Do not invent new IDs or use alphabetic labels. **For a bugfix spec**, trace to the `bugfix.md` behavior sections (Current/Expected/Unchanged) instead — those are the behavior contract; the numeric-ID rule does not apply.

## Output Description

**Command execution output** (separate from design-hld.md content):

Provide brief summary in the language specified in spec.json:

1. **Status**: Confirm HLD document generated at `{spec_dir}/design-hld.md`
2. **Discovery Type**: Which discovery process was executed (full/light/minimal)
3. **Key Findings**: 2-3 critical insights from `research.md` that shaped the design
4. **Review Gate**: Confirm the design review gate passed
5. **Next Action**: Approval workflow guidance (see Safety & Fallback)
6. **Research Log**: Confirm `research.md` updated with latest decisions

**Format**: Concise Markdown (under 200 words) - this is the command output, NOT the design document itself

**Note**: The actual HLD document follows the `templates/specs/design-hld.md` structure.

## Safety & Fallback

### Error Scenarios

**Requirements Not Approved**:
- **Stop Execution**: Cannot proceed without approved requirements
- **User Message**: "Requirements not yet approved. Approval required before HLD generation."
- **Suggested Action**: "Review requirements, approve them, then re-run `/kiro-spec-design-hld {feature}`. (Fast-track: add `-y` to auto-approve requirements and skip your review — low-risk specs only.)"

**Missing Requirements**:
- **Stop Execution**: Requirements document must exist
- **User Message**: "No requirements.md found at `{spec_dir}/requirements.md`" (for a **bugfix** spec this is expected — use `{spec_dir}/bugfix.md` as the requirement input instead; only error if `bugfix.md` is also missing)
- **Suggested Action**: "Run `/kiro-spec-requirements {feature}` to generate requirements first"

**Template Missing**:
- **User Message**: "Template file missing at `templates/specs/design-hld.md` (this skill's directory)"
- **Suggested Action**: "Check repository setup or restore template file"
- **Fallback**: Use inline basic structure with warning

**Steering Context Missing**:
- **Warning**: "Steering directory empty or missing - design may not align with project standards"
- **Proceed**: Continue with generation but note limitation in output

**Invalid Requirement IDs**:
- **Stop Execution**: If requirements.md is missing numeric IDs or uses non-numeric headings (for example, "Requirement A"), stop and instruct the user to fix requirements.md before continuing. **Exception — bugfix specs**: there is no `requirements.md`; the numeric-ID check does not apply. Use `bugfix.md` sections as the behavior contract and do NOT stop on this check.

**Spec Gap Found During Design Review**:
- **Stop Execution**: Do not write a patched-over `design-hld.md`
- **User Message**: "Design review found a real spec gap or ambiguity that must be resolved before design can be finalized."
- **Suggested Action**: Clarify or fix `requirements.md`, then re-run `/kiro-spec-design-hld {feature}`

### Next Phase: Low-Level Design

**If HLD Approved**:
- Review generated HLD at `{spec_dir}/design-hld.md`
- **Optional**: Run `/kiro-validate-design {feature}` for interactive quality review
- Then `/kiro-spec-design-lld {feature}` to generate low-level design
  - ⚙ optional: add `-y` to auto-approve the HLD gate and skip your review — fast-track for low-risk specs only; default is to review the HLD before approving.

**If Modifications Needed**:
- Provide feedback and re-run `/kiro-spec-design-hld {feature}`
- Existing HLD used as reference (merge mode)

**Note**: HLD approval is mandatory before proceeding to LLD generation.
