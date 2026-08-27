---
name: review
description: Review a task implementation against approved specs, task boundaries, and verification evidence. Use after an implementer finishes a task, after remediation, or before accepting a task as complete.
allowed-tools: Read, Bash, Grep, Glob
argument-hint: <task-id>
metadata:
  shared-rules: "global-context-loading.md"
  shared-templates: "specs/learnings.md"
---

# kiro-review

## Overview

This skill performs task-local adversarial review. It verifies that the implementation is real, complete, bounded, aligned with approved requirements and design, and supported by mechanical verification evidence.

Boundary terminology continuity:
- discovery identifies `Boundary Candidates`
- design fixes `Boundary Commitments`
- tasks constrain execution with `_Boundary:_`
- review rejects concrete `Boundary Violations`

## When to Use

- After an implementer reports `READY_FOR_REVIEW`
- After remediation for a rejected review
- Before marking a task `[x]`
- Before accepting a task into feature-level validation

Do not use this skill to invent missing requirements or silently reinterpret the spec.

## Inputs

Provide:
- Task ID and exact task text from `tasks.md`
- Relevant requirement section numbers
- Relevant design section numbers
- Spec file paths (`requirements.md`, `design.md`, optionally `tasks.md`)
- The implementer's status report
- The task `_Boundary:_` scope constraints
- Validation commands discovered by the controller
- Relevant `## Implementation Notes` entries when applicable

**When dispatched as a subagent** (under `/kiro:impl`), the parent has already inlined ALL steering
verbatim into the dispatch — use it as given, do not re-load.

**When run standalone** (not dispatched by `kiro-impl`), load steering and cross-spec learnings
yourself before reviewing: follow `${CLAUDE_SKILL_DIR}/rules/global-context-loading.md` in full —
glob-all `.kiro/steering/*.md` and `.kiro/learnings/*.md`, read `{spec_dir}/decisions.md`
and `{spec_dir}/learnings.md` if present, print the context manifest. Never treat steering as optional
or "when applicable" — a finding must not contradict a steering rule the reviewer never read.

## Outputs

Return one of:
- `APPROVED`
- `REJECTED`

Also return:
- Mechanical results
- Findings with severity
- Required remediation
- One-sentence summary

Use the language specified in `spec.json`.

## First Action

Run `git diff` to inspect the actual code changes. If the diff is large or ambiguous, read the changed files directly. Do not trust the implementer report as source of truth.

**If the caller gave you a `DIFF_SCOPE:` file list, run `git diff -- <those paths>` instead.** That list appears when the run commits nothing (the spec's `commit_policy` is `leave-uncommitted`), so earlier tasks' work is still uncommitted in the working tree. A bare `git diff` there mixes in code that is not this task's — review it and you raise findings against another task, including false boundary violations. Judge only the files in `DIFF_SCOPE`.

## Core Principle

Read the spec yourself. Read the diff yourself. Verify mechanically where possible. Reject on concrete failures rather than interpretive optimism.
The main review question is not just "does it work?" but "does it stay inside the approved responsibility boundary without hiding new coupling?"

## Mechanical Checks

Run these checks and use the result as primary signal.

### 1. Regression Safety
- Run the project's canonical test suite using the validation commands discovered by the controller.
- If tests fail, reject.

### 2. No Residual Placeholder Markers
- Check changed files for `TBD`, `TODO`, `FIXME`, `HACK`, `XXX`.
- Reject if new placeholder markers were introduced without explicit task justification.

### 3. No Hardcoded Secrets
- Check changed files for hardcoded secrets or credentials.
- Reject if concrete secret patterns are introduced.

### 4. Boundary Respect
- Compare changed files against the task `_Boundary:_` scope.
- Reject if the change spills outside the approved boundary without explicit justification.
- Reject if the implementation introduces hidden cross-boundary coordination inside what should be a local task.

### 5. Test Evidence (RED evidence where RED is what proves it)

Every unit that changes behavior must be backed by tests. What differs is *which* evidence proves it,
so pick the branch first, then apply it strictly — each branch is REJECT-able.

- **The unit changed the behavior of a code path that already existed, or is a bugfix regression** →
  RED is the evidence. Verify the implementer status report includes `RED_PHASE_OUTPUT`. Reject if it
  is missing, empty, structural (compile/import/collection error rather than an assertion failure), or
  unrelated to the task's acceptance criteria.
- **The unit is new code with no pre-existing behavior to contradict** → `RED_PHASE_OUTPUT` is legitimately
  `N/A`: a "failing" test on a symbol that does not exist yet is a compile error, not evidence. Do **not**
  reject for a missing RED here. Instead verify the substitute: the unit's tests appear in
  `FILES_CHANGED`, they cover the requirement IDs the task claims, and they assert observable behavior or
  a contract rather than restating the implementation. Reject if tests are absent, do not map to the
  acceptance criteria, or are tautological (asserting a value the code just set, an enum's existence, a
  constant, a generated DTO accessor, or annotation-only wiring).
- **The unit has no behavior to test at all** (config/property value, dependency bump, DTO field with no
  logic, annotation-only wiring, scaffolding, copy/docs, test-only move) → `N/A`, no test requirement.

Never treat "no RED reported" as automatically approvable, and never reject solely because RED is absent
without first establishing which branch the unit falls into.

### 6. Runtime-Sensitive Static Checks
- If the project already has lint or equivalent static analysis for the touched stack, run the relevant command for the task boundary.
- Pay attention to patterns that can survive typecheck/build yet fail at runtime: type-only imports used as values, missing namespace value imports for qualified-name access, unresolved globals, and newly introduced runtime-sensitive dependencies without matching boot/runtime handling.
- If no project lint command exists, perform a targeted diff-based spot check in the changed files for those patterns.
- Reject on concrete findings that create a realistic boot-time or module-load failure.

## Judgment Checks

### 7. Reality Check
- Confirm the implementation is real production code, not a placeholder, stub, fake path, or deferred-work shell.

### 8. Acceptance Criteria Coverage
- Read the task description and confirm all aspects are implemented, not only the primary happy path.

### 9. Requirements Alignment
- Read the referenced sections in `requirements.md`.
- Confirm each requirement is satisfied by concrete observable behavior.
- Use original section numbers only.

### 10. Design Alignment
- Read the referenced sections in `design.md`.
- Confirm the implementation uses the prescribed structures, interfaces, and dependency direction.
- Reject silent substitutions for design-mandated choices.

### 10.5 Boundary Audit
- Compare the implementation against the design's boundary commitments and out-of-boundary statements.
- Reject if downstream-specific behavior is pushed into an upstream boundary for convenience.
- Reject if the implementation creates new hidden dependencies, shared ownership, or undeclared coupling across adjacent boundaries.
- Reject if a task that is not an explicit integration task now behaves like one.

### 11. Test Quality
- Confirm tests prove the required behavior rather than only scaffolding.
- Confirm tests would fail if the implementation were removed or broken.

### 12. Error Handling
- Confirm relevant failure paths are handled and not silently swallowed.

## Severity Model

Use:
- `Critical` for broken functionality, invalid verification, data loss, security risk, or major scope violation
- `Important` for required fixes before acceptance
- `Suggestion` for non-blocking improvements
- `FYI` for informational notes

## Stop / Escalate

Escalate instead of papering over the issue when:
- The approved spec is ambiguous in a correctness-critical way
- The design conflicts with what is technically possible
- Required evidence cannot be gathered
- The implementation only works by silently deviating from approved scope
- Boundary ownership cannot be determined cleanly from requirements, design, and task scope

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| “Tests pass, so approve” | Passing tests do not prove spec compliance or boundary respect. |
| “The extra behavior is useful” | Extra behavior outside approved scope is still drift. |
| “The implementer said RED was done” | RED must be evidenced, not asserted. |
| “No RED was reported, so reject” | Only where RED is the evidence (existing code path changing, or a bugfix). On new code, check the tests exist and assert behavior instead. |
| “It’s new code, so tests can wait” | Tests are never optional for behavior — only their *position* moves. No tests ⇒ reject. |
| “This gap is small enough to let through” | Real gaps must be rejected or escalated. |

## Output Format

```md
## Review Verdict
- VERDICT: APPROVED | REJECTED
- TASK: <task-id>
- MECHANICAL_RESULTS:
  - Tests: PASS | FAIL (command and exit code)
  - TBD/TODO grep: CLEAN | <count> matches
  - Secrets grep: CLEAN | <count> matches
  - Static checks: PASS | FAIL | SPOT_CHECKED
  - Boundary: WITHIN | <files outside boundary>
  - Boundary audit: CLEAN | <spillover / hidden dependency findings>
  - Test evidence: RED_VERIFIED | RED_MISSING | TESTS_VERIFIED (new code, RED N/A) | TESTS_MISSING | N/A (nothing behavioral to test)
- FINDINGS:
  1. <specific finding with exact files/spec refs>
- REMEDIATION: <mandatory if REJECTED>
- SUMMARY: <one sentence>
```

## Capture Corrections (learning)

Review is a high-correction surface — the human frequently corrects the verdict itself. Capture
those corrections so the same review mistake does not recur.

- **When invoked interactively** (`/kiro:review`, with a human in the loop): if the human gives a
  **directional** correction to your verdict — a finding you got wrong, a real issue you missed, a
  boundary you misjudged (NOT a wording/format nit) — record a LEARNING **synchronously now** with
  Write/Edit (do NOT defer to a background subagent — a fire-and-forget call can be dropped when the
  turn ends and silently lose the learning):
  - Read `{spec_dir}/learnings.md` (create from `templates/specs/learnings.md` in this skill's directory
    — repo override: `.kiro/settings/templates/specs/learnings.md` — if missing) and append a LEARNING for phase `review`: AI output = your verdict/finding, Correction
    = what the human said, plus the inferred root cause.
  - If the lesson generalizes across specs, also check/update `.kiro/learnings/patterns.md`
    (dedup: add an Example to a matching pattern rather than a near-duplicate; cap 5 examples).
- **When dispatched as a subagent** (under `/kiro:impl`): do NOT write learnings yourself — return the
  verdict; the parent `impl` loop owns recording (its "Record learnings" step captures review-driven
  directional changes). The durable `UserPromptSubmit` capture hook backstops any correction that
  arrives after the run returns.
