# Parallel Task Analysis Rules

## Purpose
Provide a consistent way to identify implementation tasks that can be safely executed in parallel while generating `tasks.md`.

## Relationship to Task Ordering

`(P)` means: this task has no dependency on its immediately preceding peers and can run concurrently with them. The Task Ordering Principle (see tasks-generation.md) ensures Foundation-phase tasks run first, making Core-phase tasks the primary `(P)` candidates.

## When to Consider Milestones Parallel
Only mark a milestone (major task) as parallel-capable when **all** of the following are true:

1. **No data dependency** on pending tasks.
2. **No conflicting files or shared mutable resources** are touched.
3. **No prerequisite review/approval** from another task is required beforehand.
4. **Foundation work complete**: Environment/setup work needed by this task is already satisfied by earlier Foundation-phase tasks.
5. **Non-overlapping boundaries**: `_Boundary:_` annotations confirm tasks operate on separate components.

## Marking Convention
- `(P)` is a **milestone-level** marker. Append it after the major-task number when the milestone
  qualifies (disjoint `_Boundary:_` from its siblings).
  - Example: `- [ ] 3. (P) Reporting module`
- Do NOT mark individual sub-steps `(P)` — sub-steps within a milestone are inherently ordered
  (RED → implementation → `Integrate & verify`). Parallelism is evaluated between milestones.
- If sequential execution is requested (e.g. via `--sequential` flag), omit `(P)` markers entirely.
- Keep `(P)` **outside** of checkbox brackets to avoid confusion with completion state.

## Grouping & Ordering Guidelines
- List obvious prerequisites or caveats in the milestone detail bullets (e.g., "Requires schema migration from milestone 1").
- When two milestones look similar but are not parallel-safe, call out the blocking dependency explicitly via `_Depends:_`.
- Evaluate parallel execution **between milestones**, never between the sub-steps inside one milestone.

## Quality Checklist
Before marking a task with `(P)`, ensure you have:

- Verified that running this task concurrently will not create merge or deployment conflicts.
- Confirmed `_Boundary:_` annotations show non-overlapping component scopes.
- Captured any shared state expectations in the detail bullets.
- Confirmed that the implementation can be tested independently.
- Added `_Depends: X.X_` if this `(P)` task still requires specific prior work from a different major-task group.

If any check fails, **do not** mark the task with `(P)` and explain the dependency in the task details.
