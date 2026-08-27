# Gate CLI

## Purpose
Deterministic, zero-dependency Node scripts that make the lifecycle's **machine-checkable**
invariants enforced by code instead of by prose the model must remember. The model decides *what*
and *when*; these scripts make the *check* and the *write* deterministic, so the same input always
yields the same verdict and the bookkeeping write can't be malformed.

Use them for the bookkeeping/guardrail steps below. They are NOT a substitute for judgment steps
(design quality, review, debugging, "does this test actually exercise the behavior") — never script
those.

## Locating the CLI

The scripts are bundled **inside this skill** (the build resolves them into the skill's own
`scripts/` dir). Invoke them via the skill-directory substitution, which Claude Code replaces with
the skill's absolute path at runtime and is stable across plugin upgrades:

```
${CLAUDE_SKILL_DIR}/scripts/<file>
```

They are **never** copied into the repo and never need seeding — the installed plugin is the single
source of truth, so a plugin upgrade always carries the current scripts. Throughout, `{SCRIPTS}`
denotes `${CLAUDE_SKILL_DIR}/scripts`.

If `${CLAUDE_SKILL_DIR}` is unavailable (e.g. a non-plugin distribution that doesn't bundle the
scripts), **fall back to the prose rules** in the calling skill — never block on a missing CLI.

## Commands

All commands print JSON to stdout and use exit codes as the verdict (`0` = pass, `2` = gate failed,
`64–66` = usage/resolution error). `<feature>` is the feature name or a path to its spec dir.

```bash
# Structural sanity of spec.json (enums, approvals-graph coherence, approvals<->artifacts drift).
node {SCRIPTS}/kiro-gate.mjs validate <feature>

# Checkbox state of tasks.md. --assert-all-done exits 2 if any task is not [x] or any marker is malformed.
node {SCRIPTS}/kiro-tasks.mjs status <feature> [--assert-all-done]

# Atomically flip one task's checkbox marker. state ∈ pending|inprogress|done.
node {SCRIPTS}/kiro-tasks.mjs set <feature> <id> <state>
```

`status` output shape: `{ total, counts:{pending,inprogress,done}, malformed, allDone }`.

## How callers use it

- **Preflight (impl, validate-impl)**: run `kiro-gate.mjs validate`. A non-zero exit means the
  spec.json is structurally broken — stop and report the findings (on stderr) rather than proceeding
  on a malformed spec.
- **Marking task state (impl)**: instead of hand-editing the `- [ ]` / `- [-]` / `- [x]` marker in
  tasks.md, call `kiro-tasks.mjs set <feature> <id> <state>`. It edits exactly the matching id
  (so `1` never collides with `1.1`/`11`) and refuses ambiguous matches. In milestone mode, call it
  once per sub-step id plus the major-task id.
- **All-done gate (impl completion check, validate-impl Step 1)**: instead of eyeballing the
  checkboxes, run `kiro-tasks.mjs status <feature> --assert-all-done`. Exit 0 ⇒ every task is `[x]`
  and no marker is malformed; exit 2 ⇒ not done (the JSON shows the remaining counts and stderr lists
  any malformed lines).

When the CLI is present its verdict is authoritative for these mechanical checks; reserve prose
judgment for everything it does not cover.
