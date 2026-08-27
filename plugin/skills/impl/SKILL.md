---
name: impl
description: Implement approved tasks using TDD with native subagent dispatch. Runs all pending tasks autonomously or selected tasks manually.
disable-model-invocation: true
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Glob, Grep, Agent, WebSearch, WebFetch
argument-hint: <feature-name> [task-numbers] [--review required|inline|off] [--validate] [--impl-model sonnet|opus] [--commit|--no-commit]
metadata:
  shared-rules: "command-tracking.md, lifecycle-navigation.md, gate-cli.md, gradle-performance.md, impl-education.md, code-simplification.md, test-value-guidance.md, language-detection.md, lang-dart-flutter.md, lang-java-backend.md, multi-repo-linkage.md, global-context-loading.md, learning-promotion.md"
  shared-templates: "specs/style-guide.md"
  shared-scripts: "kiro-gate.mjs, kiro-tasks.mjs, common.mjs, spec.schema.json, stamp-plugin-version.py, record-command-fired.py, validate-patterns-append-only.py"
---

# kiro-impl Skill

## Role
You operate in two modes:
- **Autonomous mode** (no task numbers): Dispatch a fresh subagent per execution unit, with independent review after each
- **Manual mode** (task numbers provided): Execute selected units directly in the main context

**Execution unit = milestone (default) or sub-task (legacy).** When `spec.json` has
`task_granularity: "milestone"`, the **major task is the unit**: one subagent implements the whole
milestone (write-all-tests RED → implementation steps → one **scoped** GREEN gate), one
review of the milestone diff, one `kiro-verify-completion`, and one commit (or none, when the spec's
`commit_policy` leaves the work uncommitted — see Step 0). This batches the build/test cycle to once
per milestone instead of once per sub-task — the point of the design on slow
build stacks (e.g. Gradle). When the field is absent (older specs), fall back to the legacy
per-sub-task unit. See Step 2 for queue building and Step 3 for execution.

**Where the expensive run lives (read once, it governs every gate in this skill).** Each milestone's
GREEN gate is **scoped**: the milestone's own tests, the test targets covering its `_Boundary:_`, a
build/compile of the affected module(s), and a smoke check only when the milestone changed boot,
wiring, or runtime config. The **full build + full test suite + smoke runs ONCE per run**, in the
**run-closing full gate** (Step 3.5) after the last milestone of this run — and again at
`/kiro:validate-impl`. This is what keeps a multi-milestone run from paying N full suites on a slow
stack. **A milestone's task text does not decide this**: many existing `tasks.md` files (written before
this rule) say "full build + suite + smoke" in their `Integrate & verify` step — run that step
**scoped** anyway and say so in the report. Never regenerate `tasks.md` just for this wording.

## Core Mission
- **Success Criteria**:
  - All tests written before implementation code
  - Property-based invariants derived from EARS acceptance criteria are tested where a PBT library is available
  - Code passes all tests with no regressions
  - Tasks marked as completed in tasks.md
  - Implementation aligns with design and requirements
  - Task completion follows the selected review mode

## Review Mode
- **Default review mode is `off`** — per-task review is opt-IN. Standard runs implement with TDD (RED/GREEN) and the
  `kiro-verify-completion` evidence gate, but no per-task reviewer subagent unless the user asks for one.
- Accept explicit forms: `--review required|inline|off`
  - `--review required` → fresh reviewer subagent per task (strongest)
  - `--review inline` → review in the main context (lighter than a subagent)
- Also accept clear natural-language opt-ins such as `with review` / `review on` as `inline`, and explicit
  `skip review` / `without review` as `off`
- If the request is ambiguous, keep the default `off`
- **Because review is off by default, `kiro-verify-completion` + `/kiro:validate-impl` are the standing quality
  gates** (see the review-off banner in Step 3 and the mandatory-validate rule in Step 4). The Step 3 banner MUST
  surface, on every default run, that per-task review is off and how to turn it on for risky changes.

## Execution Steps

### Step 0: Lifecycle Awareness

**Spec Path Resolution**: The feature directory may be in one of five locations (check in this order):
1. `.kiro/specs/features/<feature>/spec.json` (categorized feature)
2. `.kiro/specs/bugs/<feature>/spec.json` (categorized bugfix)
3. `.kiro/specs/tech-debt/<feature>/spec.json` (categorized tech debt)
4. `.kiro/specs/chores/<feature>/spec.json` (categorized chore)
5. `.kiro/specs/<feature>/spec.json` (legacy flat structure)

If `spec.json` contains a `spec_path` field, use that as the canonical path. Otherwise, use whichever location exists. All subsequent file reads/writes for this spec use the resolved path. Throughout this skill, `{spec_dir}` denotes that resolved path; project-global paths under `.kiro/steering/`, `.kiro/learnings/`, and `.kiro/settings/` are NOT spec-relative and keep their `.kiro/` form.

**Record command fired**: Read `rules/command-tracking.md`, then run
`python3 "${CLAUDE_SKILL_DIR}/scripts/record-command-fired.py" "{spec_dir}" "kiro-impl" "implementation"` (or `python`).

Read `{spec_dir}/spec.json` and extract `spec_type`, `workflow`, `artifacts`, `task_granularity`, and `commit_policy` to determine the spec's shape before loading any other files.

**Determine the commit policy** (chosen by the developer at `/kiro:spec-init`; governs step (e) of every unit):
- `commit_policy == "leave-uncommitted"` → this run makes **no git commits**. Implement, gate, and flip tasks.md markers as usual, then leave every change in the working tree for the developer to stage and commit.
- `commit_policy == "per-task"`, any other value, or **absent** (specs created before the field existed) → commit each unit as described in step (e). This is the default.
- **Per-run override**: `--no-commit` (or a clear "don't commit" / "leave it uncommitted" request) forces `leave-uncommitted` for this run; `--commit` forces `per-task`. A flag beats `spec.json` but never rewrites it — the spec's setting stands for the next run.
- Announce the resolved policy in the Step 3 banner so the developer knows before any code is written whether commits are coming.

**Determine execution granularity**:
- If `task_granularity == "milestone"`: execution unit is the **milestone** (major task). Use the milestone flow in Steps 2–3.
- If the field is absent or any other value: legacy per-sub-task unit. Use the legacy flow.

**Verify readiness**:
- Tasks must be approved: check `approvals.tasks.approved = true` (or at minimum `approvals.tasks.generated = true`)
- If tasks are not approved, stop and suggest the user complete prior phases (see Safety & Fallback)

**Determine design artifacts to load**:
- If `artifacts.design_hld` is enabled, load `design-hld.md` in Step 1
- If `artifacts.design_lld` is enabled, load `design-lld.md` in Step 1
- If neither HLD nor LLD is enabled, load `design.md` if it exists (backward compatibility)
- If both HLD and LLD are enabled, load both

**Bugfix specs** (`spec_type: "bugfix"`):
- Load `design-hld.md` if `artifacts.design_hld` is `true` (a complex bugfix promoted by the complexity gate); otherwise no design files exist — skip design loading
- TDD cycle adapts: focus regression tests on the "Unchanged Behavior" section from `bugfix.md`
- The Feature Flag Protocol is typically skipped for bugfix specs (fixes restore expected behavior, not add new behavior)

**Backward compatibility**: If `spec_type`, `workflow`, or `artifacts` fields are missing, default to `spec_type: "feature"`, `workflow: "requirements-first"`, all artifacts enabled. Refer to `rules/lifecycle-navigation.md` for the full backward-compatibility rules.

### Step 1: Gather Context

Skip re-reading a file only if its content is already present in this conversation; if you cannot point to where it was loaded, read it now. Never assume steering or spec files are already loaded.
Otherwise, load all necessary context:
- `{spec_dir}/spec.json`, `requirements.md`, `tasks.md`
- Design files as determined by Step 0 (design-hld.md, design-lld.md, design.md, or none for bugfix specs)
- Relevant local agent skills or playbooks only when they clearly match the task's host environment or use case; read the specific artifact(s) you need, not entire directories

**Steering + cross-spec learnings + spec-scoped decisions/learnings**: follow
`${CLAUDE_SKILL_DIR}/rules/global-context-loading.md` in full — glob-all steering and cross-spec
learnings, read spec-scoped `decisions.md`/`learnings.md` if present, print the context manifest.
The full contents you load here are what Step 3a inlines into the implementer subagent (that file's
Rule 5 covers the deterministic full-inline + fallback-path + post-dispatch cross-check specific to
this skill's subagent dispatch). (The reviewer subagent receives the spec paths in its dispatch and
reads decisions/learnings from there.)

#### Parallel Research

The following research areas are independent and can be executed in parallel:
1. **Spec context loading**: spec.json, requirements.md, tasks.md, and design files per Step 0 (design-hld.md, design-lld.md, design.md, or bugfix.md)
2. **Steering, playbooks, & patterns**: Core steering, task-relevant extra steering, matching local agent skills/playbooks, and existing code patterns

After all parallel research completes, synthesize implementation brief before starting.

#### Preflight

**Ensure a working branch** (before any implementation or commit):
- Do this even when `commit_policy == "leave-uncommitted"`. This run won't commit, but the developer will — and an uncommitted change made while `HEAD` is on `main` is a change they can only commit onto `main`. Creating the branch first costs nothing and carries the working tree with it.
- Run `git rev-parse --abbrev-ref HEAD` to get the current branch.
- NEVER commit directly to a default/protected branch (`main`, `master`, `develop`, `pre-prod`, `sandbox`, `staging`, `production`, or any branch the repo treats as protected). The bundled `git-guard` PreToolUse hook also blocks this — but create the branch proactively rather than waiting for the hard block.
- If on such a branch, check out a new branch before starting work. Choose the prefix from the spec's nature (its requirements/design intent), NOT a fixed `feat/`:
  - `feat/` — new feature or capability
  - `fix/` — bug fix
  - `hotfix/` — urgent production fix
  - `tech-debt/` — refactor / cleanup / debt paydown with no behavior change
  - `chore/` — tooling / maintenance / non-functional changes
  - `docs/` — documentation only

**Validate approvals** (confirmed in Step 0):
- Verify tasks are approved in spec.json (stop if not, see Safety & Fallback)
- **Structural spec check (deterministic)**: run the gate CLI `kiro-gate.mjs validate <feature>` (see `rules/gate-cli.md` for how to locate it). A non-zero exit means spec.json is structurally broken (bad enum, incoherent approvals graph, approvals/artifacts drift) — stop and report the stderr findings rather than implementing against a malformed spec. If the CLI is not present, skip this check.
- **Stamp plugin version (deterministic)**: record the plugin version producing this implementation beside `spec.json`, so this run's PR surfaces which kiro version did the work (adoption tracking). Run `python3 "${CLAUDE_SKILL_DIR}/scripts/stamp-plugin-version.py" "{spec_dir}"` (or `python`). It writes/refreshes `kiro-plugin-version-<version>.md` next to `spec.json`, prunes any older marker, and is a no-op when unchanged (so re-implementing a spec created on the same version adds no diff; a newer version re-stamps it). Fails open — if the script or a Python runtime is unavailable, skip it, never block.


**Discover validation commands**:
- Inspect repository-local sources of truth in this order: project scripts/manifests (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, app manifests), task runners (`Makefile`, `justfile`), CI/workflow files, existing e2e/integration configs, then `README*`
- Derive a canonical validation set for this repo: `TEST_COMMANDS`, `BUILD_COMMANDS`, and `SMOKE_COMMANDS`
- Prefer commands already used by repo automation over ad hoc shell pipelines
- For `SMOKE_COMMANDS`, choose the lightest trustworthy runtime-liveness check for the app shape (for example: root URL load, Electron launch, CLI `--help`, service health endpoint, mobile simulator/e2e harness if one already exists)
- Keep the full command set in the parent context, and pass only the task-relevant subset to implementer and reviewer subagents

**Detect property-based testing (PBT) support**:
- Check the repo's manifests/lockfiles for an installed PBT library: `fast-check`/`jsverify` (JS/TS), `hypothesis` (Python), `jqwik`/`kotest-property` (JVM), `proptest`/`quickcheck` (Rust), `gopter`/`rapid` (Go), `StreamData` (Elixir), `Hedgehog`/`QuickCheck` (Haskell), `FsCheck` (.NET), or similar
- Record `PBT_LIB` (the detected library + its idiom) or `PBT_LIB = none`. Pass this to implementer subagents so they know whether property tests are available
- **Never add a new PBT dependency** as part of a task unless the task explicitly calls for it; when `PBT_LIB = none`, implementers fall back to example-based + boundary/edge-case tests

**Establish repo baseline**:
- Run `git status --porcelain` and note any pre-existing uncommitted changes
- **Pre-flight test baseline (MANDATORY before any code is written — but SCOPED by default)**: learn whether the tree is already green before writing code, so a pre-existing failure never costs debug rounds at a later gate.
  - **Scope it to the work (the default)**: run the test targets covering the selected units' `_Boundary:_` — the modules/classes this run will actually touch — not the whole suite. The baseline exists for **attribution** ("is this failure mine or was it already there?"), and a boundary-scoped baseline attributes just as well while costing seconds instead of minutes. On a slow stack (Gradle) this is the difference between coding immediately and waiting out a full suite before a single line is written.
  - **Run the FULL suite as the baseline only when** it is genuinely cheap on this stack (fast suite, warm cache), the selected units' boundaries are broad or unclear, or the user asked for it. Say which of the two you ran.
  - **Green baseline** → record `BASELINE: green` (noting scoped vs full) and proceed; any new failure at a later gate is attributable to this run's changes.
  - **Pre-existing failures** → do NOT silently absorb them. Capture the exact failing set as `BASELINE_FAILURES`. If the failures are broad or block the build, **halt** and report likely upstream breakage (a broken `main`/working tree is not this run's to fix — see Safety & Fallback "Spec Conflicts with Reality"/"Upstream Ownership"). If they are clearly narrow and unrelated to every selected unit's boundary, you MAY proceed, but carry `BASELINE_FAILURES` forward so each gate counts only *new* failures as regressions, never the pre-existing ones.
  - **Consequence of a scoped baseline (handle it, do not debug-loop on it)**: the run-closing full gate (Step 3.5) may surface failures the scoped baseline never observed. Classify before debugging — see the classification rule in Step 3.5.

### Step 2: Select Tasks & Determine Mode

**Parse arguments**:
- Extract feature name from first argument
- If task numbers provided (e.g., "1.1" or "1,2,3"): **manual mode**
- If no task numbers: **autonomous mode** (all pending tasks)
- Determine review mode from the invocation:
  - omitted → `off` (the default — per-task review is opt-in)
  - `--review required`, `with review`, or `review on` → `required` (`with review`/`review on` map to `inline` if the user said "inline")
  - `--review inline` → `inline`
  - `--review off`, `skip review`, or `without review` → `off`
- Resolve `commit_policy` for this run per Step 0: `--no-commit` → `leave-uncommitted`, `--commit` → `per-task`, otherwise the value from spec.json (absent ⇒ `per-task`)
- If `--validate` appears in the invocation, set `force_validate = true` (forces `/kiro:validate-impl` after autonomous runs even when the conditional rules in Step 4 would skip it)
- Determine the implementer (code-writing) model: default `impl_model = sonnet`. Set `impl_model = opus` if the invocation has `--impl-model opus` or a clear natural-language request like "use Opus for implementation/code". `--impl-model sonnet` keeps the default. This controls ONLY the code-writing subagent — review, debug, and orchestration always run on the session model regardless.

**Task status markers**: tasks.md checkboxes carry execution state:
- `- [ ]` pending (not started) — actionable
- `- [-]` in-progress (a prior run dispatched it but never committed — e.g. the run crashed) — actionable; treat as a **resume** target, not as complete
- `- [x]` complete — skip
Only `- [x]` counts as done. A stale `- [-]` means the previous run did not finish that task cleanly; re-run it from scratch (the selective-staging + `kiro-verify-completion` gates make re-running safe).

**Flipping markers (deterministic write)**: wherever this skill says to flip a checkbox (mark `- [-]` in-progress in step (a)/manual step 0, or `- [x]` complete at "Marking complete"), prefer the gate CLI `kiro-tasks.mjs set <feature> <id> <pending|inprogress|done>` (see `rules/gate-cli.md`) over hand-editing tasks.md. It edits exactly the matching id (so `1` never collides with `1.1`/`11`) and refuses an ambiguous match, removing the malformed-marker error class. In milestone mode call it once per sub-step id plus the major-task id, in the same edit semantics as before. If the CLI is not present, hand-edit the markers per the rules above. This changes only HOW the marker is written, never WHEN — every approval/verify gate still gates the flip.

**Build the unit queue** (a *unit* is a milestone or a sub-task depending on granularity from Step 0):

*Milestone granularity (`task_granularity == "milestone"`) — DEFAULT:*
- Read tasks.md. The **unit is the major task (milestone)**; its sub-tasks `N.1…N.k` are the ordered
  steps it contains (RED-first `N.1`, implementation steps, `Integrate & verify` last).
- A milestone is actionable when it is not `- [x]` complete and not `_Blocked:_`. Treat a milestone
  whose major checkbox is `- [ ]` or stale `- [-]` (any of its steps started but never committed) as
  actionable; re-run the whole milestone from its current code state.
- A milestone is `- [x]` complete only when all its steps are `- [x]`.
- Check `_Depends:_` on the **major-task line** — verify referenced milestones are complete.
- Use the milestone's `_Boundary:_` (major-task line) for scope and wave grouping.
- A purely **standalone non-behavioral** major task (no RED/verify steps, e.g. scaffolding) is a
  single-step unit — run it directly without the RED→GREEN milestone cycle.

*Legacy granularity (field absent):*
- Read tasks.md, identify actionable sub-tasks (X.Y numbering like 1.1, 2.3)
- Major tasks (1., 2.) are grouping headers, not execution units
- Treat both `- [ ]` and stale `- [-]` sub-tasks as actionable; skip `- [x]`
- Skip tasks with `_Blocked:_` annotation
- For each selected task, check `_Depends:_` annotations -- verify referenced tasks are `[x]`
- If prerequisites incomplete, execute them first or warn the user
- Use `_Boundary:_` annotations to understand the task's component scope

**Reconciliation pass (pre-flight sync)**:
Before grouping into waves, reconcile the queue against code that already exists (the human, a prior partial run, or another branch may have already implemented some units). This prevents re-implementing or clobbering finished work and saves subagent dispatches.
- For each actionable unit (a milestone in milestone mode — evaluate all its steps' behavior together; a sub-task in legacy mode), do a **cheap, read-only** check of its `_Boundary:_` files: do the named symbols/functions/files already exist, and do tests covering its acceptance criteria already exist and pass?
- Mark a task `- [x]` and skip dispatch **only when all** of these hold: (1) the boundary code clearly implements the task's behavior, (2) tests that exercise that behavior exist, and (3) those tests pass when run. Annotate it `_Synced: pre-existing implementation detected at <commit-or-"working tree">_`.
- When evidence is partial or ambiguous (code exists but no tests, or tests exist but fail, or only some acceptance criteria are met), do **NOT** mark complete — run the task normally so TDD fills the gap.
- This pass is detection-only: never write or modify code here, and never mark `- [x]` without the three conditions above. When in doubt, run the task.
- If the reconciliation marked any task `- [x]`, set a flag to forward `--regression` to `/kiro:validate-impl` in Step 4 (pre-existing code may have callers outside the feature boundary that the shared-component regression check should cover).

**Group into waves** (autonomous mode only):
- Units here are milestones (default) or sub-tasks (legacy). Walk the queue in order and group adjacent `(P)` units into a *wave* when their `_Boundary:_` identifiers are pairwise disjoint (no shared file, class, module, or yaml key)
- Any overlap → split into separate waves
- Non-`(P)` units are always single-unit waves
- When in doubt about disjointness, default to single-unit waves
- The wave-builder is conservative: any boundary-identifier overlap forces a split, preserving the safety properties of selective `git add`
- In milestone mode, `(P)` is read from the **major-task line**; the sub-steps inside a milestone are always sequential (RED → impl → verify) and never split across waves

**Tag trivial units**:
- A unit is **trivial** when `_Boundary:_` lists exactly one file AND it is non-behavioral (e.g., DTO field addition, config/yaml entry, response-shape addition, test-only file). In milestone mode this is a standalone non-behavioral major task with no RED/verify steps.
- Trivial units take the Fast Path in Step 3 instead of subagent dispatch

### Step 3: Execute Implementation

**Announce the model policy (MUST, once, before any dispatch).** Print it as a crisp Markdown blockquote callout (renders as a left-bar note) — a short header plus one bullet per role, arrows to the model. No paragraphs. Use exactly this shape (keep `>` on every line):

```
> ⚡ **Model policy for this run**
> - 🧠 Planning · orchestration → **Opus 4.8** — the heavy thinking
> - ✍️ Code generation → **Sonnet 4.6** — the bulk work, keeps cost down
> - 🔍 Review · debug · verify → **Opus 4.8** — quality gate, never drops
> - › Want max quality? re-run with `--impl-model opus` (higher cost)
```

The last bullet is the **opt-out**, shown only when `impl_model = sonnet` (the default). When `impl_model = opus`, instead change the code-generation bullet to `✍️ Code generation → **Opus 4.8** — by request (max quality, higher cost)` and drop the opt-out bullet.

Adapt the names to the actual session model if it is not Opus 4.8 (planning/orchestration/review run on the session model). If `kiro-implementer` cannot be resolved (plugin not loaded), add a bullet: `- ⚠️ implementer agent unavailable → running code generation on the session model`.

**Review-mode banner (MUST when review mode is `off` — i.e. every default run).** Immediately after the
model-policy banner, print this callout. Since `off` is the default, this educates the engineer that no per-task
reviewer is running and how to turn one on for risky work:

```
> ⚠️ **per-task review is OFF** (the default) — `kiro-verify-completion` + `/kiro:validate-impl {feature}` are your quality gates
> - No reviewer subagent runs per task. For behavioral / money / auth / IO-critical changes, turn review on: re-run with `--review inline` (review in main context) or `--review required` (fresh reviewer subagent per task).
> - `/kiro:validate-impl {feature}` is MANDATORY before any feature-level success claim (it is your standing integration + spec-drift gate).
> - Spec artifacts are NOT auto-updated. If the implementation diverges from the spec (changed behavior, removed a feature, altered an interface), run `/kiro:spec-requirements {feature}` (and `/kiro:spec-design-lld {feature}` if contracts changed) so requirements/design/tasks stay in sync with the code.
```

**Commit-policy banner (MUST, once, before any dispatch).** Print one line stating the resolved policy from Step 0, so the developer knows up front where the work will end up:

```
> 📦 **Commits: per task** — one commit per milestone after its review + verification gate. (`--no-commit` to leave everything uncommitted instead.)
```

When `commit_policy == "leave-uncommitted"`, print this instead:

```
> 📦 **Commits: none — everything stays uncommitted** — I implement, gate, and tick tasks.md, then hand you the working tree. You stage and commit. (`--commit` to commit per task instead.)
```

Say which source decided it when a flag overrode the spec (e.g. `— from --no-commit, overriding this spec's per-task setting`).

**First-run walkthrough (MUST on first run).** Read `rules/impl-education.md`. If this is the **first implementation run for the spec** (`tasks.md` has zero `- [x]` tasks), print the `/kiro:impl` milestone diagram (section A) once, right after the model-policy banner, then a one-line footer with the run's real milestone/step counts. On a resume run (some tasks `- [x]`), print only the one-line reminder from that rule — not the full diagram.

**Build-stack callout (MUST when the stack is Gradle).** If the `BUILD_COMMANDS`/`TEST_COMMANDS` discovered in Step 1 invoke `gradle`/`./gradlew` (or a `build.gradle(.kts)` exists at repo root), print the **Gradle build-stack callout** from `rules/gradle-performance.md` (section A) once, after the walkthrough, so the user understands why the gates wait on the build tool. Follow its scoped-command discipline (section B) for every RED run, every inner run, and every milestone's scoped GREEN gate. Skip the callout for non-Gradle stacks.

**First-run Gradle confirmation gate (MUST, first run + Gradle only).** On the first run for the spec, if the stack is Gradle, run the one-time confirmation gate in `rules/impl-education.md` (section C): show the short "why optimize" note (name the top audit win if known), then ask one confirmation — proceed now, or pause to optimize Gradle via `/kiro:doctor`. Honor the answer, record it for the session, and never re-ask on later milestones. This gate fires at most once; non-Gradle and resume runs skip it and proceed without asking.

#### Autonomous Mode (subagent dispatch)

**Iteration discipline**: Process exactly ONE *wave* per iteration. A wave is either a single task (the default) or a group of adjacent `(P)` tasks with pairwise-disjoint `_Boundary:_` (built in Step 2). Single-task waves run the standard cycle. Multi-task `(P)` waves dispatch all non-trivial implementers in a **single message with N parallel Agent tool uses**, then reviewers in parallel after all implementers return, then commit in task-number order. Do NOT spread a wave across multiple iterations.

**Context management**: At the start of each iteration, re-read `tasks.md` to determine the next actionable wave. Do NOT rely on accumulated memory of previous iterations. After completing each iteration, retain only a one-line summary per task (e.g., "1.1: READY_FOR_REVIEW, 3 files changed") and discard the full status reports and reviewer details.

**Fast Path** (trivial tasks): For tasks tagged trivial in Step 2, execute the manual-mode flow inline in the parent context (RED → GREEN → REFACTOR → VERIFY) instead of dispatching subagents. Apply `kiro-review` inline regardless of the configured review mode. Commit selectively at the end of the wave like any other task. In a multi-task wave, fast-path work in the parent can interleave with dispatched subagent work on sibling tasks (the parent runs the trivial inline work while the dispatched Agent calls execute concurrently).

**Milestone unit cycle (default — `task_granularity == "milestone"`)**: a milestone is owned by the implementer subagent, but **RED and GREEN are two separate dispatches with a parent-run RED witness between them**, so the parent — not the subagent's self-report — confirms the tests actually failed before any implementation exists. A single dispatch that generates tests and implementation together cannot prove the tests ever failed; this split makes the RED real.

For a **behavioral** milestone (has a feature flag / behavior change):
1. **RED dispatch** (`PHASE: RED`): the subagent writes ALL of the milestone's tests first (its `N.1` step + any test work its other steps imply), feature flag OFF, runs them, captures the failing output, and **STOPs without implementing** (status `RED_READY`).
2. **Parent RED witness** (independent — this is the gate): the parent runs the milestone's tests itself (a **targeted/fast** run — the specific test files/targets just written, NOT a full build). It must observe an **assertion/behavioral** failure, not a structural (compile/import/collection) error and not a pass. Pass ⇒ tests don't exercise the behavior; structural error ⇒ broken test → re-dispatch `PHASE: RED` once to fix; only a real assertion failure clears the gate.
3. **GREEN dispatch** (`PHASE: GREEN`): a second dispatch implements the milestone's steps (`N.2 … N.(k-1)`) against the already-written, already-failing tests, then runs the **scoped** `Integrate & verify` `N.k` gate — the parent-provided `SCOPED_VERIFY_COMMANDS` for this milestone (its tests + its boundary's test targets + an affected-module build, plus smoke only when the milestone changed boot/wiring/config). It does **NOT** run the full build or full suite; the parent owns that once, in Step 3.5. Inner feedback uses fast targeted runs.
4. The parent then runs **one** review of the whole milestone diff, **one** `kiro-verify-completion`, flips every sub-step and the major checkbox to `- [x]`, and makes **one** commit for the milestone.

For a **non-behavioral** milestone (scaffolding/config/DTO — no feature flag, no meaningful RED), skip the split: a single dispatch writes any required tests + code and runs the GREEN gate, then the parent reviews/verifies/commits as in step 4.

The split adds one extra dispatch and one *targeted* RED run per behavioral milestone; it does **not** reintroduce a per-step build — and no milestone runs a full build at all. The full build + full suite + smoke runs once, in Step 3.5. The a)–g) mechanics below operate on the **unit** (a milestone here, a sub-task in legacy mode).

For each wave (one wave at a time):

**a) Dispatch implementer(s)**:
- **Mark in-progress first**: before dispatching, flip every unit in this wave to `- [-]` in tasks.md (in milestone mode set the **major-task** checkbox to `- [-]`). This records what is in flight so a crashed run is resumable. Do NOT commit this marker change on its own — it rides along with the unit's selective commit in step (e), or stays uncommitted with the rest of the work under `commit_policy: "leave-uncommitted"`.
- Dispatch the implementer according to `impl_model` (from Step 2):
  - `impl_model = sonnet` (default) → dispatch the bundled **`kiro-implementer`** subagent (`subagent_type: kiro:kiro-implementer` under the plugin — agents are namespaced under the `kiro` plugin; bare `kiro-implementer` under the npx user-level install. Use the `kiro:` form first; runs on **Sonnet**). It already carries the implementer protocol as its system prompt (generated from `templates/implementer-prompt.md`), so you supply only the per-unit context below as the invocation message — do NOT re-inline the whole protocol.
  - `impl_model = opus` (user opted in) → dispatch a normal implementer subagent seeded with `templates/implementer-prompt.md` on the **inherited session model** (so code generation runs on Opus too). Same context message.
  - Fallback: if `impl_model = sonnet` but `kiro-implementer` cannot be resolved (plugin not loaded), use the inherited-model path and note it in the banner.
- For each non-trivial unit in the wave, construct the invocation message with unit-specific context:
  - **In milestone mode**: tell the implementer this is a **MILESTONE** and list ALL its sub-steps verbatim (the `N.1` RED test step, the implementation steps, and the `N.k` Integrate & verify gate). The milestone's `_Boundary:_` is the scope.
    - **Behavioral milestone → two phased dispatches** (per the Milestone unit cycle above): first dispatch with `PHASE: RED` — write all milestone tests (flag OFF), run them, capture the failing output, STOP without implementing (status `RED_READY`). Then the parent runs its own targeted RED witness (step b). Only after the witness clears, second dispatch with `PHASE: GREEN` — implement the steps and run the **scoped** gate. Inner per-step checks use fast targeted compile/test; no full build anywhere in the milestone.
    - **Non-behavioral milestone → single dispatch** (no `PHASE`, or `PHASE: GREEN` directly): write any code the steps call for and run the scoped gate in one pass. **Which milestones take the RED split** — one question, not a judgment call: RED is worth a dispatch only when the test's *failure* is the evidence, i.e. **the code path already exists and its behavior is changing** (or a bugfix test must first prove the bug exists). For brand-new code the "failure" is a missing symbol — a compile error — which this skill already rejects as an invalid RED, so a split buys nothing. Take the **single dispatch** when every step is new code with no pre-existing behavior to contradict, a config/property value, a dependency bump, a DTO field with no logic, annotation-only wiring, scaffolding, copy/docs, or a test-only move. **"It is business logic" is not a criterion** — nearly all code is. When unsure, ask whether the code path already exists: yes ⇒ split, no ⇒ single dispatch. Either way the milestone's tests still exist and still run at its scoped gate.
    - **`SCOPED_VERIFY_COMMANDS` (MUST pass in the dispatch)**: derive from the discovered `TEST_COMMANDS`/`BUILD_COMMANDS` the concrete scoped commands for THIS milestone — the test targets for its tests and its `_Boundary:_`, the affected-module build, and a smoke command only when the milestone changed boot/wiring/config. On Gradle follow `rules/gradle-performance.md` section B (`:module:test --tests "<FQCN>" --offline`, never `clean`). Tell the implementer explicitly: **do not run the full build or full suite — the parent runs that once at the end of the run.**
    - Pass the `PHASE` directive (`RED` | `GREEN`) in the invocation message so the implementer knows whether to stop at RED or implement. On the GREEN dispatch, note that the failing tests are already in the working tree from the RED dispatch.
  - Task/milestone description and boundary scope
  - **Inlined verbatim spec excerpts**: Extract the exact text of the referenced sections from `requirements.md` and the design file(s) (loaded in Step 1) and embed under explicit headings such as `## Requirements (verbatim from requirements.md §1.2, §1.3)` and `## Design (verbatim from design.md §3.1)`. Inline the union of sections referenced by all of the milestone's steps. This removes a cold Read round-trip per subagent.
  - **Inlined design GLOBALS** (in addition to the task's §-refs): the cross-cutting sections that govern any code in this repo even when the task doesn't cite them — Architecture Pattern & Boundary Map, the interface/contracts the unit interacts with, error-handling strategy, and naming/layering conventions. The implementer runs on a literal cheaper model and will not infer these from thin context, so inject them rather than relying on path-fallback.
  - **Inlined ALL STEERING verbatim**: embed every `.kiro/steering/*.md` file you loaded in Step 1 — the core defaults AND every custom file (security, API conventions, domain rules, …) — under a `## Steering (project-wide rules — binding)` heading. Do NOT thin it to the three defaults and do NOT cherry-pick by "scope touches this unit" — that judgment call is exactly how custom steering gets dropped and a cheap implementer drifts. (Steering is small; this is a bounded add to a context that is discarded after the subagent returns.)
  - **Inlined Write-Time Code Quality verbatim**: embed the full contents of `${CLAUDE_SKILL_DIR}/rules/code-simplification.md` under its own `## Write-Time Code Quality` heading. These are the generation rules that make the implementer write clean on the first pass (no refactor pass). Inline it the same way and for the same reason as steering — the Sonnet implementer must not be left to open a fallback path. Single-sourced: the same file is cited by `/kiro:validate-impl` check E.5, so editing it updates both.
  - **Inlined Test Value Guidance verbatim**: embed the full contents of `${CLAUDE_SKILL_DIR}/rules/test-value-guidance.md` under its own `## Test Value Guidance` heading. This keeps TDD focused on behavior, contracts, and risk. Do not let the implementer write tests only for enum existence, constants, generated DTO accessors, generated code, or annotation-only wiring.
  - **Inlined Code Style Guide verbatim (when it exists and is non-empty)**: embed the full current contents of `.kiro/learnings/style-guide.md` under its own `## Style Guide (project-wide code style — binding)` heading, the same tier as steering and Write-Time Code Quality above — do NOT pass it as a fallback path only. These are broad-stroke conventions (naming, control-flow shape, layering, component structure) engineers have already corrected the AI on; they should shape every line of new code, not just be consulted on trouble. If the file doesn't exist yet or is still the empty seed template, inject nothing.
  - **Inlined Language Best Practices verbatim (when a language is detected)**: per `${CLAUDE_SKILL_DIR}/rules/language-detection.md`, detect the repo's language from its root build manifests and embed the matching `${CLAUDE_SKILL_DIR}/rules/lang-<lang>.md` (e.g. `lang-dart-flutter.md`, `lang-java-backend.md`) under a `## Language Best Practices` heading. If no language matches, inject nothing — never block. These are thin write-time idioms for the detected stack; **steering overrides them on conflict** (repo steering ＞ language pack ＞ code-simplification). Deeper review lives in the org architect skills (composed at review, Phase 2).
  - Paths to spec + steering files (active fallback) the subagent should open when its unit touches something not inlined: requirements.md, tasks.md, the design file(s) from Step 0, `.kiro/steering/`, `{spec_dir}/learnings.md`, `{spec_dir}/decisions.md`, and `.kiro/learnings/` (the whole directory — never hardcode `patterns.md`; a custom cross-spec learning file must reach the subagent too)
  - Exact requirement and design section numbers this unit must satisfy (using source numbering, NOT invented `REQ-*` aliases)
  - Parent-discovered validation commands (tests/build/smoke as relevant)
  - The detected `PBT_LIB` (property-based testing library + idiom, or `none`) so the implementer can derive property tests from the EARS acceptance criteria where available
  - Whether the unit is behavioral (Feature Flag Protocol) or non-behavioral
  - **Inlined prior learnings & decisions (binding — deterministic, not a judgment call)**: embed the FULL current contents of `{spec_dir}/learnings.md` and `{spec_dir}/decisions.md` (whichever exist) verbatim under a `## Prior learnings & decisions (binding)` heading, plus any `## Implementation Notes` entries from tasks.md relevant to this unit. These are spec-scoped and small — inline them entirely rather than selecting "relevant" ones, so a known mistake or a settled decision can never be dropped. Cross-spec `.kiro/learnings/` is passed as a fallback path (above) — tell the subagent to open every file in it (not just `patterns.md`) for generalizable patterns.
- The implementer subagent uses the inlined excerpts as primary source and builds its own Task Brief (acceptance criteria, completion definition, design constraints, verification method) before implementation
- **Dispatch via Agent tool** (as `subagent_type: kiro:kiro-implementer` — the plugin namespace; fall back to bare `kiro-implementer` only on the npx user-level install — on Sonnet by default, or an inherited-model implementer when `impl_model = opus` — see above):
  - Single-unit wave: one Agent call
  - Multi-unit `(P)` wave: emit N Agent tool uses in a **single message** so they run in parallel (in milestone mode, each parallel agent owns a full disjoint milestone)
  - Trivial units in the same wave are handled inline via the Fast Path (no Agent call) — these run in the parent (Opus), which is fine since trivial units are tiny

**b) Handle implementer status**:
- Parse implementer status only from the exact `## Status Report` block and `- STATUS:` field.
- If `STATUS` is missing, ambiguous, or replaced with prose, re-dispatch the implementer once requesting the exact structured status block only. Do NOT proceed without a parseable `RED_READY | READY_FOR_REVIEW | BLOCKED | NEEDS_CONTEXT` value.
- **Grounding cross-check (before accepting the work)**: confirm the implementer's `CONTEXT_FILES` (and its opening context manifest) names the grounding you injected — every `.kiro/steering/*.md` file by name, plus `{spec_dir}/learnings.md`, `{spec_dir}/decisions.md`, and `.kiro/learnings/style-guide.md` when those exist. This is a mechanical name-presence check (does the report list what you handed it), NOT a judgment call. If an injected grounding file is absent from the report, the subagent likely never used it — a cheaper implementer model silently dropping context is exactly the failure this guards — so re-dispatch once with an explicit "you were given these files; ground on them and list them in CONTEXT_FILES" reminder before proceeding to review. Treat the report as a cross-check against what you injected, never as standalone proof (per the parent-witness rule).
- **RED_READY** (returned by the `PHASE: RED` dispatch of a behavioral milestone) → run the **parent RED witness**, which is the real TDD gate:
  - The parent itself runs the tests the subagent just wrote — a **targeted/fast** run of those test files/targets (NOT a full build). Do not trust the subagent's reported `RED_PHASE_OUTPUT` in place of running them; the point of the split is that the parent witnesses the failure on code that has no implementation yet.
  - **Assertion/behavioral failure observed** (expected≠actual, `AssertionError`, failed expectation, falsified property) → RED is real → proceed to the `PHASE: GREEN` dispatch (step a).
  - **Tests pass** → they don't exercise the new behavior → re-dispatch `PHASE: RED` once for corrected tests; if still passing, dispatch debug.
  - **Structural error** (compile/syntax/import/module-resolution/test-collection) → broken test, not a valid RED → re-dispatch `PHASE: RED` once to fix the setup; if still structural, dispatch debug.
  - **Fallback when the parent genuinely cannot run the tests** (no runnable `TEST_COMMANDS`, environment unavailable): fall back to the **evidence-shape check** of the reported `RED_PHASE_OUTPUT` (must be an assertion failure, not structural/empty) and record that the RED was evidence-validated, not independently witnessed.
- **READY_FOR_REVIEW** (returned by the `PHASE: GREEN` dispatch, by a non-behavioral single dispatch, or by legacy single-dispatch mode) → proceed to review. For a **legacy single-dispatch behavioral** unit (no RED split), apply the evidence-shape RED check on `RED_PHASE_OUTPUT` before review (re-running post-implementation would pass, so the reported pre-impl failing output is the available signal; reject if missing/structural).
- **BLOCKED** → dispatch debug subagent (see section below); do NOT immediately skip
- **NEEDS_CONTEXT** → re-dispatch once with the requested additional context; if still unresolved → dispatch debug subagent

**c) Review the task**:
- If review mode is `required`:
  - Read `templates/reviewer-prompt.md` from this skill's directory
  - Construct a review prompt with:
    - The task description and relevant spec section numbers
    - Paths to spec files (requirements.md, the design file(s) from Step 0, `{spec_dir}/decisions.md`, and `{spec_dir}/learnings.md`) so the reviewer can read them directly — a finding must not contradict a settled decision or re-raise a logged learning
    - The implementer's status report (for reference only — reviewer must verify independently)
    - An explicit instruction to verify **convention & contract adherence**, not just spec-section correctness: the diff must honor core steering (`.kiro/steering/` — tech/structure/product conventions) and the design's Architecture & Boundary Map, interface contracts, error-handling, and naming. This catches drift introduced by the cheaper implementer model.
  - The reviewer must apply the `kiro-review` protocol to this task-local review.
  - Preserve the existing task-specific context: task text, spec refs, `_Boundary:_` scope, validation commands, implementer report, and the actual `git diff` as the primary source of truth.
  - The reviewer subagent will run `git diff` itself to read the actual code changes and verify against the spec
  - **When `commit_policy == "leave-uncommitted"`, add a `DIFF_SCOPE:` line to the dispatch** listing this unit's files (`UNIT_FILES`), which is the field `reviewer-prompt.md` looks for. Without it the reviewer runs a bare `git diff`, sees every earlier unit still sitting uncommitted, and fails Mechanical Check 4 (Boundary Respect) on files this unit never touched — a false REJECTED that costs re-dispatch and debug rounds
  - Dispatch via **Agent tool** as a fresh subagent
- If review mode is `inline`:
  - Apply `kiro-review` in the parent context using the same task evidence and the actual `git diff` (scoped to this unit's files under `commit_policy: "leave-uncommitted"`)
- If review mode is `off`:
  - Skip task-local review
  - Record in the parent context that task-local review was skipped for this task

**d) Handle reviewer verdict**:
- If review mode is `off`:
  - Do not fabricate a reviewer verdict
  - Before marking the task `[x]` or making any success claim, apply `kiro-verify-completion` using fresh evidence from the current code state; then transition the task's marker from `- [-]` to `- [x]` in tasks.md and perform selective git commit
- Otherwise:
  - Parse reviewer verdict only from the exact `## Review Verdict` block and `- VERDICT:` field.
  - If `VERDICT` is missing, ambiguous, or replaced with prose, re-dispatch the reviewer once requesting the exact structured verdict only. Do NOT mark the task complete, commit, or continue to the next task without a parseable `APPROVED | REJECTED` value.
  - **APPROVED** → before marking the task `[x]` or making any success claim, apply `kiro-verify-completion` using fresh evidence from the current code state; then transition the task's marker from `- [-]` to `- [x]` in tasks.md and perform selective git commit
  - **REJECTED (round 1-2)** → re-dispatch implementer with review feedback
  - **REJECTED (round 3)** → dispatch debug subagent (see section below)

**Marking complete**: when `kiro-verify-completion` passes for the unit, transition its marker(s) to `- [x]`. In milestone mode this means flipping **every sub-step AND the major-task checkbox** of the milestone to `- [x]` in one edit; in legacy mode just the single sub-task. (The two APPROVED/off paths above say "transition the marker from `- [-]` to `- [x]`" — interpret "the marker" as the whole milestone's checkboxes in milestone mode.)

**d.5) Wave integration gate** (multi-unit `(P)` waves ONLY — skip for single-unit waves):
- Parallel units run concurrently, so **no implementer saw the others' changes** — each scoped GREEN gate validated only its own unit's view of the tree. Disjoint `_Boundary:_` prevents *file* collisions, but two units can still share a logical contract (a DTO, an interface, a constant) that only breaks when their changes coexist.
- Before committing any unit in the wave, run the **union of the wave's units' scoped verify commands** (+ a build/smoke when fast enough) **once over the combined working tree** with all units' changes present. Prefer the union of scoped targets over the full suite — the full suite runs at Step 3.5. Use the full suite here only if the wave's boundaries are broad enough that the union is not meaningfully cheaper.
- **Combined suite passes** → proceed to commit each unit (step e). Subtract any `BASELINE_FAILURES` from the preflight — only *new* failures count.
- **Combined suite fails** on an integration seam (a failure neither unit's own GREEN gate hit) → do NOT commit the wave. Re-run the affected units **sequentially** (so each sees the other's changes — committed under `per-task`, in the working tree under `leave-uncommitted`), routing through the debug subagent if needed; if a unit cannot integrate, `_Blocked:_` it with the seam description. Never commit a wave whose combined state is red.
- Single-unit waves have no sibling to integrate with, so skip this gate for them — their cross-unit integration is covered by the run-closing full gate in Step 3.5. (Do **not** justify the skip with "they already validated the full tree": with scoped gates, no milestone validates the full tree.)

**e) Commit** (parent-only, selective staging) — **only when `commit_policy == "per-task"`**:
- Stage only the files actually changed for this unit, plus tasks.md. In milestone mode this is **one commit for the whole milestone** (all files its steps touched), not one per sub-step.
- **NEVER** use `git add -A` or `git add .`
- Use `git add <file1> <file2> ...` with explicit file paths
- Commit message format: `feat(<feature-name>): <milestone or task description>`

**e-alt) Leave uncommitted** — when `commit_policy == "leave-uncommitted"`, replace step (e) with this:
- Make **no commit and no staging** for this unit. The unit's files and the tasks.md marker flip stay in the working tree exactly as written.
- **Record the unit's file list in the parent context** (`UNIT_FILES[<unit id>]`). With no commit boundary, `git diff` no longer isolates one unit — this list is the only thing that does, and steps (c) review and (g) debug both need it (see the scoping rule below).
- Report the unit as `implemented, uncommitted` rather than with a commit hash.
- **Everything else is unchanged**: the GREEN gate, review, `kiro-verify-completion`, and the `- [x]` flip all still gate the unit. Not committing changes *where the work is stored*, never *whether it was verified*.

**Diff scoping when `commit_policy == "leave-uncommitted"`** (applies to step (c) review and step (g) debug):
- With per-task commits, `git diff` shows exactly the current unit. Without them, it shows every unit so far — so a reviewer for unit 3 would be handed units 1–2 as if they were its work, and a debugger would be handed unrelated changes as suspects.
- So scope every diff you generate for a unit to that unit's files: `git diff -- <UNIT_FILES for this unit>`. Never hand a reviewer or debugger the unscoped `git diff` in this mode.
- The **wave integration gate (d.5)** and the **run-closing full gate (Step 3.5)** are the deliberate exceptions — they intentionally run over the whole combined tree.
- Also note in each reviewer/debugger dispatch that the repo has uncommitted work from earlier units, so an unfamiliar-but-unrelated edit outside the unit's boundary is not a finding.

**f) Record learnings**:
This step is mandatory to CHECK at the end of every unit — decide yes/no explicitly; do not silently skip it.
- **Also record AUTONOMOUS corrections, not just human ones**: if a unit needed a reviewer REJECTION cycle or a debug RETRY that changed the approach/scope/technical choice (a directional change), dispatch the learning recorder for it — the trigger is "did the approach change," regardless of whether a human or the review/debug loop drove it.
- If this task revealed cross-cutting insights, append a one-line note to the `## Implementation Notes` section at the bottom of tasks.md
- **Record only directional corrections — NOT cosmetic fixes.** A correction worth recording changes the approach, scope, architecture, or technical choice. Wording tweaks, typo fixes, formatting requests, and minor clarifications are NOT worth recording.

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

- **If the human corrected the implementation approach and the correction meets the directional threshold** (rejected task output, overrode the implementer/reviewer approach, or provided directional feedback that changed the implementation):
  - Record this **synchronously now** (use Write/Edit directly — do NOT dispatch a background subagent; a fire-and-forget call can be dropped when the turn ends and silently lose the record):
    - Steps (do these yourself, do not delegate): "Record a LEARNING for phase 'implementation' in spec dir '{spec_dir}'. AI implemented: [brief summary]. Human corrected: [what was changed]. Read {spec_dir}/learnings.md (create if missing) and append. If generalizable, follow `rules/learning-promotion.md`: dedupe against .kiro/learnings/*.md, update .kiro/learnings/patterns.md append-only, include `Source spec` pointing back to this learning entry, and run `validate-patterns-append-only.py`."
  - Finish the append before continuing to the next task.
- **If the human chose between architecturally or technically distinct implementation approaches** (not stylistic or naming preferences — e.g., selected between remediation strategies):
  - Record synchronously now (use Write/Edit directly, not a background subagent): "Record a DECISION for phase 'implementation' in spec dir '{spec_dir}'. Alternatives: [list]. Chosen: [which and why]. Read {spec_dir}/decisions.md (create if missing) and append."
- **If the human corrected code SHAPE/CONVENTION — not a mistake, not a scope choice, but "this is how we always write X" — record a STYLE entry.** This is the bucket that catches naming, control-flow shape, method length/breakage, controller/service layering, component nesting-vs-flatness, and similar broad-stroke conventions the DECISION bullet above explicitly excludes.
  - **Broad-stroke test** (apply before recording): would this same correction plausibly recur on **3+ unrelated files** if it weren't written down? If yes → record. If it's file-specific or purely cosmetic with no repeat risk → skip (do NOT record every nitpick).

    Examples to record:
    - "Controllers should never branch on business state — delegate to the service and map the result"
    - "Switch on an enum, never a chain of if/else on the same field"
    - "Keep components flat here — no more than 2 levels of nesting before a named subcomponent"
    - "Methods over ~25 lines get split — extract the validation block into its own method"

    Examples to skip (do NOT record — these belong in LEARNING, DECISION, or nowhere):
    - A one-off variable rename with no reusable pattern
    - "Use SSE instead of WebSockets" (that's a DECISION — architecturally distinct choice)
    - A correction that only applies to this exact file's local quirk

  - Record this **synchronously now** (use Write/Edit directly — do NOT dispatch a background subagent):
    - Steps (do these yourself, do not delegate): "Record a STYLE entry in `.kiro/learnings/style-guide.md` (create from `templates/specs/style-guide.md` in this skill's directory — repo override: `.kiro/settings/templates/specs/style-guide.md` — if missing). **Dedup check**: scan existing entries for one covering the same convention — if found, append a new Example under it (cap 3 examples, replace oldest at capacity) rather than creating a duplicate rule. Otherwise append a new entry with the mandatory fields: `## <Title> (backend|frontend|global)`, `**Rule:**` (one line), `**Example:**` (a fenced ❌ bad / ✅ good code block — never skip the example), `**Why:**` (rationale), `**Source:**` (this spec, phase 'implementation', today's date)."
  - Finish the append before continuing to the next task.

**g) Debug subagent** (triggered by BLOCKED, NEEDS_CONTEXT unresolved, or REJECTED after 2 remediation rounds):

The debug subagent runs in a **fresh context** — it receives only the error information, not the failed implementation history. This avoids the context pollution that causes infinite retry loops.

- Read `templates/debugger-prompt.md` from this skill's directory
- Construct a debug prompt with:
  - The error description / blocker reason / reviewer rejection findings
  - `git diff` of the current uncommitted changes — scoped to this unit's files (`git diff -- <UNIT_FILES>`) when `commit_policy == "leave-uncommitted"`, since earlier units are still uncommitted and would otherwise show up as suspects
  - The task description and relevant spec section numbers
  - Paths to spec files so the debugger can read them
- The debugger must apply the `kiro-debug` protocol to this failure investigation.
- Preserve rich failure context: error output, reviewer findings, current `git diff`, task/spec refs, and any relevant Implementation Notes.
- When available, the debugger should inspect runtime/config state and use web or official documentation research to validate root-cause hypotheses before proposing a fix plan.
- Dispatch via **Agent tool** as a fresh subagent

**Handle debug report**:
- Whenever a task ends BLOCKED (any path below that appends `_Blocked:_`), reset its checkbox from `- [-]` back to `- [ ]` before/with appending the `_Blocked:_` annotation, so a blocked task is never later mistaken for an interrupted in-progress task.
- Parse `NEXT_ACTION` from the debug report's exact structured field.
- If `NEXT_ACTION: STOP_FOR_HUMAN` → append `_Blocked: <ROOT_CAUSE>_` to tasks.md, stop the feature run, and report that human review is required before continuing
- If `NEXT_ACTION: BLOCK_TASK` → append `_Blocked: <ROOT_CAUSE>_` to tasks.md, skip to next task
- If `NEXT_ACTION: RETRY_TASK` → preserve the current worktree; do NOT reset or discard unrelated changes. Spawn a **new** implementer subagent (per `impl_model`: `kiro-implementer`/Sonnet by default, or inherited-model when `impl_model = opus`) with the debug report's `FIX_PLAN`, `NOTES`, and the current `git diff`, and require it to repair the task with explicit edits only (the debugger itself ran on the session model)
  - If the new implementer succeeds (READY_FOR_REVIEW → reviewer APPROVED) → normal flow
  - If the new implementer also fails → repeat debug cycle (max 2 debug rounds total). After 2 failed debug rounds → append `_Blocked: debug attempted twice, still failing — <ROOT_CAUSE>_` to tasks.md, skip
- **Max 2 debug rounds per task**. Each round: fresh debug subagent → fresh implementer. If still failing after 2 rounds, the task is blocked.
- Record debug findings in `## Implementation Notes` (this helps subsequent tasks avoid the same issue)

**`(P)` markers**: Tasks marked `(P)` in tasks.md indicate they have no inter-dependencies and are candidates for parallel execution. The wave-builder in Step 2 actively merges adjacent `(P)` tasks into a single wave when their `_Boundary:_` identifiers are pairwise disjoint, and the dispatcher in Step 3(a) emits parallel Agent calls in a single message for the wave. Overlap on any boundary identifier (shared file, class, module, yaml key) forces a split into separate waves. Non-`(P)` tasks always form single-task waves.

**Completion check**: If all remaining tasks are BLOCKED, stop and report blocked tasks with reasons to the user.

#### Manual Mode (main context)

**Selection in milestone mode**: a bare major number (e.g. `1`) selects the whole milestone — run its full cycle (write all milestone tests RED → implement steps → one **scoped** GREEN gate) in the main context, then one review, one verify, flip all its checkboxes, one commit, and the Step 3.5 run-closing full gate at the end of the run. A sub-step number (e.g. `1.2`) runs just that step for a targeted fix (no milestone gate; Step 3.5 still applies unless the skip condition there is met). In legacy mode, selection is per sub-task as before.

For each selected unit:

**0. Mark in-progress**: flip the unit's checkbox from `- [ ]` (or stale `- [-]`) to `- [-]` in tasks.md before starting (the major-task checkbox for a milestone), so an interrupted run is resumable. The marker advances to `- [x]` only at MARK COMPLETE below.

**1. Build Task Brief**:
Before writing any code, read the relevant sections of requirements.md and the applicable design file(s) from Step 0 for this task and clarify:
- What observable behaviors must be true when done (acceptance criteria)
- What files/functions/tests must exist (completion definition)
- What technical decisions to follow from the design (design constraints)
- How to confirm the task works (verification method)

**2. Execute TDD cycle** (Kent Beck's RED → GREEN → REFACTOR):
- *Milestone selection*: write ALL of the milestone's tests first (RED), implement its steps, then run the milestone's **scoped** GREEN gate (its tests + its boundary's test targets + affected-module build, plus smoke only if boot/wiring changed) — no full build per step and no full build at the milestone gate; the full build + suite + smoke runs once in Step 3.5. *Sub-step selection / legacy*: the per-piece loop below.
- **RED**: Write test for the next small piece of functionality based on the acceptance criteria. Test should fail. Apply `rules/test-value-guidance.md`: test behavior, contracts, and risk; do not test enum existence, constants, generated DTO accessors, generated code, or annotation-only wiring. Where a PBT library is available in the repo, also derive **property-based invariants** from the EARS acceptance criteria (e.g. "for all valid inputs, the result round-trips / stays within bounds / preserves the invariant") and write property tests alongside the example tests; otherwise cover boundary and edge cases explicitly. Do not add a new PBT dependency.
- **GREEN**: Implement simplest solution to make test pass, following the design constraints.
- **REFACTOR**: Improve code structure, remove duplication. All tests must still pass.
- **VERIFY**: All tests pass (new and existing), no regressions. Confirm verification method passes.
- **REVIEW**:
  - `required`: Apply `kiro-review` before marking the task complete. If the host supports fresh subagents in manual mode, use a fresh reviewer; otherwise perform the review in the main context using the `kiro-review` protocol. Do NOT continue until the verdict is parseably `APPROVED`.
  - `inline`: Apply `kiro-review` in the main context before marking the task complete.
  - `off`: Skip task-local review, but note that `kiro-validate-impl` becomes the primary quality gate before any feature-level completion claim.
- **MARK COMPLETE**:
  - `required|inline`: Only after review returns `APPROVED`, apply `kiro-verify-completion`, then update the checkbox from `- [-]` to `- [x]` in tasks.md.
  - `off`: Apply `kiro-verify-completion`, then update the checkbox from `- [-]` to `- [x]` in tasks.md.

### Step 3.5: Run-closing full gate (MANDATORY, once, after the last unit of this run)

Every milestone gate in Step 3 was **scoped**, so no run has yet proven the whole tree. This step is
where that happens — once, at the end, instead of once per milestone.

**When to run it**: after the last unit of this run finishes (autonomous or manual, committed or left
uncommitted), before the Step 4 report. Run it even when only one unit was selected.

**Skip it ONLY when** every unit in this run was non-behavioral *and* trivial (single-file
config/copy/DTO edits) *and* their scoped gates all passed — then say in the report that the full gate
was skipped and why, and that `/kiro:validate-impl` remains the standing gate. When in doubt, run it.

**What it runs**: the discovered `BUILD_COMMANDS` + `TEST_COMMANDS` (full) + `SMOKE_COMMANDS`, once,
over the cumulative tree. On Gradle: no `clean`, and `--offline` is fine after the session's first
resolve.

**Classify a failure before debugging it** (this matters because the Step 1 baseline was scoped, so
this gate can surface failures the baseline never observed — do not burn debug rounds on someone
else's breakage):
- The failing test's subject **is** in some unit's `_Boundary:_`, or touches a file this run changed
  (`git diff --name-only` against the run's start point) → **this run's regression**. Repair it:
  bounded to 2 rounds, routing through the debug subagent as in step (g).
- The failing test is in `BASELINE_FAILURES` → **pre-existing**. Report it, do not repair it.
- The failing test is outside every boundary, untouched by this run's diff, and was never in the
  scoped baseline → **presumed pre-existing** (the scoped baseline simply never ran it). Confirm
  cheaply where possible — `git stash` is NOT required; checking that no changed file is in the test's
  dependency path is enough — then report it as pre-existing/upstream, do not repair it. Do NOT let
  this class of failure block the run's completion, and do NOT dispatch debug for it.
- Genuinely ambiguous → report it as ambiguous with both readings. Do not silently absorb it and do
  not claim the run is green.

**Outcome**:
- **Green** (no new failures) → proceed to Step 4. Report it as the run-closing full gate result.
- **New failures repaired within 2 rounds** → proceed, and name what was repaired.
- **New failures unrepaired after 2 rounds** → do NOT claim the run succeeded. Units already
  committed stay committed (fix-forward — do not revert or reset); report the failing set, mark the
  affected units' follow-up in `## Implementation Notes`, and state that `/kiro:validate-impl` will
  fail until it is fixed.

**Never** mark this gate as passed from a subagent's report or from an earlier scoped gate — the
parent runs it, `kiro-verify-completion`'s fresh-evidence rule applies.

### Step 3.9: Multi-repo satellite links (automatic — only if a task touched another repo)

If any file edited during this run resolves to a **different git repo root** than the session repo
(`git -C <dir> rev-parse --show-toplevel` differs; skip paths under `node_modules/`, `vendor/`,
`dist/`, `build/`, `.git/`), that repo received a cross-repo change. Handle it **strictly** per
`rules/multi-repo-linkage.md` (do not improvise):
- **Gate on weight (BLOCKING).** Create a satellite link ONLY for a repo declared in this spec's
  `spec.json.affected_repos` with `weight: "light"`. If the edited repo is **undeclared** or
  `weight: "heavy"`, do **NOT** write a satellite (it would overwrite/disable that repo's real spec):
  **STOP and emit the escalation** — "`<repo>` received changes but is not a declared light satellite;
  it likely needs its own spec (a Split peer). Run `/kiro:discovery` + `/kiro:spec-init` there and pin
  the shared contract." Peers are NEVER auto-created.
- **Collision guard (BLOCKING).** Refuse if the mirrored dir already holds a non-satellite spec
  (present `spec.json` that is not `kind: linked-spec` / `role: satellite`) — warn, do not overwrite.
- **Branch parity** (safe rule — fetch + verified `origin/<default>` base; switch only if the child is
  clean and on its default branch, else warn + `parity: mismatch`), then create/refresh the
  **satellite `spec-link.md`** (+ minimal `spec.json`, `role: satellite`, `phase: linked`) at the
  mirrored `.kiro/specs/<category>/<dated-slug>/` path, attributed to THIS spec. Seed the
  checklist from **the files THIS run touched in that repo** — NOT the child's full `git status`.

This is the ONLY sanctioned cross-repo write — a pointer, never code or a full spec; idempotent
(refresh `updated_at` only on real change; preserve hand-written "why"). Do NOT fabricate links for
`affected_repos` entries that received no edits this run. **Surface the outcome:** report each link
created/updated, each escalation, and any branch-parity mismatch. If a link write **fails**, say so
explicitly and do NOT report the run as fully complete — parent code may be committed while a required
linkage is missing; flag it as a **partial result** for the developer to finish.

### Step 4: Final Validation

**Autonomous mode** — required `/kiro:validate-impl` gate:

Auto-run `/kiro:validate-impl {feature}` ONLY when at least one of these holds:
- Review mode is `off`
- The run-closing full gate (Step 3.5) was skipped, ended with unrepaired new failures, or reported a
  failure classified as ambiguous
- The final task did not run a full validation suite (e.g., last task was Fast Path or `_Blocked:_`)
- Any task during this run was `_Blocked:_` or appended cross-task entries to `## Implementation Notes`
- The reconciliation pass (Step 2) marked any task `- [x]` as pre-existing (`_Synced:_`)
- `force_validate = true` (user passed `--validate` in the invocation)

When the reconciliation pass marked any task `_Synced:_`, forward `--regression` to the validate-impl run (`/kiro:validate-impl {feature} --regression`) so the shared-component regression check covers callers of the pre-existing code that this run did not author.

Otherwise do not auto-run it, but do **not** treat the feature workflow as complete. Report: `"required next gate: /kiro:validate-impl {feature} — the run-closing full gate was GREEN at <commit>, but validate-impl is still the feature-level integration + spec-drift gate before merge / success claim."` (under `commit_policy: "leave-uncommitted"` there is no commit to name — write `on the working tree` instead of `at <commit>`.)

Regardless of whether `/kiro:validate-impl` runs, `kiro-verify-completion` is still applied to the feature-level claim before reporting feature success.

When `/kiro:validate-impl` runs:
- If validation returns GO → before reporting feature success, apply `kiro-verify-completion` to the feature-level claim using the validation result and fresh supporting evidence, then print `Next gate: /kiro:retrospective {feature}` as required workflow close
- If validation returns NO-GO:
  - Fix only concrete findings from the validation report
  - Cap remediation at 3 rounds; if still NO-GO, stop and report remaining findings
- If validation returns MANUAL_VERIFY_REQUIRED → stop and report the missing verification step

**Manual mode**:
- Print `/kiro:validate-impl {feature}` as the required next gate, but do not auto-execute
- If review mode is `off`, treat `/kiro:validate-impl {feature}` as mandatory before any feature-level success claim

## Feature Flag Protocol

For tasks that add or change behavior, enforce RED → GREEN with a feature flag:

1. **Add flag** (OFF by default): Introduce a toggle appropriate to the codebase (env var, config constant, boolean, conditional -- agent chooses the mechanism)
2. **RED -- flag OFF**: Write tests for the new behavior. Run tests → must FAIL. The failure MUST be an **assertion/behavioral** failure matching the expected behavior — NOT a compilation, syntax, import, or test-collection error. A structural failure means the test is broken, not validly RED: fix the test setup and re-run until it fails on the assertion before moving to GREEN. If tests pass with flag OFF, the tests are not testing the right thing. Rewrite.
3. **GREEN -- flag ON + implement**: Enable the flag, write implementation. Run tests → must PASS.
4. **Remove flag**: Make the code unconditional. Run tests → must still PASS.

**Skip this protocol** when the unit is new code with no pre-existing behavior to contradict, or every step is a config/property value, dependency bump, DTO field with no logic, annotation-only wiring, scaffolding, copy/docs, or a test-only move — a flag plus a RED on code that does not exist yet produces a compile error, not evidence. **Run it** when the unit changes the behavior of an existing code path AND a wrong result is expensive (moves money, decides access, mutates or migrates stored data, changes a published contract's shape/status codes, or depends on ordering/concurrency) — and always for a bugfix regression test, whose failure IS the reproduction. Do not stretch "business logic" to mean everything; ask whether the code path already exists.

Note the GREEN step here verifies with the milestone's **scoped** commands, not a full build; the full build + full suite + smoke is the run-closing gate in Step 3.5.

## Critical Constraints
- **Strict Handoff Parsing**: Never infer implementer `STATUS` or reviewer `VERDICT` from surrounding prose; only the exact structured fields count
- **No Destructive Reset**: Never use `git checkout .`, `git reset --hard`, or similar destructive rollback inside the implementation loop
- **Selective Staging**: NEVER use `git add -A` or `git add .`; always stage explicit file paths
- **Honor the commit policy**: commit per unit only when the resolved `commit_policy` is `per-task`. Under `leave-uncommitted`, make no commit and no `git add` at all — and never "helpfully" commit at the end of the run because the tree looks messy
- **Bounded Review Rounds**: Max 2 implementer re-dispatch rounds per reviewer rejection, then debug
- **Bounded Debug**: Max 2 debug rounds per task (debug + re-implementation per round); if still failing → BLOCKED
- **Bounded Remediation**: Cap final-validation remediation at 3 rounds

## Output Description

**Autonomous mode**: For each unit (milestone in milestone mode, sub-task in legacy), report:
1. Unit ID, implementer status, reviewer verdict
2. Files changed, and the commit hash (one commit per milestone) — under `commit_policy: "leave-uncommitted"`, print `uncommitted` in place of the hash
3. After all units: final validation result when auto-run, or the required next gate `/kiro:validate-impl {feature}`

**Manual mode**:
1. Units executed: milestone/task numbers and test results
2. Status: completed units marked in tasks.md, remaining count

**Under `commit_policy: "leave-uncommitted"`, close the run with the handoff** — the developer now owns the commit, so give them what they need for it: the total file count, the `git status --porcelain` line count, and a reminder that `/kiro:validate-impl {feature}` still runs against the working tree. Do not print a commit command for them to paste; the point of this mode is that they write their own.

Always include the lifecycle closeout:

```text
Next gate: /kiro:validate-impl {feature}
   Required before merge / success claim.
After GO: /kiro:retrospective {feature}
   Required to close the workflow while session evidence is fresh.
```

**Format**: Concise, in the language specified in spec.json.

## Safety & Fallback

### Error Scenarios

**Tasks Not Approved or Missing Spec Files**:
- **Stop Execution**: All spec files must exist and tasks must be approved
- **Suggested Action**: "Complete previous phases: `/kiro:spec-requirements`, `/kiro:spec-design`, `/kiro:spec-tasks`"

**Test Failures**:
- **Stop Implementation**: Fix failing tests before continuing
- **Action**: Debug and fix, then re-run

**All Tasks Blocked**:
- Stop and report all blocked tasks with reasons
- Human review needed to resolve blockers

**Spec Conflicts with Reality**:
- If a requirement or design conflicts with reality (API doesn't exist, platform limitation), block the task with `_Blocked: <reason>_` -- do not silently work around it

**Upstream Ownership Detected**:
- If review, debug, or validation shows that the root cause belongs to an upstream, foundation, shared-platform, or dependency spec, do not patch around it inside the downstream feature
- Route the fix back to the owning upstream spec, keep the downstream task blocked until that contract is repaired, and re-run validation/smoke for dependent specs after the upstream fix lands

**Task Plan Invalidated During Implementation**:
- If debug returns `NEXT_ACTION: STOP_FOR_HUMAN` because of task ordering, boundary, or decomposition problems, stop and return for human review of `tasks.md` or the approved plan instead of forcing a code workaround
