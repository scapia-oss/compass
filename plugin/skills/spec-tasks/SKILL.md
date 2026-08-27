---
name: spec-tasks
description: Generate implementation tasks from requirements and design. Use when creating actionable task lists.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion
argument-hint: <feature-name> [-y] [--sequential]
metadata:
  shared-rules: "document-style.md, command-tracking.md, test-value-guidance.md, tasks-generation.md, tasks-parallel-analysis.md, lifecycle-navigation.md, lifecycle-impl-handoff.md, contract-negotiation.md, codebase-grounding.md, interaction-style.md, global-context-loading.md, learning-promotion.md"
  shared-templates: "specs/tasks.md"
  shared-scripts: "record-command-fired.py, validate-patterns-append-only.py"
---

# kiro-spec-tasks Skill

## Core Mission
- **Success Criteria**:
  - All requirements mapped to specific tasks
  - Tasks structured as **milestones**: each major task is one verify + commit unit. Every milestone that
    changes behavior has a **test step**; it is written **failing first (RED)** only when the failure is
    the evidence — an existing code path whose behavior is changing, or a bugfix reproduction — and
    otherwise sits alongside the implementation. A milestone with no behavior to test (config,
    dependency bump, DTO field with no logic, annotation-only wiring, scaffolding, copy/docs, test-only
    move) has no test step. Every milestone closes with a **scoped** `Integrate & verify` gate carrying
    an `Evidence:` bullet — never "full build + full suite", which runs once per run in `kiro-impl`
    (see `rules/tasks-generation.md` → "Milestone Structure")
  - Milestones sized small (~2–5 implementation steps, one boundary, independently testable)
  - Steps properly sized (1-3 hours each)
  - Clear task progression with proper hierarchy
  - Natural language descriptions focused on capabilities
  - A lightweight task-plan sanity review confirms the task graph is executable before `tasks.md` is written

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
`python3 "${CLAUDE_SKILL_DIR}/scripts/record-command-fired.py" "{spec_dir}" "kiro-spec-tasks" "tasks"` (or `python`).



Skip re-reading a file only if its content is already present in this conversation; if you cannot point to where it was loaded, read it now. Never assume steering or spec files are already loaded.
Otherwise, load all necessary context:
- `{spec_dir}/spec.json`, `requirements.md`, and the design file(s) (`design-hld.md`/`design-lld.md`, or legacy `design.md`)
- `{spec_dir}/tasks.md` (if exists, for merge mode)

**Steering + cross-spec learnings + spec-scoped decisions/learnings**: follow
`${CLAUDE_SKILL_DIR}/rules/global-context-loading.md` in full — glob-all steering and cross-spec
learnings, including `patterns.md` when present. Read spec-scoped `decisions.md`/`learnings.md` if
present, apply what was loaded, and print the context manifest.

- Determine execution mode:
  - `sequential = (sequential flag is true)`

**Validate approvals**:
- If auto-approve flag (`-y`) is true: Auto-approve requirements and design in spec.json. Tasks approval is also handled automatically in Step 4.
- Otherwise: Verify both approved (stop if not, see Safety & Fallback)

### Step 1.5: Lifecycle Check

**Read lifecycle fields from spec.json**: `spec_type`, `workflow`, `artifacts`
- If fields missing, default to: `spec_type: "feature"`, `workflow: "requirements-first"`, all artifacts enabled
- Read `rules/lifecycle-navigation.md` from this skill's directory for next-step computation

**Bugfix mode**:
- If `spec_type` is `"bugfix"`: Load `bugfix.md` as input context instead of `requirements.md`. **If `artifacts.design_hld` is `true`** (a complex bugfix that ran the HLD), also load `design-hld.md` and generate tasks from the fix design + `bugfix.md` together (honor its Boundary Commitments / blast-radius findings). Otherwise (simple bugfix, no design) generate a lightweight task list focused on: the fix itself, regression tests for unchanged behavior, and verification of expected behavior.

**Adaptive context loading**:
- If `artifacts.design_hld` is `false`: Do not attempt to load `design-hld.md`
- If `artifacts.design_lld` is `false`: Do not attempt to load `design-lld.md`
- If no design artifacts exist: Generate tasks from requirements (or bugfix analysis) alone
- Load only the artifacts that are enabled and have been generated

**Design-review gate nudge (feature, tech-debt, complex bugfix):**
- Determine `design_review_required = required_gates.design_review == true` OR (`artifacts.design_hld`, `artifacts.design_lld`, or legacy `artifacts.design` is enabled).
- If `design_review_required` is true and `{spec_dir}/design-review.md` is missing, do not silently proceed. Ask via `AskUserQuestion` per `rules/interaction-style.md`:
  - `header`: `Design gate`
  - `question`: `Design review has not run yet. Run /kiro:validate-design before task generation?`
  - Options: `Run validate-design (Recommended)` (*Stop here; run the expected design quality gate before tasks*) / `Proceed anyway` (*Explicitly bypass this gate for this run; record it in the output*)
- If the user chooses `Run validate-design`, stop and print exactly: `Next step: /kiro:validate-design {feature}`.
- If the user chooses `Proceed anyway`, continue, but include in the final output: `Design-review gate bypassed by user; run /kiro:validate-design {feature} before implementation if risk changes.`
- If the answer is unmapped, re-ask once; if still unmapped, stop rather than bypassing the gate by accident.

### Step 2: Generate Implementation Tasks

- Read `rules/tasks-generation.md` from this skill's directory for principles
- Read `rules/tasks-parallel-analysis.md` from this skill's directory for parallel judgement criteria
- Read `rules/document-style.md` from this skill's directory for plain writing style
- Read `rules/test-value-guidance.md` from this skill's directory before drafting test steps
- Read `templates/specs/tasks.md` from this skill's directory (repo override: `.kiro/settings/templates/specs/tasks.md`) for format (supports `(P)` markers)

#### Parallel Research

The following research areas are independent and can be executed in parallel:
1. **Context loading**: Spec documents (requirements.md, the design file(s) — `design-hld.md`/`design-lld.md` or legacy `design.md`), steering files
2. **Rules loading**: tasks-generation.md, tasks-parallel-analysis.md, tasks template

After all parallel research completes, synthesize findings before generating tasks.

**Generate task list following all rules**:
- Use language specified in spec.json
- Use plain, simple English from `rules/document-style.md`
- Map all requirements to tasks and list numeric requirement IDs only (comma-separated) without descriptive suffixes, parentheses, translations, or free-form labels
- Ensure all design components included
- Verify task progression is logical and incremental
- Ensure each executable sub-task includes at least one detail bullet that states what "done" looks like in observable terms
- Apply `rules/test-value-guidance.md`: create RED test steps for behavior, contracts, and risk; do not create tests only for enum existence, constants, generated DTO accessors, or framework annotations
- Apply `rules/tasks-generation.md` reuse guidance: when the LLD marks an existing component, helper, service, mapper, DTO, widget, adapter, config wrapper, or fixture as reusable/extensible, write tasks as "reuse" or "extend" that existing unit. Do not turn it into a new unit in `tasks.md`.
- Keep normal implementation tasks within a single responsibility boundary; if work crosses boundaries, make it an explicit integration task
- Annotate each task from the LLD File Structure Plan (see `rules/codebase-grounding.md` from this skill's directory): add `_Repo:_` when the task lands outside the current working repo, and `_Touchpoints:_` with the concrete entry points (`path:line` or `Class#method`). Carry the source for cross-repo touchpoints so the implementer re-locates by symbol rather than trusting a possibly-stale line number. Do not invent touchpoints — only annotate what the design grounded.
- Apply `(P)` markers to tasks that satisfy parallel criteria when `!sequential`
- Explicitly note dependencies preventing `(P)` when tasks appear parallel but are not safe
- If sequential mode is true, omit `(P)` entirely
- If existing tasks.md found, merge with new content

### Step 3: Review Task Plan

- Keep the draft task plan in working memory; do NOT write `tasks.md` yet
- Run the `Task Plan Review Gate` from `rules/tasks-generation.md`
- Review coverage:
  - Every requirement ID appears in at least one task
  - Every design component, contract, integration point, runtime prerequisite, and validation concern is represented
- Review executability:
  - Each sub-task is an executable 1-3 hour work unit
  - Each sub-task has a verifiable deliverable
  - Each executable sub-task includes an observable completion bullet
  - No implicit prerequisites remain hidden
  - `_Depends:_`, `_Boundary:_`, and `(P)` markers still match the dependency graph and architecture boundaries
- If issues are task-plan-local, repair the draft and re-run the review gate before writing
- Keep the review bounded to at most 2 repair passes
- If review exposes a real requirements/design gap or contradiction, stop and send the user back to requirements/design instead of inventing filler tasks

### Step 3.5: Run Task-Graph Sanity Review

Before writing `tasks.md`, run one lightweight independent sanity review of the task graph.

- Perform this sanity review **in the current session context — do NOT dispatch a subagent.**
- Base the review on the draft task plan plus a direct read of `requirements.md`, the design file(s) (`design-hld.md`/`design-lld.md`, or legacy `design.md` if that is what the spec has), and the task-generation rules — not a parent-synthesized coverage summary.
- Check only:
  - hidden prerequisites or missing setup tasks
  - dependency or ordering mistakes
  - boundary overlap or ambiguous ownership between tasks
  - tasks that are too large, too vague, cross boundaries without being explicit integration tasks, or are missing a verifiable deliverable
  - contradictions introduced between requirements, design, and the task graph
- Return one verdict:
  - `PASS`
  - `NEEDS_FIXES`
  - `RETURN_TO_DESIGN`
- If `NEEDS_FIXES`, repair the draft once and re-run the sanity review one time.
- If `RETURN_TO_DESIGN`, stop without writing `tasks.md` and point back to the exact gap in requirements/design.
- Keep this bounded. Do not turn it into a second full planning cycle.

### Step 4: Finalize

**Write tasks.md**:
- Create/update `{spec_dir}/tasks.md`
- Run `python3 "${CLAUDE_SKILL_DIR}/scripts/record-command-fired.py" "{spec_dir}" --reconcile-only` (or `python`) after the file is written so `spec.json.artifacts.tasks` and any missing inferred command entry are repaired deterministically.
- Update spec.json metadata:
  - Set `phase: "tasks-generated"`
  - Set `task_granularity: "milestone"` — signals to `kiro-impl` that major tasks are milestone units
    (one TDD + verify + commit per major task). Omit/legacy specs without this field run per-sub-task.
  - Set `approvals.tasks.generated: true, approved: false`
  - Set `approvals.requirements.approved: true`
  - Approve the design phase using only the approval entries that already exist in spec.json — set `approvals.design.approved: true` for combined-design specs, or `approvals.design_hld.approved` / `approvals.design_lld.approved` for split-design specs. Do NOT add a design approval entry that the spec did not start with (a no-design spec has none to approve; an LLD-only spec must not gain a `design_hld` or combined `design` entry here).
  - Update `updated_at` timestamp

**Approval**:
- If auto-approve flag (`-y`) is true:
  - Set `approvals.tasks.approved: true` in spec.json
  - Display task summary (task count, major groups, parallel markers)
  - Respond: "Tasks generated and auto-approved. Start implementation with `/kiro:impl {feature}`"
- Otherwise (interactive):
  - Display a summary of the generated tasks (task count, major groups, parallel markers)
  - Ask via `AskUserQuestion` per `rules/interaction-style.md` -- `header`: `Tasks`, `question`: `Tasks generated. Approve and proceed to implementation?`, options `Approve (Recommended)` (*Mark tasks approved and unblock `/kiro:impl`*) / `Request changes` (*Keep tasks unapproved; tell me what to adjust*)
  - If the user approves:
    - Set `approvals.tasks.approved: true` in spec.json
    - Respond: "Tasks approved. Start implementation with `/kiro:impl {feature}`"
  - If the user wants changes:
    - Keep `approvals.tasks.approved: false`
    - Respond with guidance on what to adjust and re-run

### Step 4.5: Record Feedback

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
  - Steps (do these yourself, do not delegate): "Record a LEARNING for phase 'tasks' in spec dir '{spec_dir}'. AI produced: [brief summary of your output]. Human corrected: [what the user said]. Read {spec_dir}/learnings.md (create if missing) and append the entry. If the correction is generalizable, follow `rules/learning-promotion.md`: dedupe against .kiro/learnings/*.md, update .kiro/learnings/patterns.md append-only, include `Source spec` pointing back to this learning entry, and run `validate-patterns-append-only.py`."
  - Finish the append before continuing.

If the user chooses between **architecturally or technically distinct** alternatives you presented (not stylistic or naming preferences):
- Record the decision **synchronously now** (use Write/Edit directly — not via a background subagent):
  - Steps (do these yourself, do not delegate): "Record a DECISION for phase 'tasks' in spec dir '{spec_dir}'. Alternatives: [list]. Chosen: [which and why]. Read {spec_dir}/decisions.md (create if missing) and append the entry."
  - Finish the append before continuing.

### Step 5: Journey Output
After completing this phase:
- Load `rules/lifecycle-navigation.md` from this skill's directory
- Compute the next enabled phase based on workflow and artifact toggles
- Display: "All spec phases complete! Your spec is ready for implementation."
- Display progress indicator: "Phase N/M complete: [phase list with check/pending/disabled indicators]"
- Display next step using the ready-to-print handoff block in `rules/lifecycle-impl-handoff.md` (from this skill's directory; `rules/lifecycle-navigation.md` carries the compact fallback) — present BOTH commands with when-to-use and the optional-flags footer (do NOT emit a lone `/kiro:impl {feature}` line, and never pre-fill `-y` or `--review`). Per-task review is OFF by default; the footer must show how to turn it on (`--review inline|required`) for behavioral / money / auth / IO-critical work.
- Also show the required closeout gates from the handoff rule: `/kiro:validate-impl {feature}` after implementation, then `/kiro:retrospective {feature}` after validate-impl GO.

## Critical Constraints
- **Task Integration**: Every task must connect to the system (no orphaned work)
- **Boundary annotations**: Required for `(P)` tasks, recommended for all (`_Boundary: ComponentName_`)
- **Explicit dependencies**: Cross-boundary non-obvious dependencies declared with `_Depends: X.X_`
- **Executable deliverable granularity**: Each task must produce a verifiable deliverable (file, endpoint, UI component, config). Infrastructure tasks (project scaffolding, manifest, host integration, build config) must be explicit — never assume they exist
- **Observable done state**: Each executable sub-task must include at least one detail bullet that makes the completed state visible without adding new bookkeeping fields
- **No implicit prerequisites**: If a task requires a runtime, SDK, framework setup, or config file, that setup must be a separate preceding task

## Output Description

Provide brief summary in the language specified in spec.json:

1. **Status**: Confirm tasks generated at `{spec_dir}/tasks.md`
2. **Task Summary**:
   - Total: X milestones (major tasks), Y steps (sub-tasks)
   - All Z requirements covered
   - Each behavior-changing milestone has a test step (RED-first where the failure is the evidence); every milestone has a scoped `Integrate & verify` gate with an `Evidence:` bullet
   - Average step size: 1-3 hours
3. **Quality Validation**:
   - All requirements mapped to tasks
   - Design coverage and runtime prerequisites reviewed
   - Task dependencies verified
   - Task plan review gate passed
   - Independent task-graph sanity review passed
   - Testing tasks included
4. **Next Action**: Review tasks and proceed when ready
5. **Required Gates**: If implementation is next, name `/kiro:validate-impl {feature}` and `/kiro:retrospective {feature}` as the required post-implementation gates

**Format**: Concise (under 200 words)

## Safety & Fallback

### Error Scenarios

**Requirements or Design Not Approved**:
- **Stop Execution**: Cannot proceed without approved requirements and design
- **User Message**: "Requirements and design must be approved before task generation"
- **Suggested Action**: "Review and approve the outstanding requirements/design, then re-run `/kiro:spec-tasks {feature}`. (Fast-track: add `-y` to auto-approve requirements, design, and tasks and skip your review — low-risk specs only; default is to review each before approving.)"

**Missing Requirements or Design**:
- **Stop Execution**: Both documents must exist
- **User Message**: "Missing requirements.md or design.md at `{spec_dir}/`"
- **Suggested Action**: "Complete requirements and design phases first"

**Incomplete Requirements Coverage**:
- **Warning**: "Not all requirements mapped to tasks. Review coverage."
- **User Action Required**: Confirm intentional gaps or regenerate tasks

**Spec Gap Found During Task Review**:
- **Stop Execution**: Do not write a patched-over `tasks.md`
- **User Message**: "Requirements/design do not provide enough clear coverage to generate an executable task plan"
- **Suggested Action**: "Refine requirements.md or design.md, then re-run `/kiro:spec-tasks {feature}`"

**Template/Rules Missing**:
- **User Message**: "Template or rules files missing in `.kiro/settings/`"
- **Fallback**: Use inline basic structure with warning
- **Suggested Action**: "Check repository setup or restore template files"
- **Missing Numeric Requirement IDs**:
  - **Auto-normalize (do NOT hard-stop)**: tasks consume requirement IDs but should recover the same way `kiro-spec-requirements` does, not block on a manual edit. If any requirement heading uses an alphabetic or missing ID (for example "Requirement A"), normalize the headings in `requirements.md` to leading numeric IDs in document order, keep the mapping consistent (never mix numeric and alphabetic), write the normalized `requirements.md` back, and print a one-line warning naming the renamed headings. Then proceed to generate tasks against the numeric IDs.
  - **Stop only if genuinely ambiguous**: if the headings cannot be normalized deterministically (duplicate IDs, contradictory numbering, or the requirement boundaries themselves are unclear), stop and ask the user to clarify rather than guessing.

### Next Phase: Implementation

Tasks are approved in Step 4 via user confirmation. Once approved:
- Autonomous implementation: `/kiro:impl {feature}`
- Specific tasks only: `/kiro:impl {feature} 1.1,1.2`
