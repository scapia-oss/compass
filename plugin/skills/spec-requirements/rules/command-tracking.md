# Command Tracking

Use this rule to record skill usage in `spec.json` for analytics.

## Field

Append one entry to root-level `commands_fired`.

Each entry records:
- `sequence`: 1-based order in this spec
- `command`: command name, such as `kiro-spec-requirements`
- `skill`: skill name, same as command unless a skill states otherwise
- `phase`: lifecycle phase, such as `requirements`, `design-hld`, `implementation`
- `timestamp`: UTC ISO-8601 time

## How To Record

After `{spec_dir}` is resolved and `spec.json` exists, run:

```bash
python3 "${CLAUDE_SKILL_DIR}/scripts/record-command-fired.py" "{spec_dir}" "<command>" "<phase>"
```

If `python3` is not available, use `python`. If neither is available, skip silently.

The recorder also reconciles deterministic spec state:
- It sets `artifacts.<name>: true` for known files that already exist in the spec directory.
- It backfills missing lifecycle command entries from deterministic artifacts, such as `design-review.md`
  implying `kiro-validate-design` and `tasks.md` implying `kiro-spec-tasks`.

After a command writes a new spec artifact later in the same invocation, run a reconcile-only pass:

```bash
python3 "${CLAUDE_SKILL_DIR}/scripts/record-command-fired.py" "{spec_dir}" --reconcile-only
```

This updates artifact presence and inferred missing command entries without appending a duplicate firing for
the current command.

If this rule is the only reason the skill has `Bash`, use `Bash` only for this script. Do not add shell
inspection, repo commands, validation commands, or file edits because of this rule.

## Rules

- Run this once per skill invocation.
- Run `--reconcile-only` after writing later artifacts when needed; it is not a second command firing.
- Run it before phase-specific work and before any early return after spec path resolution.
- Do not hand-edit `commands_fired`.
- Do not hand-edit artifact-presence flags for files the recorder can infer.
- If `commands_fired` exists but is not an array, skip tracking. Do not overwrite it.
- Do not dedupe entries. Re-running a skill is a new firing and must append a new entry.
- Skip spec-less direct modes because there is no `spec.json`.
- This tracking must not change phase flow, approvals, validation verdicts, or generated document structure.
