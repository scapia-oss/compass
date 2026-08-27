# Implementation Plan

<!-- Write tasks in plain, simple English. Follow the document-style rule. Use concrete file, class, method, route, widget, API, and table names when known. -->

## Task Format Template

Use whichever pattern fits the work breakdown:

### Major task only
- [ ] {{NUMBER}}. {{TASK_DESCRIPTION}}{{PARALLEL_MARK}}
  - {{DETAIL_ITEM_1}} *(Include details only when needed. If the task stands alone, omit bullet items.)*
  - _Requirements: {{REQUIREMENT_IDS}}_

### Milestone structure (DEFAULT — one verify + commit unit per major task)

This is the standard shape. The **major task is the milestone**. It is implemented, tested, reviewed, and committed as one unit. Its **sub-tasks are ordered steps inside that unit**, not separate gates. A milestone that changes behavior:
- has a **test step** — as `{{MAJOR_NUMBER}}.1` **written failing first (RED)** when the failure is the evidence (an existing code path whose behavior is changing, or a bugfix reproduction), otherwise **written alongside the implementation** (the default for brand-new code, where a "failure" would only be a compile error),
- has implementation steps,
- closes with an **`Integrate & verify` step (scoped GREEN gate)**: the milestone's tests + its boundary's test targets + an affected-module build, plus a smoke check only when boot/wiring/config changed.

A milestone with **no behavior to test** (config/property value, dependency bump, DTO field with no logic, annotation-only wiring, scaffolding, copy/docs, test-only move) has no test step — do not invent a test for something with no behavior or contract to protect. It still carries a scoped verify step. Dropping RED never drops tests: only the *position* of the test step changes.

The **full build + full test suite + smoke runs once per implementation run**, as `kiro-impl`'s run-closing gate (and again at `/kiro:validate-impl`). Never write it into a milestone's verify step — which milestone is last depends on what the engineer selected for that run.

`_Boundary:_`, `_Depends:_`, and `(P)` live on the **major task** line because the milestone is the execution unit.

```markdown
- [ ] {{MAJOR_NUMBER}}. {{MILESTONE_NAME}}{{PARALLEL_MARK}}
  - _Boundary: {{COMPONENT_NAMES}}_ *(milestone scope: files/modules this milestone may touch)*
  - _Depends: {{MAJOR_TASK_IDS}}_ *(milestone-level; only for non-obvious cross-milestone deps)*
- [ ] {{MAJOR_NUMBER}}.1 Write failing tests for {{milestone behaviors}} (RED)
  - {{which behaviors / invariants the tests assert}}
  - Observable: the new tests exist and FAIL before implementation
  - _Requirements: {{REQUIREMENT_IDS}}_
- [ ] {{MAJOR_NUMBER}}.2 {{implementation step}}
  - {{DETAIL_ITEM}}
  - _Requirements: {{REQUIREMENT_IDS}}_
- [ ] {{MAJOR_NUMBER}}.{{LAST}} Integrate & verify {{MILESTONE_NAME}}: scoped GREEN gate
  - Evidence: {{affected module builds}}; {{boundary test targets}} GREEN (scoped){{; smoke check when boot/wiring changed}}
  - _Requirements: {{ALL_MILESTONE_REQUIREMENT_IDS}}_
```

### Standalone major task (non-behavioral, no sub-steps needed)
- [ ] {{NUMBER}}. {{TASK_DESCRIPTION}}{{PARALLEL_MARK}}
  - {{DETAIL_ITEM_1}}
  - _Requirements: {{REQUIREMENT_IDS}}_
  - _Boundary: {{COMPONENT_NAMES}}_
  - _Repo: {{REPO_NAME}}_ *(Name the repo when the task lands outside the current working repo.)*
  - _Touchpoints: {{FILE_OR_CONSTRUCT_HINTS}}_ *(Concrete entry points from the LLD File Structure Plan — `path:line` or `Class#method`.)*

> **Parallel marker**: Append ` (P)` only to milestones that can be executed in parallel (disjoint
> `_Boundary:_`). Omit the marker when running in `--sequential` mode.
>
> **Optional test coverage**: When an *additional* sub-step is deferrable test work tied to acceptance
> criteria (beyond the milestone's own RED step and scoped GREEN gate), mark it `- [ ]*` and explain the
> referenced requirements in the detail bullets.
