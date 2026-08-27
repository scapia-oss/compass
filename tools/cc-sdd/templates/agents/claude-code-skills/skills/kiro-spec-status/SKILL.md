---
name: kiro-spec-status
description: Show specification status, progress, pending work, and the next command. Use when the user asks "kiro status", "kiro help", "where am I?", "what is pending?", "what next?", or "what should I run next?"
allowed-tools: Read, Glob, Grep, Bash
argument-hint: [feature-name]
metadata:
  shared-rules: "lifecycle-navigation.md, multi-repo-linkage.md"
  shared-scripts: "kiro-status.mjs, common.mjs"
---

# kiro-spec-status Skill

## Core Mission
- **Success Criteria**:
  - Show current phase and completion status
  - Identify next actions and blockers
  - Provide clear visibility into progress
  - Display spec configuration (type, workflow, artifact toggles)
  - Surface boundary readiness, upstream/downstream context, and likely revalidation needs when available

## Execution Steps

### Step 0: Deterministic Status Snapshot

Run the bundled status script first. This script is the source of truth for progress, next command,
task counts, active-spec detection, and evidence:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/kiro-status.mjs" summary "$ARGUMENTS"
```

If `$ARGUMENTS` is empty, omit it:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/kiro-status.mjs" active
```

Print the script output verbatim unless you are adding a short explanation for an anomaly. Do not
recompute a conflicting next command in prose. Use the rest of this skill only as fallback guidance
if the script cannot run.

### Step 1: Load Spec Context

**Spec Path Resolution**: The feature directory may be in one of five locations (check in this order):
1. `{{KIRO_DIR}}/specs/features/<feature>/spec.json` (categorized feature)
2. `{{KIRO_DIR}}/specs/bugs/<feature>/spec.json` (categorized bugfix)
3. `{{KIRO_DIR}}/specs/tech-debt/<feature>/spec.json` (categorized tech debt)
4. `{{KIRO_DIR}}/specs/chores/<feature>/spec.json` (categorized chore)
5. `{{KIRO_DIR}}/specs/<feature>/spec.json` (legacy flat structure)

If `spec.json` contains a `spec_path` field, use that as the canonical path. Otherwise, use whichever location exists. All subsequent file reads/writes for this spec use the resolved path.

**Misplacement Check**: After listing all specs, verify each spec's directory matches its `spec_type`:
- `spec_type: "feature"` should be under `specs/features/`
- `spec_type: "bugfix"` should be under `specs/bugs/`
- `spec_type: "tech-debt"` should be under `specs/tech-debt/`
- `spec_type: "chore"` should be under `specs/chores/`
- Specs in the old flat `specs/` path get a migration nudge: "Consider moving to specs/features/, specs/bugs/, specs/tech-debt/, or specs/chores/ for better organization"

- Read `{{KIRO_DIR}}/specs/$ARGUMENTS/spec.json` for metadata and phase status
- Read `{{KIRO_DIR}}/specs/$ARGUMENTS/brief.md` if it exists
- Read existing files: `requirements.md`, `design.md`, `design-hld.md`, `design-lld.md`, `tasks.md` (if they exist)
- Check `{{KIRO_DIR}}/specs/$ARGUMENTS/` directory for available files
- Read `{{KIRO_DIR}}/steering/roadmap.md` if it exists and this spec appears in it

### Step 1.5: Lifecycle Configuration

**Read lifecycle fields from spec.json**: `spec_type`, `workflow`, `artifacts`, `required_gates`
- If fields missing, default to: `spec_type: "feature"`, `workflow: "requirements-first"`, all artifacts enabled (backward compatibility -- display classic status view)
- Read `lifecycle-navigation.md` (loaded via shared-rules) for journey computation

### Step 1.6: Multi-repo linkage (see `multi-repo-linkage.md`)

- **This spec is a satellite** (`spec.json.kind == "linked-spec"` AND `role == "satellite"`): do NOT
  compute a phase journey. Read `spec-link.md` and report it as a **linked satellite** — its `parent`
  repo + spec path (the source of truth), branch parity, and the local "Changes in this repo"
  checklist. Next action: "work happens against the parent spec; run `/kiro-spec-status` in the parent
  repo for phase status."
- **This spec is a peer** (`kind == "linked-spec"` AND `role == "peer"`): it owns its **own full
  spec** — report the **normal phase journey as usual**, PLUS a note listing the sibling repos +
  shared contract from `spec-link.md`. Do NOT suppress lifecycle for a peer (a peer is heavy).
- **This spec owns satellites** (`spec.json.affected_repos` is present): after the normal status,
  list each affected repo (`repo`, `weight`, `why`) and note that each light repo carries a satellite
  `spec-link.md` (auto-created at impl time). This is the downstream footprint of the spec.

### Step 2: Analyze Status

**Parse each phase**:
- **Spec Configuration**: Display spec type (Feature/Bugfix/Quick Change) and workflow approach (Requirements-First/Design-First)
- **Artifact Status**: For each artifact, show enabled/disabled and completion status
- **Requirements** (or **Bugfix Analysis** if bugfix): Count requirements/behavior entries and acceptance criteria; check approval
- **Design HLD**: If enabled, check for architecture, components, diagrams, boundary sections. If disabled, show "skipped"
- **Design LLD**: If enabled, check for interfaces, data models, contracts. If disabled, show "skipped"
- **Tasks**: Count completed vs total tasks (parse `- [x]` vs `- [ ]`)
- **Approvals**: Check approval status in spec.json (including `design_hld` and `design_lld` entries)
- **Required Gates**:
  - `design_review`: required when `required_gates.design_review` is true or design artifacts are enabled. Complete when `design-review.md` exists or `commands_fired[].command == "kiro-validate-design"`.
  - `impl_validation`: required when `required_gates.impl_validation` is true. Complete when `impl-validation.md` exists or `commands_fired[].command == "kiro-validate-impl"`.
  - `retrospective`: required when `required_gates.retrospective` is true. Complete when `commands_fired[].command == "kiro-retrospective"` or a matching `{{KIRO_DIR}}/feedback/feedback-*<feature>*` file exists.
  - If a required gate is incomplete and all earlier artifacts are present, make it the first Next Action. Do not list it as an optional recommendation.
- **Boundary context**:
  - From brief.md: note `Boundary Candidates`, `Upstream / Downstream`, and `Existing Spec Touchpoints` if present
  - From design.md/design-hld.md: note `Boundary Commitments`, `Out of Boundary`, `Allowed Dependencies`, and `Revalidation Triggers` if present
  - From roadmap.md: note upstream dependencies and whether this spec is adjacent to `Existing Spec Updates`
- **Revalidation watchlist**:
  - Identify downstream specs, neighboring existing-spec updates, or rollout-sensitive design notes that may need revalidation if this spec changes
  - Call out when the current spec shape looks too broad and may want roadmap/design splitting instead of more local repair

### Step 3: Generate Report

Create report in the language specified in spec.json covering:
1. **Spec Configuration**: Spec type, workflow approach, artifact toggles (enabled / disabled)
2. **Journey Progress**: Ordered phase list with status indicators using lifecycle-navigation.md:
   - `completed` = phase approved in spec.json
   - `in-progress` = phase file exists but not yet approved
   - `upcoming` = phase not yet started
   - `skipped` = artifact disabled in spec.json
3. **Phase Details**: For each enabled phase, show completion percentage
4. **Task Breakdown**: If tasks exist, show completed/remaining counts
5. **Boundary Context**: Upstream/downstream, out-of-boundary, and allowed dependency notes when available
6. **Revalidation Watchlist**: Downstream or adjacent work likely affected by changes to this spec
7. **Execution Path**: Identify which of the 8 execution paths this spec follows (see lifecycle-navigation.md worked examples: Path A through Path H)
8. **Next Actions**: Computed from lifecycle-navigation.md next-step algorithm -- exact command to run next
9. **Required Gates**: Design review, implementation validation, and retrospective status when enabled
10. **Blockers**: Any issues preventing progress
11. **Multi-repo linkage** (only when relevant): if this is a **satellite**, show the parent repo + spec pointer, role, branch parity, and local change checklist instead of a phase journey; if this spec **owns satellites** (`affected_repos`), list the linked light repos and why.

**Format**: Clear, scannable format with emojis for status

## Safety & Fallback

### Error Scenarios

**Spec Not Found**:
- **Message**: "No spec found for `$ARGUMENTS`. Check available specs in `{{KIRO_DIR}}/specs/`"
- **Action**: List available spec directories

**Incomplete Spec**:
- **Warning**: Identify which files are missing
- **Suggested Action**: Point to next phase command

### List All Specs

To see all available specs:
- Run with no argument or use wildcard
- Shows all specs in `{{KIRO_DIR}}/specs/` (including `specs/features/`, `specs/bugs/`, `specs/tech-debt/`, and `specs/chores/` subdirectories) with their status

**Misplacement Check**: For each spec found, verify the directory matches `spec_type`:
- `spec_type: "feature"` should be under `specs/features/`
- `spec_type: "bugfix"` should be under `specs/bugs/`
- `spec_type: "tech-debt"` should be under `specs/tech-debt/`
- `spec_type: "chore"` should be under `specs/chores/`
- Specs in the old flat `specs/` path get a migration nudge: "Consider moving to specs/features/, specs/bugs/, specs/tech-debt/, or specs/chores/ for better organization"
