---
name: spec-design
description: Generate comprehensive technical design translating requirements (WHAT) into architecture (HOW) with discovery process. Use when creating architecture from requirements.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebSearch, WebFetch, Agent, AskUserQuestion
argument-hint: <feature-name> [-y]
metadata:
  shared-rules: "document-style.md, command-tracking.md, design-principles.md, design-discovery-full.md, design-discovery-light.md, design-synthesis.md, design-review-gate.md, lifecycle-navigation.md, codebase-grounding.md, global-context-loading.md, learning-promotion.md"
  shared-templates: "specs/design.md, specs/research.md"
  shared-scripts: "record-command-fired.py, validate-patterns-append-only.py"
---

# kiro-spec-design Skill

## Core Mission
- **Success Criteria**:
  - All requirements mapped to technical components with clear interfaces
  - The design makes responsibility boundaries explicit enough to guide task generation and review
  - Appropriate architecture discovery and research completed
  - Design aligns with steering context and existing patterns
  - Visual diagrams included for complex architectures

## Execution Steps

### Step 1: Gather Context

**Spec Path Resolution**: The feature directory may be in one of five locations (check in this order):
1. `.kiro/specs/features/<feature>/spec.json` (categorized feature)
2. `.kiro/specs/bugs/<feature>/spec.json` (categorized bugfix)
3. `.kiro/specs/tech-debt/<feature>/spec.json` (categorized tech debt)
4. `.kiro/specs/chores/<feature>/spec.json` (categorized chore)
5. `.kiro/specs/<feature>/spec.json` (legacy flat structure)

If `spec.json` contains a `spec_path` field, use that as the canonical path. Otherwise, use whichever location exists. All subsequent file reads/writes for this spec use the resolved path. Throughout this skill, `{spec_dir}` denotes that resolved path; project-global paths under `.kiro/steering/`, `.kiro/learnings/`, and `.kiro/settings/` are NOT spec-relative and keep their `.kiro/` form.

**Record command fired**: Read `rules/command-tracking.md`, then run
`python3 "${CLAUDE_SKILL_DIR}/scripts/record-command-fired.py" "{spec_dir}" "kiro-spec-design" "design"` (or `python`).

Skip re-reading a file only if its content is already present in this conversation; if you cannot point to where it was loaded, read it now. Never assume steering or spec files are already loaded.
Otherwise, load all necessary context:
- `{spec_dir}/spec.json`, `requirements.md`, `design.md` (if exists)
- `{spec_dir}/research.md` (if exists, contains gap analysis from `/kiro:validate-gap`)
- `templates/specs/design.md` from this skill's directory (repo override: `.kiro/settings/templates/specs/design.md`) for document structure
- Read `rules/design-principles.md` from this skill's directory for design principles
- Read `rules/document-style.md` from this skill's directory for plain writing style
- `templates/specs/research.md` from this skill's directory (repo override: `.kiro/settings/templates/specs/research.md`) for discovery log structure

**Steering + cross-spec learnings + spec-scoped decisions/learnings**: follow
`${CLAUDE_SKILL_DIR}/rules/global-context-loading.md` in full — glob-all steering and cross-spec
learnings, including `patterns.md` when present. Read spec-scoped `decisions.md`/`learnings.md` if
present, apply what was loaded, and print the context manifest.

**Validate requirements approval**:
- If auto-approve flag is true: Auto-approve requirements in spec.json
- Otherwise: Verify approval status (stop if unapproved, see Safety & Fallback)

### Step 1.5: Lifecycle Check

**Read lifecycle fields from spec.json**: `spec_type`, `workflow`, `artifacts`
- If fields missing, default to: `spec_type: "feature"`, `workflow: "requirements-first"`, all artifacts enabled
- Read `rules/lifecycle-navigation.md` from this skill's directory for next-step computation

**Self-skip check**:
- If BOTH `artifacts.design_hld` AND `artifacts.design_lld` are `false`: Output "Design phase disabled for this spec. Next step: [computed from lifecycle-navigation]" -> **STOP**
- If `spec_type` is `"bugfix"`: Output "Design phase skipped for bugfix specs. Next step: `/kiro:spec-tasks {feature}`" -> **STOP**

**HLD/LLD redirect** (this command produces monolithic `design.md` — redirect when split mode is active):
- If `artifacts.design_hld` is `true` OR `artifacts.design_lld` is `true`: This spec uses the split HLD/LLD workflow. Output:
  ```
  This spec uses split design (HLD + LLD). Use the dedicated commands instead:
    /kiro:spec-design-hld {feature}    (architecture, flows, components)
    /kiro:spec-design-lld {feature}    (interfaces, contracts, data models)

  (add -y to either to auto-approve the upstream gate and skip your review —
   fast-track for low-risk specs only; default is to review before approving.)

  /kiro:spec-design produces a single design.md and is available for
  legacy specs or when both HLD and LLD are disabled.
  ```
  -> **STOP**

**Design-first prerequisite relaxation**:
- If `workflow` is `"design-first"`: Do NOT require approved requirements. Accept project description and steering context as sufficient input.

**Research toggle**:
- If `artifacts.research` is `false`: Skip persisting **discovery** to `research.md`. Retain those findings in working memory for design generation only.
- **EXEMPT from this toggle — the "Codebase Grounding" section is written either way** (see `rules/codebase-grounding.md` from this skill's directory → "The grounding log is EXEMPT from the `artifacts.research` toggle"). `design.md` carries no current-state section, so this section is the only durable record of how the system works today. With `research: false`, still create/update `research.md` containing the Codebase Grounding section **only** — short, evidence-only.

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

The following research areas are independent and can be dispatched as **subagents** via the Agent tool. The agent should decide the optimal decomposition based on feature complexity — split, merge, add, or skip subagents as needed. Each subagent returns a **findings summary** (not raw data) to keep the main context clean for synthesis.


For simple additions, skip subagent dispatch entirely and do a quick pattern check in main context.

After all findings return, synthesize in main context before proceeding.

3. **Retain Discovery Findings for Step 3**:
   - External API contracts and constraints
   - Technology decisions with rationale
   - Existing patterns to follow or extend
   - Integration points and dependencies
   - Identified risks and mitigation strategies
   - Boundary candidates, out-of-boundary decisions, and likely revalidation triggers

4. **Persist Findings to Research Log** (skip if `artifacts.research` is `false` — **except** the "Codebase Grounding" section, which is always written; see the Research toggle in Step 1.5):
   - Create or update `{spec_dir}/research.md` using the shared template
   - Summarize discovery scope and key findings
   - Record investigations with sources and implications
   - Document architecture pattern evaluation, design decisions, and risks
   - Use the language specified in spec.json when writing or updating `research.md`

### Step 3: Synthesis

**Apply design synthesis to discovery findings before writing.**

- Read and apply `rules/design-synthesis.md` from this skill's directory
- This step requires the full picture from discovery findings — execute in main context, not in a subagent
- Record synthesis outcomes (generalizations found, build-vs-adopt decisions, simplifications) in `research.md` (skip if `artifacts.research` is `false`)

### Step 4: Generate Design Draft

1. **Generate Design Draft**:
   - **Follow specs/design.md template structure and generation instructions strictly**
   - **Boundary-first requirement**: Before expanding supporting sections, make the boundary explicit. The draft must clearly define what this spec owns, what it does not own, which dependencies are allowed, and what changes would require downstream revalidation.
   - **Integrate all discovery findings and synthesis outcomes**: Use researched information (APIs, patterns, technologies) and synthesis decisions (generalizations, build-vs-adopt, simplifications) throughout component definitions, architecture decisions, and integration points
   - **File Structure Plan** (required): Populate the File Structure Plan section with concrete file paths and responsibilities. Analyze the codebase to determine which files need to be created vs. modified. Each file must have one clear responsibility. This section directly drives task `_Boundary:_` annotations and implementation Task Briefs — vague file structures produce vague implementations.
   - **Testing Strategy**: Derive test items from requirements' acceptance criteria, not generic patterns. Each test item should reference specific components and behaviors from this design. E2E paths must map to the critical user flows identified in requirements. Avoid vague entries like "test login works" -- instead specify what is being verified and why it matters.
   - If existing design.md found in Step 1, use it as reference context (merge mode)
   - Apply design rules: Type Safety, Visual Communication, plain simple tone
   - Use language specified in spec.json
   - **Code blocks use the repo's IMPLEMENTATION language — never a default.** `spec.json.language` controls *prose* only. Write every code block (interfaces, contracts, type/data-model definitions, snippets) in the repo's implementation language, detected from its build manifests (`pom.xml`/`build.gradle` → Java/Kotlin · `pubspec.yaml` → Dart · `go.mod` → Go · `package.json` → TypeScript) and confirmed against `tech.md` steering (steering wins on conflict). **Never default interface/contract blocks to TypeScript.** If the language is genuinely unknown, use clearly-labeled language-neutral pseudocode, not TS.
   - Keep this as a draft until the review gate passes; do not write `design.md` yet

### Step 5: Review Design Draft

- Read and apply `rules/design-review-gate.md` from this skill's directory
- Verify requirements coverage, architecture readiness, and implementation executability before finalizing the design
- If issues are local to the draft, repair the design and review again
- Keep the review bounded to at most 2 repair passes
- If the draft exposes a real requirements/design gap, stop and return to requirements clarification instead of papering over it in `design.md`

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
  - Steps (do these yourself, do not delegate): "Record a LEARNING for phase 'design' in spec dir '{spec_dir}'. AI produced: [brief summary of your output]. Human corrected: [what the user said]. Read {spec_dir}/learnings.md (create if missing) and append the entry. If the correction is generalizable, follow `rules/learning-promotion.md`: dedupe against .kiro/learnings/*.md, update .kiro/learnings/patterns.md append-only, include `Source spec` pointing back to this learning entry, and run `validate-patterns-append-only.py`."
  - Finish the append before continuing.

If the user chooses between **architecturally or technically distinct** alternatives you presented (not stylistic or naming preferences):
- Record the decision **synchronously now** (use Write/Edit directly — not via a background subagent):
  - Steps (do these yourself, do not delegate): "Record a DECISION for phase 'design' in spec dir '{spec_dir}'. Alternatives: [list]. Chosen: [which and why]. Read {spec_dir}/decisions.md (create if missing) and append the entry."
  - Finish the append before continuing.

### Step 6: Finalize Design Document

1. **Write Final Design**:
   - Write `{spec_dir}/design.md` only after the design review gate passes
   - Write research.md with discovery findings and synthesis outcomes (skip if `artifacts.research` is `false` — but always write its "Codebase Grounding" section when grounding ran)

2. **Update Metadata** in spec.json:

   - Set `phase: "design-generated"`
   - Set `approvals.design.generated: true, approved: false`
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
- **Requirements Traceability IDs**: Use numeric requirement IDs only (e.g. "1.1", "1.2", "3.1", "3.3") exactly as defined in requirements.md. Do not invent new IDs or use alphabetic labels.

## Output Description

**Command execution output** (separate from design.md content):

Provide brief summary in the language specified in spec.json:

1. **Status**: Confirm design document generated at `{spec_dir}/design.md`
2. **Discovery Type**: Which discovery process was executed (full/light/minimal)
3. **Key Findings**: 2-3 critical insights from discovery that shaped the design
4. **Review Gate**: Confirm the design review gate passed
5. **Next Action**: Approval workflow guidance (see Safety & Fallback)
6. **Research Log**: Confirm `research.md` updated with latest decisions

**Format**: Concise Markdown (under 200 words) - this is the command output, NOT the design document itself

**Note**: The actual design document follows the `templates/specs/design.md` structure.

## Safety & Fallback

### Error Scenarios

**Requirements Not Approved**:
- **Stop Execution**: Cannot proceed without approved requirements
- **User Message**: "Requirements not yet approved. Approval required before design generation."
- **Suggested Action**: "Review requirements, approve them, then re-run `/kiro:spec-design {feature}`. (Fast-track: add `-y` to auto-approve requirements and skip your review — low-risk specs only.)"

**Missing Requirements**:
- **Stop Execution**: Requirements document must exist
- **User Message**: "No requirements.md found at `{spec_dir}/requirements.md`"
- **Suggested Action**: "Run `/kiro:spec-requirements {feature}` to generate requirements first"

**Template Missing**:
- **User Message**: "Template file missing at `templates/specs/design.md` (this skill's directory)"
- **Suggested Action**: "Check repository setup or restore template file"
- **Fallback**: Use inline basic structure with warning

**Steering Context Missing**:
- **Warning**: "Steering directory empty or missing - design may not align with project standards"
- **Proceed**: Continue with generation but note limitation in output

**Invalid Requirement IDs**:
  - **Stop Execution**: If requirements.md is missing numeric IDs or uses non-numeric headings (for example, "Requirement A"), stop and instruct the user to fix requirements.md before continuing.

**Spec Gap Found During Design Review**:
- **Stop Execution**: Do not write a patched-over `design.md`
- **User Message**: "Design review found a real spec gap or ambiguity that must be resolved before design can be finalized."
- **Suggested Action**: Clarify or fix `requirements.md`, then re-run `/kiro:spec-design {feature}`

### Next Phase: Task Generation

**If Design Approved**:
- **Optional**: Run `/kiro:validate-design {feature}` for interactive quality review
- Run `/kiro:spec-tasks {feature}` to generate implementation tasks
  - ⚙ optional: add `-y` to auto-approve the design gate and skip your review — fast-track for low-risk specs only; default is to review the design before approving.

**If Modifications Needed**:
- Provide feedback and re-run `/kiro:spec-design {feature}`
- Existing design used as reference (merge mode)
