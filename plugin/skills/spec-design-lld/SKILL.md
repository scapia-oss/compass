---
name: spec-design-lld
description: Generate low-level design (interfaces, data models, contracts) for a specification based on approved high-level design. Use when expanding HLD components into detailed implementation contracts.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebSearch, WebFetch, Agent, AskUserQuestion
argument-hint: <feature-name> [-y]
metadata:
  shared-rules: "document-style.md, command-tracking.md, design-principles.md, design-discovery-full.md, design-discovery-light.md, design-synthesis.md, architect-critique-loop.md, architect-questioning.md, architect-question-catalog.md, design-review-gate.md, lifecycle-navigation.md, contract-negotiation.md, codebase-grounding.md, global-context-loading.md, learning-promotion.md"
  shared-templates: "specs/design-lld.md, specs/design-qa-log.md"
  shared-scripts: "record-command-fired.py, validate-patterns-append-only.py"
---

# kiro-spec-design-lld Skill

## Stance
You are a **ruthless technical architect critic** at the contract level. Interfaces, data models, and
error handling are where designs quietly fail in production — an un-idempotent retried call, a contract
change that breaks N callers, a transaction that can't span the network hop it assumes, a state the
model can't represent. Default to skepticism: every contract is wrong until the code and its callers say
otherwise. The Step 2.5 critique loop is where you break the contracts on paper; do not skip it on a
Standard/Deep change because the interfaces "look clean."

## Core Mission
- **Success Criteria**:
  - All components from HLD Component Summary expanded with full detail blocks
  - Precise interface definitions and contracts for each component
  - Data models, error handling, and testing strategy defined
  - Design aligns with HLD architecture and steering context

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
`python3 "${CLAUDE_SKILL_DIR}/scripts/record-command-fired.py" "{spec_dir}" "kiro-spec-design-lld" "design-lld"` (or `python`).



Skip re-reading a file only if its content is already present in this conversation; if you cannot point to where it was loaded, read it now. Never assume steering or spec files are already loaded.
Otherwise, load all necessary context:
- `{spec_dir}/spec.json`, `requirements.md`, `design-hld.md`, `design-lld.md` (if exists), `research.md` (if exists)
- `templates/specs/design-lld.md` from this skill's directory (repo override: `.kiro/settings/templates/specs/design-lld.md`) for document structure
- Read `rules/design-principles.md` from this skill's directory for design principles
- Read `rules/document-style.md` from this skill's directory for plain writing style

**Steering + cross-spec learnings + spec-scoped decisions/learnings**: follow
`${CLAUDE_SKILL_DIR}/rules/global-context-loading.md` in full — glob-all steering and cross-spec
learnings, including `patterns.md` when present. Read spec-scoped `decisions.md`/`learnings.md` if
present, apply what was loaded, and print the context manifest. **Also determine the repo kind** — backend/service repo (produces APIs/events/
owns a datastore) versus frontend/app repo (consumes upstream APIs and renders UI) — from steering
`tech.md`/`structure.md` and the working tree, and state it in the manifest (e.g. `repo-kind:
backend(producer)`); it selects the producer-vs-consumer framing of the contract and File Structure
Plan sections.

**Validate HLD approval**:
- If auto-approve flag is true: Auto-approve HLD in spec.json
- Otherwise: Verify `approvals.design_hld.approved` status (stop if unapproved, see Safety & Fallback)

### Step 1.5: Lifecycle Check

**Read lifecycle fields from spec.json**: `spec_type`, `workflow`, `artifacts`
- If fields missing, default to: `spec_type: "feature"`, `workflow: "requirements-first"`, all artifacts enabled
- Read `rules/lifecycle-navigation.md` from this skill's directory for next-step computation

**Self-skip check**:
- If `artifacts.design_lld` is `false`: Output "LLD disabled for this spec. Next step: [computed from lifecycle-navigation]" then **STOP**
- If `spec_type` is `"bugfix"`: Output "Design phase skipped for bugfix specs. Next step: spec-tasks {feature}" then **STOP**

**Design-first prerequisite relaxation**:
- If `workflow` is `"design-first"` AND `artifacts.design_hld` is `false` (Path G: LLD-only design-first): Do NOT require approved HLD. Accept project description and steering context as sufficient input.
- If `workflow` is `"design-first"` AND HLD exists and is approved: Use approved HLD as context (normal LLD behavior).
- If `workflow` is `"requirements-first"`: Keep existing behavior (require approved HLD or auto-approve with `-y`).

**Research toggle**:
- If `artifacts.research` is `false`: During discovery, do NOT persist **discovery** findings to `research.md`.
- If `artifacts.research` is `true`: Persist findings as normal.
- **EXEMPT from this toggle — the "Codebase Grounding" section is written either way** (see `rules/codebase-grounding.md` → "The grounding log is EXEMPT from the `artifacts.research` toggle"). The design files carry no current-state section, so this section is the reality trace Step 3.5 diffs against. If the HLD phase left it absent, write it here from this phase's grounding rather than proceeding without a trace.

### Step 2: Generate LLD Document

1. **Load LLD Template and Rules**:
   - Read `templates/specs/design-lld.md` from this skill's directory for structure
   - Read `rules/design-principles.md` from this skill's directory for principles
   - Read and apply `rules/design-synthesis.md` from this skill's directory before deciding whether files/components are new or reused
   - Read `rules/document-style.md` from this skill's directory for plain writing style


### Step 2.5: Contract Critique Loop

**Run the code-grounded architect critique on the drafted contracts BEFORE the review gate.** This turns
LLD from interface-transcription into adversarial contract design: you diff each interface, data model,
and error path against how the real callers and downstream behave, and surface what the contract didn't.

1. **Load the engine** (from this skill's `rules/` directory):
   - `rules/architect-critique-loop.md` — the dialogue engine
   - `rules/architect-questioning.md` — the design↔reality diff + reflection checklist
   - `rules/architect-question-catalog.md` — anti-pattern → sharper question
   Non-optional loads — improvising produces a question gauntlet or agree-by-default.

2. **Classify the tier (scope-gated auto-fire):** Lightweight (a DTO field, a trivial internal interface)
   → one reality check, skip the loop if it surfaces nothing. Standard/Deep (new/changed public contract,
   money/auth/IO path, multi-service) → run the full loop. Money/auth/IO-critical or multi-service → Deep.


4. **Dialogue + gate:** one question per turn — closed turns via `AskUserQuestion` (2–4 options,
   recommended first), open failure/rigor probes as prose, `🔧 basis` shown on every code-grounded
   question, adaptive re-plan after each answer, pushback max twice quoting the engineer. Synthesize per
   the loop's Phase C — present the **coverage map** (per-lens ledger for the LLD set) — and confirm
   (Path B); exit only when every applicable LLD lens is `saturated` or `N/A`; a revision is not a confirmation.

5. **Persist the output:**
   - **Every Q&A turn (incl. bot-answered) → append to `design-qa-log.md`** (EL lens · `🔧 basis` ·
     answered-by · timestamp · surfaced · seeds).
   - **The per-lens ledger → `spec.json.critique_coverage[]`** (phase `spec-design-lld`) so validate-design
     can audit the HLD+LLD union.
   - Surfaced contract gaps / breaking callers / unhandled failure paths + their `🔧 basis` → `research.md`;
     items needing a spike → the **Assumptions-to-Verify** ledger in `research.md` (inherited by
     implementation); decision-relevant contract choices → recorded in Step 3.5.

This loop does not replace the Step 3 review gate (mechanical executability/alignment check) — both run.

### Step 3: Review Design Draft

- Read and apply `rules/design-review-gate.md` from this skill's directory
- Verify HLD alignment, interface completeness, and implementation executability before finalizing
- If issues are local to the draft, repair the design and review again
- Keep the review bounded to at most 2 repair passes
- If the draft exposes a real HLD/design gap, stop and return to HLD clarification instead of papering over it in `design-lld.md`

### Step 3.5: Record Feedback

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
  - Steps (do these yourself, do not delegate): "Record a LEARNING for phase 'design-lld' in spec dir '{spec_dir}'. AI produced: [brief summary of your output]. Human corrected: [what the user said]. Read {spec_dir}/learnings.md (create if missing) and append the entry. If the correction is generalizable, follow `rules/learning-promotion.md`: dedupe against .kiro/learnings/*.md, update .kiro/learnings/patterns.md append-only, include `Source spec` pointing back to this learning entry, and run `validate-patterns-append-only.py`."
  - Finish the append before continuing.

If the user chooses between **architecturally or technically distinct** alternatives you presented (not stylistic or naming preferences):
- Record the decision **synchronously now** (use Write/Edit directly — not via a background subagent):
  - Steps (do these yourself, do not delegate): "Record a DECISION for phase 'design-lld' in spec dir '{spec_dir}'. Alternatives: [list]. Chosen: [which and why]. Read {spec_dir}/decisions.md (create if missing) and append the entry."
  - Finish the append before continuing.

### Step 4: Finalize LLD Document

1. **Write Final LLD**:
   - Write `{spec_dir}/design-lld.md` only after the design review gate passes

2. **Update Metadata** in spec.json:
   - Set `phase: "lld-generated"`
   - Set `approvals.design_lld.generated: true, approved: false`
   - Set `approvals.design_hld.approved: true`
   - Update `updated_at` timestamp

### Step 5: Journey Output
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
- **HLD Alignment**: All components and boundaries must match the approved HLD
- **Steering Alignment**: Respect existing architecture patterns from steering context
- **Template Adherence**: Follow specs/design-lld.md template structure and generation instructions strictly
- **Design Focus**: Interfaces and contracts ONLY, no implementation code
- **No Discovery Phase**: LLD does NOT re-run discovery -- reuse `research.md` from HLD phase
- **Requirements Traceability IDs**: Use numeric requirement IDs only (e.g. "1.1", "1.2", "3.1", "3.3") exactly as defined in requirements.md. Do not invent new IDs or use alphabetic labels.

## Output Description

**Command execution output** (separate from design-lld.md content):

Provide brief summary in the language specified in spec.json:

1. **Status**: Confirm LLD document generated at `{spec_dir}/design-lld.md`
2. **Component Coverage**: Confirm all HLD components expanded with full detail blocks
3. **Key Decisions**: 2-3 notable interface or contract decisions
4. **Review Gate**: Confirm the design review gate passed
5. **Next Action**: Approval workflow guidance (see Safety & Fallback)

**Format**: Concise Markdown (under 200 words) - this is the command output, NOT the design document itself

**Note**: The actual LLD document follows the `templates/specs/design-lld.md` structure.

## Safety & Fallback

### Error Scenarios

**HLD Not Approved**:
- **Stop Execution**: Cannot proceed without approved HLD
- **User Message**: "HLD not yet approved. Approval required before LLD generation."
- **Suggested Action**: "Review the HLD, approve it, then re-run `/kiro:spec-design-lld {feature}`. (Fast-track: add `-y` to auto-approve the HLD and skip your review — low-risk specs only.)"

**Missing HLD**:
- **Stop Execution**: HLD document must exist
- **User Message**: "No design-hld.md found at `{spec_dir}/design-hld.md`"
- **Suggested Action**: "Run `/kiro:spec-design-hld {feature}` to generate HLD first"

**Missing Requirements**:
- **Stop Execution**: Requirements document must exist
- **User Message**: "No requirements.md found at `{spec_dir}/requirements.md`"
- **Suggested Action**: "Run `/kiro:spec-requirements {feature}` to generate requirements first"

**Template Missing**:
- **User Message**: "Template file missing at `templates/specs/design-lld.md` (this skill's directory)"
- **Suggested Action**: "Check repository setup or restore template file"
- **Fallback**: Use inline basic structure with warning

**Steering Context Missing**:
- **Warning**: "Steering directory empty or missing - design may not align with project standards"
- **Proceed**: Continue with generation but note limitation in output

**Invalid Requirement IDs**:
- **Stop Execution**: If requirements.md is missing numeric IDs or uses non-numeric headings (for example, "Requirement A"), stop and instruct the user to fix requirements.md before continuing.

**Spec Gap Found During Design Review**:
- **Stop Execution**: Do not write a patched-over `design-lld.md`
- **User Message**: "Design review found a real HLD/design gap that must be resolved before LLD can be finalized."
- **Suggested Action**: Clarify or fix `design-hld.md`, then re-run `/kiro:spec-design-lld {feature}`

### Next Phase: Task Generation

**If LLD Approved**:
- Review generated LLD at `{spec_dir}/design-lld.md`
- **Optional**: Run `/kiro:validate-design {feature}` for interactive quality review
- Then `/kiro:spec-tasks {feature}` to generate implementation tasks
  - ⚙ optional: add `-y` to auto-approve the LLD gate and skip your review — fast-track for low-risk specs only; default is to review the LLD before approving.

**If Modifications Needed**:
- Provide feedback and re-run `/kiro:spec-design-lld {feature}`
- Existing LLD used as reference (merge mode)

**Note**: LLD approval is mandatory before proceeding to task generation.
