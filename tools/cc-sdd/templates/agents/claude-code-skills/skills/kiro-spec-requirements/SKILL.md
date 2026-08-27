---
name: kiro-spec-requirements
description: Generate EARS-format requirements based on project description and steering context. Use when generating requirements from project description.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent, WebSearch, WebFetch, AskUserQuestion
metadata:
  shared-rules: "document-style.md, command-tracking.md, ears-format.md, requirements-review-gate.md, lifecycle-navigation.md, triage-criteria.md, interaction-style.md, global-context-loading.md, learning-promotion.md"
  shared-templates: "specs/requirements.md, specs/bugfix.md"
  shared-scripts: "record-command-fired.py, validate-patterns-append-only.py"
---

# kiro-spec-requirements Skill

## Core Mission
- **Success Criteria**:
  - Create complete requirements document aligned with steering context
  - Follow the project's EARS patterns and constraints for all acceptance criteria
  - Focus on core functionality without implementation details
  - Make inclusion/exclusion boundaries explicit when scope could otherwise be misread
  - Update metadata to track generation status

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
`python3 "${CLAUDE_SKILL_DIR}/scripts/record-command-fired.py" "{spec_dir}" "kiro-spec-requirements" "requirements"` (or `python`).


Skip re-reading a file only if its content is already present in this conversation; if you cannot point to where it was loaded, read it now. Never assume steering or spec files are already loaded.
Otherwise, load all necessary context:
- Read `{spec_dir}/spec.json` for language and metadata
- Read `{spec_dir}/brief.md` if it exists (discovery context: problem, approach, scope decisions, boundary candidates)
- Read `{spec_dir}/requirements.md` for project description
- Relevant local agent skills or playbooks only when they clearly match the feature's host environment or use case and contain domain terminology or workflow rules that shape user-observable requirements

**Steering + cross-spec learnings + spec-scoped decisions/learnings**: follow
`${CLAUDE_SKILL_DIR}/rules/global-context-loading.md` in full — glob-all steering and cross-spec
learnings, including `patterns.md` when present. Read spec-scoped `decisions.md`/`learnings.md` if
present, apply what was loaded, and print the context manifest.

### Step 1.5: Lifecycle Check

**Read lifecycle fields from spec.json**: `spec_type`, `workflow`, `artifacts`
- If these fields are missing, default to: `spec_type: "feature"`, `workflow: "requirements-first"`, all artifacts enabled (backward compatibility)
- Read `rules/lifecycle-navigation.md` from this skill's directory for next-step computation

**Self-skip check**:
- If `artifacts.requirements` is `false` AND `artifacts.bugfix_analysis` is `false`: Skip this phase. Output: "Requirements phase disabled for this spec. Next step: [computed from lifecycle-navigation]" -> **STOP**

**Bugfix mode check**:
- If `spec_type` is `"bugfix"`: Switch to bugfix analysis mode:
  - Load `templates/specs/bugfix.md` from this skill's directory (repo override: `{{KIRO_DIR}}/settings/templates/specs/bugfix.md`) for structure (instead of requirements template)
  - Write output to `bugfix.md` (not `requirements.md`)
  - Generate three sections: Current Behavior (Defect), Expected Behavior (Correct), Unchanged Behavior (Regression Prevention)
  - Use EARS-style format for each entry
  - **Bugfix complexity gate (run after `bugfix.md` is written)**: assess the fix against the **Complex bugfix signals** in `rules/triage-criteria.md` (interface/contract change, shared module, state/retry/idempotency/concurrency, data-corruption risk, or cross-service). If ANY signal holds, the blast-radius critique must NOT be skipped — in spec.json set `artifacts.design_hld: true`, set `required_gates.design_review: true`, and add `approvals.design_hld: { "generated": false, "approved": false }`, then record a DECISION **synchronously** (Write/Edit `{spec_dir}/decisions.md`): "complex bugfix → design_hld enabled because <signal>". Step 6's lifecycle router will then route to `/kiro-spec-design-hld` and then `/kiro-validate-design`. If NO signal holds, leave design disabled — the spec stays on the `bugfix_analysis → tasks → implementation → validate_impl → retrospective` fast path.

**Design-first workflow check**:
- If `workflow` is `"design-first"` and no design document exists yet (`design-hld.md` or `design-lld.md`):
  - Ask via `AskUserQuestion` per `rules/interaction-style.md` (never a bare `(y/n)` line) -- `header`: `Workflow`, `question`: `Your workflow is design-first, so the design would normally come before requirements. How do you want to proceed?`, options `Run /kiro-spec-design first (Recommended)` (*Create the design, then derive requirements from it -- matches the design-first workflow you chose*) / `Proceed with requirements anyway` (*Generate requirements now; the design-first ordering is skipped for this spec*)
  - **Both branches are explicit** -- never leave one implied:
    - *Run `/kiro-spec-design` first* -> **STOP**. Write nothing. Emit exactly: "Next step: `/kiro-spec-design {feature-name}`" (or `/kiro-spec-design-hld` when `artifacts.design_hld` is `true` and `design` is not -- resolve via `rules/lifecycle-navigation.md`, never guess the command).
    - *Proceed with requirements anyway* -> continue to requirements generation.
    - Any other answer (including a harness-provided "Other") -> re-ask once; do NOT continue on an unmapped response.
- If `workflow` is `"design-first"` and approved design exists:
  - Load the approved design document(s) as primary input context
  - Derive requirements that the design already satisfies
  - Note in output: "These requirements were derived from the approved technical design."

### Step 2: Read Guidelines
- Read `rules/ears-format.md` from this skill's directory for EARS syntax rules
- Read `rules/requirements-review-gate.md` from this skill's directory for pre-write review criteria
- Read `rules/document-style.md` from this skill's directory for plain writing style
- Read `templates/specs/requirements.md` from this skill's directory (repo override: `{{KIRO_DIR}}/settings/templates/specs/requirements.md`) for document structure

#### Parallel Research (subagent dispatch)

The following research areas are independent. Decide the optimal decomposition based on project complexity -- split, merge, add, or skip subagents as needed.

**Delegate to subagent via Agent tool** (keeps exploration out of main context):
- **Codebase hints** (brownfield projects): Dispatch a subagent to explore existing implementations that inform requirement scope. Example prompt: "Explore this codebase for existing features related to [feature area]. Summarize: (1) what already exists, (2) relevant interfaces/APIs, (3) patterns that new requirements should align with. Return a summary under 150 lines."
- **Domain research** (when external knowledge is needed): Dispatch a subagent for WebSearch/WebFetch to research domain-specific requirements, standards, or best practices. Return a concise findings summary.
- **Additional steering and playbooks**: If many steering files or local agent playbooks exist, dispatch a subagent to scan them and return only the sections relevant to this feature.

For greenfield projects with minimal codebase, skip subagent dispatch and load context directly.

After all research completes, synthesize findings in main context before generating requirements.

### Step 3: Generate Requirements Draft
- Create initial requirements draft based on project description
- Group related functionality into logical requirement areas
- Apply EARS format to all acceptance criteria
- Use language specified in spec.json
- Use plain, simple English from `rules/document-style.md`
- Preserve terminology continuity across phases:
  - discovery = `Boundary Candidates`
  - requirements = explicit inclusion/exclusion and adjacent expectations when needed
  - design = `Boundary Commitments`
  - tasks = `_Boundary:_`
- If scope could be misread, add lightweight boundary context without introducing implementation or architecture ownership detail
- Keep this as a draft until the review gate passes; do not write `requirements.md` yet

### Step 4: Review Requirements Draft
- Run the `Requirements Review Gate` from `rules/requirements-review-gate.md`
- Review coverage, EARS compliance, ambiguity, adjacent expectations, and scope boundaries before finalizing
- If issues are local to the draft, repair the requirements and review again
- Keep the review bounded to at most 2 repair passes
- If the draft exposes a real scope ambiguity or contradiction, stop and ask the user to clarify instead of writing guessed requirements

### Step 5: Finalize and Update Metadata
- Write `{spec_dir}/requirements.md` only after the requirements review gate passes
  - In bugfix mode: write `{spec_dir}/bugfix.md` instead
- Set `phase: "requirements-generated"`
- Set `approvals.requirements.generated: true`
- Update `updated_at` timestamp

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
  - Steps (do these yourself, do not delegate): "Record a LEARNING for phase 'requirements' in spec dir '{spec_dir}'. AI produced: [brief summary of your output]. Human corrected: [what the user said]. Read {spec_dir}/learnings.md (create if missing) and append the entry. If the correction is generalizable, follow `rules/learning-promotion.md`: dedupe against {{KIRO_DIR}}/learnings/*.md, update {{KIRO_DIR}}/learnings/patterns.md append-only, include `Source spec` pointing back to this learning entry, and run `validate-patterns-append-only.py`."
  - Finish the append before continuing.

If the user chooses between **architecturally or technically distinct** alternatives you presented (not stylistic or naming preferences):
- Record the decision **synchronously now** (use Write/Edit directly — not via a background subagent):
  - Steps (do these yourself, do not delegate): "Record a DECISION for phase 'requirements' in spec dir '{spec_dir}'. Alternatives: [list]. Chosen: [which and why]. Read {spec_dir}/decisions.md (create if missing) and append the entry."
  - Finish the append before continuing.

### Step 6: Journey Output
After completing this phase:
- Load `rules/lifecycle-navigation.md` from this skill's directory
- Compute the next enabled phase based on workflow and artifact toggles
- Display progress indicator: "Phase N/M complete: [phase list with check/pending/disabled indicators]"
- Display next step: "Next: [exact command]"

## Important Constraints

### Requirements Scope: WHAT, not HOW
Requirements describe user-observable behavior, not implementation. Use this to decide what belongs here vs. in design:

**Ask the user about (requirements scope):**
- Functional scope — what is included and what is excluded
- User-observable behavior — "when X happens, what should the user see/experience?"
- Business rules and edge cases — limits, error conditions, special cases
- Non-functional requirements visible to users — response time expectations, availability, security level
- Adjacent expectations only when they change user-visible behavior or operator expectations — what this feature relies on, and what it explicitly does not own

**Do not ask about (design scope — defer to design phase):**
- Technology stack choices (database, framework, language)
- Architecture patterns (microservices, monolith, event-driven)
- API design, data models, internal component structure
- How to achieve non-functional requirements (caching strategy, scaling approach)
- Internal ownership mapping, component seams, or implementation boundaries that belong in design

**Litmus test**: If an EARS acceptance criterion can be written without mentioning any technology, it belongs in requirements. If it requires a technology choice, it belongs in design.

### Other Constraints
- Each requirement must be testable and unambiguous. If the project description leaves room for multiple interpretations on scope, behavior, or boundary conditions, ask the user to clarify before generating that requirement. Ask as many questions as needed; do not generate requirements that contain your own assumptions.
- Choose appropriate subject for EARS statements (system/service name for software)
- Requirement headings in requirements.md MUST include a leading numeric ID only (for example: "Requirement 1", "1.", "2 Feature ..."); do not use alphabetic IDs like "Requirement A".

## Output Description
Provide output in the language specified in spec.json with:

1. **Generated Requirements Summary**: Brief overview of major requirement areas (3-5 bullets)
2. **Document Status**: Confirm requirements.md updated and spec.json metadata updated
3. **Review Gate**: Confirm the requirements review gate passed
4. **Next Steps**: Guide user on how to proceed (approve and continue, or modify)

**Format Requirements**:
- Use Markdown headings for clarity
- Include file paths in code blocks
- Keep summary concise (under 300 words)

## Safety & Fallback

### Error Scenarios
- **Missing Project Description**: If requirements.md lacks project description, ask user for feature details
- **Template Missing**: If template files don't exist, use inline fallback structure with warning
- **Language Undefined**: Default to English (`en`) if spec.json doesn't specify language
- **Incomplete Requirements**: After generation, explicitly ask user if requirements cover all expected functionality
- **Steering Directory Empty**: Warn user that project context is missing and may affect requirement quality
- **Non-numeric Requirement Headings**: If existing headings do not include a leading numeric ID (for example, they use "Requirement A"), normalize them to numeric IDs and keep that mapping consistent (never mix numeric and alphabetic labels).

### Next Phase: Design Generation

**If Requirements Approved**:
- **Optional Gap Analysis** (for existing codebases):
  - Run `/kiro-validate-gap {feature}` to analyze implementation gap
  - Recommended for brownfield projects; skip for greenfield
- Run `/kiro-spec-design {feature}` to proceed to design phase
  - ⚙ optional: add `-y` to auto-approve requirements and skip your review — fast-track for low-risk specs only; default is to review requirements before approving.

**If Modifications Needed**:
- Provide feedback and re-run `/kiro-spec-requirements {feature}`
