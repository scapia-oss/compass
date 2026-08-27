# Task Generation Rules

Write tasks in plain, simple English. Follow `rules/document-style.md`.
Use concrete names from the LLD when they help implementation: files, classes, methods, routes, widgets, APIs, and tables.

## Milestone Structure (DEFAULT — read first)

Tasks are generated as **milestones**. A **major task is one milestone**: the unit that the
implementer builds, tests, reviews, and commits **as a whole**. Its **sub-tasks are the ordered
steps inside that one unit** — they are NOT independently tested or committed.

This exists for a concrete reason: on slow build/test stacks (e.g. Gradle), running a build+test cycle
for every `1.1`, `1.2`, `1.3` is the dominant cost. Batching verification to **once per milestone**
removes that waste while keeping TDD honest.

**A milestone that changes behavior is shaped like this:**
1. **A test step.** Every such milestone has one. Its **position** is what varies:
   - **`N.1` — Write failing tests (RED)** when the tests' failure is itself the evidence (see "Does
     this milestone need a RED step?" — existing code path whose behavior is changing, or a bugfix
     reproduction). They must fail on an assertion before implementation.
   - **Otherwise a test step alongside/after the implementation steps** — written with the code and run
     at the verify gate. This is the default for brand-new code, where a "failing" test would only be a
     compile error.
   Either way: derive property-based invariants from EARS criteria where a PBT library exists, and apply
   `rules/test-value-guidance.md` — test behavior and contracts, not enum existence, constants,
   generated DTO accessors, or framework annotations.
2. **Implementation steps**: the ordered work. Each step references its specific requirement IDs
   (traceability preserved).
3. **`N.k` — Integrate & verify (scoped GREEN gate)**: the milestone's own tests plus the test
   targets covering its `_Boundary:_`, a compile/build of the affected module(s), and a smoke check
   **only when the milestone changes boot, wiring, or runtime config**. Write it as a scoped step —
   do NOT write "full build + full suite" into a milestone's verify step.

**Where the full build + full test suite + smoke runs:** ONCE per implementation run, as a
**run-closing gate** the executing skill (`kiro-impl`) adds after the last milestone of that run — and
again at `/kiro-validate-impl`. It is deliberately NOT part of any milestone's task text, because
which milestone is "last" depends on what the engineer selected for that run, and `tasks.md` cannot
know that.

**Every verify step carries an `Evidence:` bullet** naming the concrete scoped checks that must pass,
e.g. `Evidence: auth module tests pass (scoped); login smoke still succeeds`. This makes the step's
completion observable and tells the implementer exactly which scoped commands to run.

### Does this milestone need a RED step? (one question, not a judgment call)

First, the thing this decision is NOT about: **every milestone that changes behavior gets tests.** This
section decides only whether the tests are written **first, and witnessed failing** (a RED step), or
written **alongside the implementation** and run at the milestone's verify gate. Dropping RED never
drops tests.

**RED earns its cost only when the test's FAILURE is the evidence.** That is true in exactly one
situation: **the code path already exists and its behavior is changing.** Then a passing test is
ambiguous — it may pass because the change is correct, or because the test never exercised the change —
and watching it fail first is what removes the ambiguity.

It is NOT true for brand-new code: there the "failure" is a missing symbol, i.e. a compile/import
error, which this framework already rejects as an invalid RED (a structural failure is a broken test,
not a red one). Writing a RED step for code that does not exist yet buys a compile error, not evidence.

**RED step REQUIRED when both hold:**
1. the milestone changes the behavior of a code path that **already exists** (or asserts a behavior the
   current code gets wrong), AND
2. a wrong result is expensive — it moves money, decides access, mutates or migrates stored data,
   changes a published contract's shape/status codes, or depends on ordering/concurrency.

Plus one case that is required on its own, regardless of (2), because the failing test *is* the
reproduction: **a bugfix regression test must first prove the bug exists** before the fix lands.

**RED step OMITTED when EVERY step of the milestone is one of:**
- new code with no pre-existing behavior to contradict (tests are written with the implementation and
  run at the verify gate)
- a config/yaml/property value, or a dependency bump
- a DTO / response-shape field addition carrying no logic
- annotation-only wiring, scaffolding, or a build/test-harness change
- copy, labels, or docs
- a test-only file move/rename

**"It is business logic" is NOT a criterion** — nearly all code is business logic, so that phrasing
makes every milestone RED and defeats the point. Ask the two questions above instead; both have factual
answers you can read off the diff and the boundary.

**Default when unsure:** does the code path already exist? Yes ⇒ RED. No ⇒ tests written with the
implementation. Either way the milestone still carries its scoped verify step, and its tests still
exist before the milestone can close.

**Milestone sizing (enforce strictly — the inner loop runs blind between RED and the scoped GREEN gate):**
- One vertically coherent, independently testable unit (a component, a layer, a flow).
- Roughly **2–5 implementation steps** plus the RED step and the verify step. If a milestone needs
  more, split it into multiple milestones (`1.`, `2.`, `3.` …), each with its own verify gate.
- One responsibility boundary. Cross-boundary work becomes its own integration milestone.

**Where annotations go:** `_Boundary:_`, `_Depends:_`, and `(P)` live on the **major-task
(milestone) line** — the milestone, not the sub-step, is the execution and parallelism unit.
`_Requirements:_` stays on each sub-step for traceability.

**Commit granularity:** one commit per milestone, after its scoped GREEN gate passes (execution
concern, handled by `kiro-impl`).

**Standalone major tasks**: a milestone with no behavior to test (per the OMITTED list above) whose work is a
single coherent step — pure scaffolding or one config value — may collapse to a single line with no
sub-steps at all. Anything that changes behavior uses the full milestone shape, test step included.

## Test Value Filter

Do not add task steps that only test the platform.

- Skip enum-value, constant-literal, generated DTO accessor, generated-code, and annotation-only tests.
- Add tests when an enum parses, maps, falls back, serializes, stores a DB/API value, or drives state rules.
- Add tests when a DTO validates input, changes JSON shape, sets defaults, or protects backward compatibility.
- Add tests when constants control branching, limits, external names, or compatibility.

Rule: test behavior and contracts, not existence.

## Core Principles

### 1. Natural Language Descriptions
Focus on capabilities and outcomes, not code structure.

**Describe**:
- What functionality to achieve
- Business logic and behavior
- Features and capabilities
- Domain language and concepts
- Data relationships and workflows

**Avoid**:
- File paths and directory structure
- Function/method names and signatures
- Type definitions and interfaces
- Class names and API contracts
- Specific data structures

**Rationale**: Implementation details (files, methods, types) are defined in design.md. Tasks describe the functional work to be done.

### 2. Task Ordering Principle

**Order implies dependency**: Task N implicitly depends on all tasks before it. This is the primary dependency mechanism.

**Tasks must follow this phase order**:
1. **Foundation**: Environment setup, test infrastructure, shared utilities, database schema, configuration
2. **Core**: Primary feature implementation (parallel-capable tasks grouped here)
3. **Integration**: Wiring components together, cross-boundary connections
4. **Validation**: E2E tests, edge cases, regression checks

**Rationale**: Foundation work unblocks everything else. Placing setup tasks early prevents downstream blocking. Core tasks can often run in parallel because foundation is already complete.

### 3. Task Integration & Progression

**Every task must**:
- Build on previous outputs (no orphaned code)
- Connect to the overall system (no hanging features)
- Progress incrementally (no big jumps in complexity)
- Respect architecture boundaries defined in design.md (Architecture Pattern & Boundary Map)
- Honor interface contracts documented in design.md
- Carry reuse decisions from the design. If the LLD says an existing component, helper, service, mapper,
  DTO, widget, adapter, config wrapper, or fixture is reused or extended, write the task that way instead
  of inventing a new unit.
- Use major task summaries sparingly—omit detail bullets if the work is fully captured by child tasks.

**Each milestone ends with its own `Integrate & verify` step** (scoped: its tests + its boundary's
test targets + affected-module build, plus smoke only if boot/wiring changed) that wires its steps
together and proves them as a unit. The full build + full suite runs once per run as the run-closing
gate, not here. When milestones must be wired to each other, add a final integration **milestone**
(its own major task) rather than burying cross-milestone wiring inside an unrelated milestone.

### 4. Dependency Declaration

**Default**: Sequential ordering handles most dependencies (task N depends on tasks before it).

**Explicit declaration required when**:
- A task depends on a specific task in a different major-task group (cross-boundary)
- The dependency is non-obvious from ordering alone
- A task can skip ahead of its position (declared via `(P)`) but still needs specific prior work

**Format**: `_Depends: 1.2, 2.3_` — placed alongside `_Requirements:_` in task detail sections.

**Do not over-annotate**: If a task simply depends on the task directly before it, ordering alone is sufficient.

### 5. Boundary Scope

**Each task should declare its component boundary** using design.md component/module names:
- `_Boundary: AuthService_` or `_Boundary: API Layer, UserRepository_`
- Helps validate parallel safety: tasks with non-overlapping boundaries are parallel candidates
- Helps agents understand scope: what to touch and what not to touch

**When to use**: Required for tasks marked `(P)` to validate parallel safety. Omit for sequential tasks where scope is obvious from the description.

**Boundary rule**:
- Each executable task should stay within a single responsibility boundary
- If work must cross boundaries, make it an explicit integration task rather than a normal implementation task
- Do not hide cross-boundary coordination inside a task that appears local

### 6. Milestone Sizing

**Guidelines**:
- **Major tasks (milestones)**: one coherent, independently testable unit; ~2–5 implementation steps
  between the RED step and the GREEN verify gate. Split into more milestones rather than growing one.
- **Sub-tasks (steps)**: 1-3 hours each, 3-10 details per step. A milestone that changes behavior has a
  test step (first, when RED is required; otherwise alongside the implementation); the last step is
  always the scoped `Integrate & verify` gate.
- Keep milestones small: implementation runs blind between RED and the scoped GREEN gate, so an
  oversized milestone makes a failed gate hard to diagnose. Small, boundary-disjoint milestones are
  also what keeps a cross-milestone break out of the run-closing gate.

**Don't force arbitrary numbers** - let logical grouping determine structure, within the sizing bound.

### 7. Requirements Mapping

**End each task detail section with**:
- `_Requirements: X.X, Y.Y_` listing **only numeric requirement IDs** (comma-separated). Never append descriptive text, parentheses, translations, or free-form labels.
- For cross-cutting requirements, list every relevant requirement ID. All requirements MUST have numeric IDs in requirements.md. If an ID is missing, stop and correct requirements.md before generating tasks.
- Reference components/interfaces from design.md when helpful (e.g., `_Contracts: AuthService API`)

### 7.5 Observable Completion

**Each executable task must include at least one detail bullet that describes the observable completed state**:
- Phrase it as a deliverable, runtime behavior, persisted state, UI state, endpoint behavior, test result, or integration outcome
- Avoid vague bullets like "implement support", "wire things up", or "handle logic" unless paired with a concrete observable result
- Prefer making one detail bullet clearly answer: "What will be true when this task is done?"
- Keep this within the existing task body; do not add extra bookkeeping fields

### 8. Code-Only Focus

**Include ONLY**:
- Coding tasks (implementation)
- Testing tasks (unit, integration, E2E)
- Technical setup tasks (infrastructure, configuration)

**Exclude**:
- Deployment tasks
- Documentation tasks
- User testing
- Marketing/business activities

## Task Plan Review Gate

Before writing `tasks.md`, review the draft task plan and repair local issues until the plan passes or a true spec gap is discovered.

### Coverage Review

- Every requirement ID from `requirements.md` must appear in at least one task.
- Every design component, interface/contract, integration point, runtime prerequisite, and validation concern from `design.md` must be represented by at least one task.
- If coverage is missing because the task plan is incomplete, repair the draft tasks and review again.
- If coverage cannot be added cleanly because requirements or design are ambiguous, contradictory, or underspecified, stop and return to the requirements/design phase instead of papering over the gap in `tasks.md`.

### Executability Review

- Every sub-task must be executable as written, usually within 1-3 hours.
- Every sub-task must produce a verifiable deliverable (behavior, artifact, endpoint, UI state, config, migration, test, or integration result).
- Every executable sub-task must include at least one detail bullet that states the observable completion condition.
- Every `Integrate & verify` step must carry an `Evidence:` bullet naming **scoped** checks. Reject a
  verify step whose text asks for a full build or the full test suite — that runs once per run as
  `kiro-impl`'s run-closing gate, never per milestone.
- Every milestone that changes behavior must have a test step. Whether that step is **RED** (written
  first, witnessed failing) follows the one question in "Does this milestone need a RED step?" — reject
  a RED step invented for brand-new code or for a config/DTO/wiring milestone (its failure would be a
  compile error, not evidence), and reject a missing RED step on a bugfix regression test or on a change
  to an existing code path where a wrong result moves money, decides access, mutates/migrates stored
  data, changes a published contract, or depends on ordering.
- Test steps must pass the Test Value Filter. Remove tests that only prove enum values, constants,
  generated DTO accessors, generated code, or annotation-only wiring.
- Split tasks that combine multiple independently verifiable outcomes.
- Split tasks that combine multiple responsibility boundaries unless they are explicit integration tasks.
- If many tasks require broad `_Boundary:_` scopes or repeated cross-boundary coordination, stop and return to design or roadmap decomposition instead of forcing the spec through task generation.
- Merge or collapse tasks that are too small, bookkeeping-only, or not meaningful execution units.
- Make implicit prerequisites explicit as preceding tasks.
- Reject tasks that create a new helper, component, mapper, DTO, widget, service, adapter, config wrapper,
  or fixture when the LLD identified an existing one to reuse or extend.
- Re-check `_Depends:_`, `_Boundary:_`, and `(P)` markers after edits so concurrency claims still match the design boundaries and dependency graph.

### Review Loop

- Run the review gate on the draft task plan before writing `tasks.md`.
- If issues are task-plan-local, repair the draft and re-run the review gate.
- Keep the loop bounded: no more than 2 review-and-repair passes before escalating a real spec gap.
- Write `tasks.md` only after the review gate passes.

### Optional Test Coverage Tasks

- When the design already guarantees functional coverage and rapid MVP delivery is prioritized, mark purely test-oriented follow-up work (e.g., baseline rendering/unit tests) as **optional** using the `- [ ]*` checkbox form.
- Only apply the optional marker when the sub-task directly references acceptance criteria from requirements.md in its detail bullets.
- Never mark implementation work or integration-critical verification as optional—reserve `*` for auxiliary/deferrable test coverage that can be revisited post-MVP.



## Task Hierarchy Rules

### Maximum 2 Levels
- **Level 1**: Major tasks = **milestones** (1, 2, 3, 4...) — the execution/TDD/commit unit
- **Level 2**: Sub-tasks = **steps within a milestone** (1.1, 1.2, 2.1, 2.2...)
- **No deeper nesting** (no 1.1.1)
- A milestone that changes behavior always has at least a test step and its `Integrate & verify` step,
  so it is never collapsed to a single line.
- Only a major task with **no behavior to test** (per the OMITTED list in "Does this milestone need a
  RED step?") may be a single line with no sub-steps — collapse those rather than inventing filler
  steps or a RED step for a test the Test Value Filter would reject.
- Keep the milestone (major-task) description concise; reserve specifics for its steps.

### Sequential Numbering
- Major tasks MUST increment: 1, 2, 3, 4, 5...
- Sub-tasks reset per major task: 1.1, 1.2, then 2.1, 2.2...
- Never repeat major task numbers

### Parallel Analysis (default)
- Assume parallel analysis is enabled unless explicitly disabled (e.g. `--sequential` flag).
- `(P)` means: this task has no dependency on its immediately preceding peers and can run concurrently with them.
- Identify tasks that can run concurrently when **all** conditions hold:
  - No data dependency on other pending tasks
  - No shared file or resource contention
  - No prerequisite review/approval from another task
  - `_Boundary:_` annotations confirm non-overlapping component scopes
- Foundation-phase tasks (see Task Ordering Principle) are rarely `(P)` — they establish shared prerequisites.
- Core-phase tasks are the primary candidates for `(P)` since foundation is already complete.
- Validate that identified parallel tasks operate within separate boundaries defined in the Architecture Pattern & Boundary Map.
- Confirm API/event contracts from design.md do not overlap in ways that cause conflicts.
- `(P)` tasks with cross-boundary dependencies must declare `_Depends: X.X_` explicitly.
- `(P)` is a **milestone-level** marker: apply it to the major task (milestone) when its
  `_Boundary:_` is disjoint from its sibling milestones. Sub-steps within a milestone are inherently
  ordered (RED → implementation → verify) and are NOT individually marked `(P)`.
  - Example: `- [ ] 3. (P) Reporting module`
- If sequential mode is requested, omit `(P)` markers entirely.
- Group parallel tasks logically (same parent when possible) and highlight any ordering caveats in detail bullets.
- Explicitly call out dependencies that prevent `(P)` even when tasks look similar.

### Checkbox Format (milestone-structured)
```markdown
- [ ] 1. Foundation: environment and test infrastructure setup
  - No behavior to test (build/test-harness change) — no test step; collapsed to one line
  - Evidence: affected module compiles; existing harness tests still pass (scoped)
  - _Requirements: 1.1_
  - _Boundary: build config, test harness_

- [ ] 2. Authentication module
  - _Boundary: AuthService, UserRepository_
- [ ] 2.1 Write failing tests for login + token issue (RED)
  - Unit + property tests for credential validation and JWT issuance; they fail before impl
  - _Requirements: 2.1, 2.2_
- [ ] 2.2 Implement user model + password hashing
  - _Requirements: 2.1_
- [ ] 2.3 Implement login endpoint + JWT issuance
  - _Requirements: 2.2_
- [ ] 2.4 Integrate & verify Authentication: scoped GREEN gate
  - Evidence: auth module builds; auth + UserRepository test targets GREEN (scoped); login smoke succeeds
  - _Requirements: 2.1, 2.2_

- [ ] 3. (P) Reporting module
  - _Boundary: ReportingService_  _Depends: 1_
- [ ] 3.1 Write failing tests for report generation (RED)
  - _Requirements: 3.1_
- [ ] 3.2 Implement report aggregation + export
  - _Requirements: 3.1_
- [ ] 3.3 Integrate & verify Reporting: scoped GREEN gate
  - Evidence: reporting module builds; ReportingService test targets GREEN (scoped)
  - _Requirements: 3.1_
```
*(Milestones 2 and 3 carry disjoint `_Boundary:_`, so milestone 3 is marked `(P)` — milestones, not
sub-steps, are the parallelism unit. No milestone's verify step names a full build or full suite: that
runs once per run, as `kiro-impl`'s run-closing gate.)*

## Requirements Coverage

**Mandatory Check**:
- ALL requirements from requirements.md MUST be covered
- Cross-reference every requirement ID with task mappings
- If gaps found: Return to requirements or design phase
- No requirement should be left without corresponding tasks

Use `N.M`-style numeric requirement IDs where `N` is the top-level requirement number from requirements.md (for example, Requirement 1 → 1.1, 1.2; Requirement 2 → 2.1, 2.2), and `M` is a local index within that requirement group.

Document any intentionally deferred requirements with rationale.
