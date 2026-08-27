---
name: validate-impl
description: Validate feature-level integration after all tasks are implemented. Checks cross-task consistency, full test suite, and overall spec coverage.
allowed-tools: Read, Write, Bash, Grep, Glob, Agent, AskUserQuestion
argument-hint: <feature-name> [task-numbers] [--regression]
metadata:
  shared-rules: "document-style.md, command-tracking.md, test-value-guidance.md, lifecycle-navigation.md, contract-negotiation.md, gate-cli.md, codebase-grounding.md, code-simplification.md, global-context-loading.md, learning-promotion.md"
  shared-scripts: "kiro-tasks.mjs, common.mjs, record-command-fired.py, validate-patterns-append-only.py"
---

# kiro-validate-impl Skill

## Role
Individual tasks are usually reviewed during implementation. Your job is to catch problems that only become visible when looking across all tasks together.

Boundary terminology continuity:
- discovery identifies `Boundary Candidates`
- design fixes `Boundary Commitments`
- tasks constrain execution with `_Boundary:_`
- feature validation checks for cross-task `Boundary Violations`

## Core Mission
- **Success Criteria**:
  - All tasks marked `[x]` in tasks.md
  - Full test suite passes (not just per-task tests)
  - Cross-task integration works (data flows between components, interfaces match)
  - Requirements coverage is complete across all tasks (no gaps between tasks)
  - Design structure is reflected end-to-end (not just per-component)
  - No orphaned code, conflicting implementations, integration seams, or boundary spillover

## What This Skill Does NOT Do
This skill is not a full replacement for task-local review during `/kiro:impl`. This skill does **not** re-check:
- Individual task acceptance criteria
- Per-file reality checks (mock/stub detection)
- Single-task spec alignment

This skill's main question is: when the completed tasks are viewed together, do they still respect the designed boundary seams and dependency direction?

## Execution Steps

### Step 1: Detect Validation Target

**Spec Path Resolution**: The feature directory may be in one of five locations (check in this order):
1. `.kiro/specs/features/<feature>/spec.json` (categorized feature)
2. `.kiro/specs/bugs/<feature>/spec.json` (categorized bugfix)
3. `.kiro/specs/tech-debt/<feature>/spec.json` (categorized tech debt)
4. `.kiro/specs/chores/<feature>/spec.json` (categorized chore)
5. `.kiro/specs/<feature>/spec.json` (legacy flat structure)

If `spec.json` contains a `spec_path` field, use that as the canonical path. Otherwise, use whichever location exists. All subsequent file reads/writes for this spec use the resolved path. Throughout this skill, `{spec_dir}` denotes that resolved path; project-global paths under `.kiro/steering/`, `.kiro/learnings/`, and `.kiro/settings/` are NOT spec-relative and keep their `.kiro/` form.

**Record command fired**: Read `rules/command-tracking.md`, then run
`python3 "${CLAUDE_SKILL_DIR}/scripts/record-command-fired.py" "{spec_dir}" "kiro-validate-impl" "validate-impl"` (or `python`).



**If no arguments provided**:
- Parse conversation history for `/kiro:impl` commands to detect recently implemented features and tasks
- Scan `.kiro/specs/` for features with completed tasks `[x]`
- Report detected implementations (e.g., "user-auth: 1.1, 1.2, 1.3")

**If feature provided** (feature specified, tasks empty):
- Use specified feature
- Detect all completed tasks `[x]` in `{spec_dir}/tasks.md`

**If both feature and tasks provided** (explicit mode):
- Validate specified feature and tasks only (e.g., `user-auth 1.1,1.2`)

**Completeness gate (deterministic, whole-feature mode only — skip in explicit task-subset mode)**: before running the cross-task checks, run the gate CLI `kiro-tasks.mjs status <feature> --assert-all-done` (see `rules/gate-cli.md`). Exit 0 ⇒ every task is `[x]` and no marker is malformed. A non-zero exit means the feature is not fully implemented (the JSON shows remaining pending/in-progress counts; stderr lists any malformed checkbox lines) — do not report `GO`; report the incomplete/malformed tasks instead. If the CLI is not present, fall back to scanning the checkboxes by hand. This replaces eyeballing "are all tasks `[x]`" with a deterministic verdict.

**Flags**:
- `--regression`: force the shared-component regression check (check `I`) to run **mandatorily**, regardless of the auto-trigger heuristic. When set, the check is not skipped even if no shared/common code change is auto-detected; if no shared surface was actually touched, the check still runs and reports `N/A (no shared surface changed)`. Without this flag, check `I` runs only when its trigger condition fires.

### Step 2: Gather Context

Skip re-reading a file only if its content is already present in this conversation; if you cannot point to where it was loaded, read it now. Never assume steering or spec files are already loaded.
Otherwise, for each detected feature:
- Read `.kiro/specs/<feature>/spec.json` for metadata (including `spec_type`, `workflow`, `artifacts`)
- Read `.kiro/specs/<feature>/requirements.md` for requirements
- **Design file loading based on lifecycle config**:
  - If `artifacts.design_hld` is enabled: read `.kiro/specs/<feature>/design-hld.md`
  - If `artifacts.design_lld` is enabled: read `.kiro/specs/<feature>/design-lld.md`
  - If neither HLD/LLD fields exist in artifacts (legacy spec): read `.kiro/specs/<feature>/design.md`
  - For bugfix specs (`spec_type: "bugfix"`): skip design files **only when design artifacts are disabled** (the default). If `artifacts.design_hld` is `true` (a complex bugfix that ran the HLD), load `design-hld.md` and run the design-alignment + boundary audit against it like any other spec
- Read `.kiro/specs/<feature>/tasks.md` for task list and Implementation Notes
- Read `rules/document-style.md` from this skill's directory for plain writing style
- Read `rules/test-value-guidance.md` from this skill's directory before judging test gaps

**Steering + cross-spec learnings + spec-scoped decisions/learnings**: follow
`${CLAUDE_SKILL_DIR}/rules/global-context-loading.md` in full — glob-all steering and cross-spec
learnings, read spec-scoped `decisions.md`/`learnings.md` if present (decisions may affect validation
criteria; learnings inform what to watch for), apply what was loaded, print the context manifest.

**Discover canonical validation commands**:
- Inspect repository-local sources of truth in this order: project scripts/manifests (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, app manifests), task runners (`Makefile`, `justfile`), CI/workflow files, existing e2e/integration configs, then `README*`
- Derive a feature-level validation set for this repo: `TEST_COMMANDS`, `BUILD_COMMANDS`, and `SMOKE_COMMANDS`
- Prefer commands already used by repo automation over ad hoc shell pipelines
- For `SMOKE_COMMANDS`, choose the lightest trustworthy runtime-liveness check for the app shape (for example: root URL load, Electron launch, CLI `--help`, service health endpoint, mobile simulator/e2e harness if one already exists)
- If multiple candidates exist, prefer the command with the smallest setup cost that still exercises the real built artifact

### Step 3: Execute Integration Validation

#### Subagent Dispatch (parallel)

The following validation dimensions are independent and can be dispatched as **subagents** via the Agent tool. The agent should decide the optimal decomposition based on feature scope -- split, merge, or skip subagents as appropriate. Each subagent returns a **structured findings summary** to keep the main context clean for GO/NO-GO synthesis.

**Typical validation dimensions** (adjust as appropriate):
- **Test execution**: Run the complete test suite, report pass/fail with details
- **Requirements coverage**: Build requirements -> implementation matrix, report gaps
- **Design alignment**: Verify architecture matches design documents (HLD and/or LLD as applicable), report drift and dependency violations
- **Cross-task integration**: Verify data flows, API contracts, shared state consistency
- **Shared component regression** (conditional): If this feature modified or replaced a shared/common widget, utility, component, or function that has callers outside the feature boundary, dispatch the `regression-verifier` agent (Agent tool, `subagent_type: kiro:regression-verifier` when bundled with the kiro plugin — agents are namespaced under the `kiro` plugin — or bare `subagent_type: regression-verifier` when installed as a user-level agent under the npx distribution; try the `kiro:` form first) to diff old vs new behaviour across every caller site. See check `I` for trigger conditions and how to consume its report. Skip when no shared code was touched.

For simple features (few tasks, small scope), run checks in main context without subagent dispatch.

If the implementation run explicitly skipped task-local review (for example `--review off`), tighten scrutiny on obvious task-level gaps that surface during integration validation and call out that reduced review coverage in the report.

#### Mechanical Checks (run commands, use results)

These checks apply at the feature level. Use command output as the primary signal.

**A. Full Test Suite**
- Run the discovered canonical full-test command. Use the exit code.
- If tests fail -> NO-GO. No judgment needed.
- If the canonical test command cannot be identified -> `MANUAL_VERIFY_REQUIRED`
- **Classify a failure before continuing.** If the failure signature is environmental (auth/token
  expiry, network/DNS, artifact-repository 401/403, missing credential) rather than an assertion
  failure, stop immediately and report `MANUAL_VERIFY_REQUIRED (environment)` with the exact
  remediation command (e.g. `aws sso login`) **before** running the remaining mechanical/judgment
  checks — do not complete a full audit and bury an environment blocker at the end of the report.
  Only proceed to the rest of Step 3 when the failure is a genuine assertion/test failure or the
  suite ran clean.

**B. Residual TBD/TODO/FIXME**
- Run: `grep -rn "TBD\|TODO\|FIXME\|HACK\|XXX" <files-in-feature-boundary>`
- If matches found that were introduced by this feature -> flag as Warning

**C. Residual Hardcoded Secrets**
- Run: `grep -rn "password\s*=\|api_key\s*=\|secret\s*=\|token\s*=" <files-in-feature-boundary>` (case-insensitive)
- If matches found that aren't environment variable references -> flag as Critical

**D. Runtime Liveness (Smoke Boot)**
- Run the discovered canonical smoke command that proves the built artifact actually starts and reaches its first usable state.
- Examples if relevant: open the root URL in a headless browser and require zero boot-time console errors; launch Electron and wait for the main process ready signal and first renderer load; run a CLI with `--help`; start a service and hit its health endpoint.
- If boot produces a runtime crash, unhandled exception, module-load failure, native ABI mismatch, or missing required env/config -> NO-GO.
- If no trustworthy smoke command can be identified, or the required runtime environment is unavailable -> `MANUAL_VERIFY_REQUIRED`

#### Judgment Checks (read code, compare to spec)

**E. Cross-Task Integration**
- Identify where tasks share interfaces, data models, or API contracts
- Verify that Task A's output format matches Task B's expected input
- Check for conflicting assumptions between tasks (naming conventions, error codes, data shapes)
- Verify shared state (database schemas, config, environment) is consistent across tasks
- Verify integration work happens at the intended seams rather than by leaking one boundary's behavior into another

**E.5 Cross-Unit Duplication & Consolidation**
- Each task/milestone was implemented in its own dispatch, so no implementer saw the others' code — logic duplicated across separate units is invisible until now. This whole-feature view is the only place that duplication can be caught; the implementer's reuse-before-create rule is the front line, this is the safety net.
- Scan the feature's changed files (local-first per `rules/codebase-grounding.md`) for violations of the duplication / reuse anti-patterns in `rules/code-simplification.md` — the same canonical kernel the implementer wrote against — applied across units: the same logic implemented more than once (repeated 5+ line blocks, parallel helper/util/validation/mapping functions doing the same job, copy-pasted constants or type/interface definitions).
- For each cluster, recommend consolidation to a single shared definition at the layer the design assigns; do NOT invent a new shared module when the design already names a home for it.
- Severity: **Warning** (maintainability) by default. Escalate to a GO-blocking finding only when the copies have already **diverged** (different behavior across copies — a latent correctness bug) or when the design explicitly mandates a single source for that logic.
- Report each cluster with the `file:line` of every copy and the proposed single home.

**F. Requirements Coverage Gaps**
- Map every requirement section to at least one completed task
- Identify requirements that no single task fully covers (cross-cutting requirements)
- Identify requirements partially covered by multiple tasks but not fully by any
- Use the original section numbering from `requirements.md`; do NOT invent `REQ-*` aliases
- **Calculate coverage percentage**: (covered requirement sections / total requirement sections) * 100
- **This check measures requirement-to-task mapping only, never test-assertion strength.** A
  requirement section can map to a task, and that task's tests can still pass, while a specific
  error/absence/`finally`-block branch of the implementing code is never exercised by any test. Do
  not let a clean mapping here read as "this was tested" in the report — label it precisely (see
  Step 4's `REQUIREMENTS_MAPPED` field).

**F.5 Test Value Review**
- Apply `rules/test-value-guidance.md` when judging missing or weak tests.
- Do not flag missing tests for enum existence, constant literals, generated DTO getters/setters,
  generated code, or annotation-only framework wiring.
- Do flag missing tests when enums parse/map/fallback/serialize/store DB or API values, constants
  control behavior or external names, DTOs validate or change JSON shape, or Spring wiring has custom
  conditions/security/transaction/error behavior.
- If a test exists only for a low-value target, report it as an `Info` cleanup suggestion, not a
  GO-blocking issue.

**G. Design End-to-End Alignment**
- Verify the overall component graph matches design documents (HLD for architecture, LLD for implementation details)
- Check that integration patterns (event flow, API boundaries, dependency injection) work as designed
- Verify dependency direction follows design's architecture (no upward imports)
- Verify File Structure Plan matches the actual file layout
- Identify any architectural drift from the original design
- Use the original section numbering from design documents
- **Spec-drift scan (design → code existence)**: extract the named identifiers the design commits to — types,
  interfaces, enums, component/widget names, message-type names — from the design file(s) (HLD and/or LLD), and
  `grep` for each in the feature's boundary files. Flag any identifier that **exists in the design but NOT in the
  code** as a `design-code drift` warning (the design describes something the implementation removed or renamed —
  often the symptom of a behavioral change made after the spec was written, without updating the spec). Report the
  drifted identifiers and recommend `/kiro:spec-requirements` + `/kiro:spec-design-lld` to resync. This is a warning,
  not an automatic GO-block, unless it indicates a requirement is no longer met.
- **Track the recommendation, don't just state it.** A resync recommendation that only exists as prose in this
  report tends to stay open indefinitely with no way to tell later. In the report's `REMEDIATION` section, list
  each drift item as its own `[ ] OPEN` line (e.g. `[ ] OPEN — sync SELLER_FUNDED_DISCOUNT into requirements.md
  §3/§4 and design.md`) so a future read of `impl-validation.md` shows exactly what is still unresolved. Do not
  edit `requirements.md`/`design-lld.md` yourself to close a drift item — those are human-approved, gated
  documents; resyncing them is `/kiro:spec-requirements`'s and `/kiro:spec-design-lld`'s job, not this skill's.


**H. Blocked Tasks & Implementation Notes**
- Check for any tasks still marked `_Blocked:_` -- report why and assess impact on feature completeness
- Review `## Implementation Notes` in tasks.md for cross-cutting insights that need attention

**I. Shared Component Regression (conditional unless `--regression`)**
- **Trigger condition**: this feature changed the signature or behaviour of, or replaced, a shared/common widget, utility, component, or function that is called from **outside** the feature boundary (other modules, other repos). Detect by checking whether the feature's changed files include shared/common code and whether `grep` finds caller sites beyond the feature's own files. If nothing shared was touched, skip this check -- **unless `--regression` was passed**, in which case this check is mandatory: run it regardless, and if no shared surface was actually touched, report `N/A (no shared surface changed)` rather than skipping.
- If triggered (or forced via `--regression`), dispatch the `regression-verifier` agent (bundled with the kiro plugin; a user-level agent under the npx distribution) via the Agent tool (`subagent_type: kiro:regression-verifier` under the plugin — agents are namespaced under the `kiro` plugin — falling back to bare `subagent_type: regression-verifier` only on the npx user-level install; try the `kiro:` form first). It expects the invocation: `run regression-verifier. Old: <OldName(s)>. New: <NewName>. Repos: <repo paths>`. Run it **after the change is committed** -- the agent reconstructs the old implementation from `git show HEAD~1:<path>`, so it needs the prior commit in history.
- Consume its regression report: any `HIGH` functional regression -> **NO-GO**; `MEDIUM`/`LOW` or behavioural-only changes -> **Warning** unless intentional and documented in the spec.
- If the `regression-verifier` agent is not installed in this environment, record `regression-verifier unavailable` and fall back to a manual shared-component caller audit. If the callers cannot be verified by hand -> `MANUAL_VERIFY_REQUIRED`.

### Step 4: Generate Report

Before returning `GO`, apply the `kiro-verify-completion` protocol to the feature-level claim. Tests alone are insufficient: include full-suite, runtime liveness, coverage, integration, design-alignment, shared-component regression (when triggered), and blocked-task status in the evidence.

Classify concrete failures by ownership before writing remediation:
- `LOCAL` if the defect belongs to the feature being validated
- `UPSTREAM` if the root cause belongs to a dependency, foundation, shared platform, or earlier spec
- `UNCLEAR` if ownership cannot be established from the available evidence

If ownership is `UPSTREAM`, do not collapse the issue into local remediation for this feature. Name the owning upstream spec and explain which dependent specs should be revalidated after that upstream fix lands.

Provide summary in the language specified in spec.json.
Use plain, simple English from `rules/document-style.md`.

```
## Validation Report
_Validated at: HEAD `<short-sha>` · requirement sections in scope: <list, e.g. 1.1-1.4, 2.1-2.2>_
- DECISION: GO | NO-GO | MANUAL_VERIFY_REQUIRED
- MECHANICAL_RESULTS:
  - Tests: PASS | FAIL (command and exit code)
  - TBD/TODO grep: CLEAN | <count> matches
  - Secrets grep: CLEAN | <count> matches
  - Smoke boot: PASS | FAIL | MANUAL_REQUIRED
- INTEGRATION:
  - Cross-task contracts: <status>
  - Shared state consistency: <status>
  - Cross-unit duplication: <CLEAN | N clusters (consolidation recommended) | diverged copies — see remediation>
  - Boundary audit: <status>
  - Shared component regression: <PASS | regressions found | N/A | unavailable>
- COVERAGE:
  - Requirements mapped: <X/Y sections covered> (<percentage>%)
  - Requirement coverage gaps: <list of uncovered requirement sections — this is requirement-to-task mapping, not test-assertion coverage>
  - Design coverage: <X/Y design sections reflected> (<percentage>%)
- DESIGN:
  - Architecture drift: <findings>
  - Dependency direction: <violations if any>
  - File Structure Plan vs actual: <match/mismatch>
- STEERING_CONFORMANCE: CLEAN | <N violations>
  - <per violation: steering-file · rule · file:line · severity>
- OWNERSHIP: LOCAL | UPSTREAM | UNCLEAR
- UPSTREAM_SPEC: <feature-name | N/A>
- BLOCKED_TASKS: <list and impact assessment>
- REMEDIATION: <if NO-GO: specific, actionable steps to fix each issue. Any spec-drift item from check G is
  listed here as its own `[ ] OPEN` line, not folded into prose.>
```

The `Validated at` line is the artifact's own freshness marker — record the actual `git rev-parse --short HEAD`
and the requirement sections checked. A later reader (human, or a future run of this skill) can then tell a
`GO` apart from a `GO` that predates several since-landed changes, without reconstructing the timeline by
hand. This does not itself force a re-run; it makes staleness detectable rather than silent.

**STEERING_CONFORMANCE** reports violations of loaded steering (Step 2 already mandates loading all of it —
this gives those findings a permanent home instead of an improvised heading). A violation is a Warning
unless the steering rule is security- or error-contract-related, in which case it blocks `GO`.

If NO-GO, REMEDIATION is mandatory -- identify the exact issue and what needs to change. Vague feedback is not acceptable.

### Step 5: Write Validation Report Artifact

Persist the validation report to disk for audit trail and backtracking.

- Use the Write tool to save the full validation report to `{spec_dir}/impl-validation.md`
- Include: the complete validation report (decision, mechanical results, integration assessment, coverage, design conformance, ownership check, remediation if any)
- Overwrite if it already exists (each validation run is a fresh assessment)
- Run `python3 "${CLAUDE_SKILL_DIR}/scripts/record-command-fired.py" "{spec_dir}" --reconcile-only` (or `python`) after the file is written so `spec.json.artifacts.impl_validation` and any missing inferred command entry are repaired deterministically.

### Step 6: Record Learnings

If the validation returned NO-GO or found significant issues:
- Record this **synchronously now** (use Write/Edit directly — do NOT dispatch a background subagent; a fire-and-forget call can be dropped when the turn ends and silently lose the record):
  - Steps (do these yourself, do not delegate): "Record a LEARNING for phase 'impl-validation' in spec dir '{spec_dir}'. Validation issues: [summary]. Remediation: [steps]. Read {spec_dir}/learnings.md (create if missing) and append. If generalizable, follow `rules/learning-promotion.md`: dedupe against .kiro/learnings/*.md, update .kiro/learnings/patterns.md append-only, include `Source spec` pointing back to this learning entry, and run `validate-patterns-append-only.py`."
  - Finish the append before continuing.


## Important Constraints
- **Strict Final Gate**: Return `GO` only when all integration checks passed; return `NO-GO` for concrete failures and `MANUAL_VERIFY_REQUIRED` when mandatory validation could not be completed
- **Boundary integrity over convenience**: Do not return `GO` if the feature only works by smearing responsibilities across boundaries, even when tests pass

## Safety & Fallback

### Error Scenarios
- **No Implementation Found**: If no `[x]` tasks found, report "No implementations detected"
- **Test Command Unknown**: Return `MANUAL_VERIFY_REQUIRED` and explain which validation command is missing; do not return `GO`
- **Missing Spec Files**: Stop with error if spec.json/requirements.md missing. For design files, check artifacts config -- if design is disabled (bugfix or no-design spec), proceed without design alignment checks

### Next Steps Guidance

**If GO Decision**:
- Feature validated end-to-end. Next required gate: `/kiro:retrospective {feature}` in the same session while evidence is fresh.

**If NO-GO Decision**:
- Address issues listed in REMEDIATION
- Re-run `/kiro:impl {feature} [tasks]` for targeted fixes
- Re-validate with `/kiro:validate-impl {feature}`

**If MANUAL_VERIFY_REQUIRED**:
- Do not treat the feature as complete
- Provide the exact missing validation step or environment prerequisite
