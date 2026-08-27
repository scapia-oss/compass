---
name: kiro-spec-link
description: Create or refresh a multi-repo spec link — a pointer from THIS repo to the spec that owns a change in another repo, without duplicating spec content. Use for a satellite (light child) repo, or a peer repo in a heavy multi-repo split. Writes only spec-link.md + a minimal spec.json into this repo; never writes into the other repo.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: --from <parent-repo-or-path> --spec <category/YYYY-MM-DD-slug> [--role satellite|peer]
metadata:
  shared-rules: "multi-repo-linkage.md"
---

# kiro-spec-link Skill

## Core Mission
Represent a spec that spans repos **by reference, not by copy**. Run this **in the repo that does
NOT own the spec** (the light/satellite repo, or a peer repo in a split). It creates the mirrored
`{{KIRO_DIR}}/specs/<category>/<YYYY-MM-DD-slug>/` folder here containing a single `spec-link.md`
pointer plus a minimal `spec.json`. The authoritative format, branch-parity, and safety rules live in
`rules/multi-repo-linkage.md` (bundled with this skill) — follow it exactly.

## Hard constraints
- Write ONLY into **this** repo. Never write into the parent/other repo (that would violate the
  one-repo-per-session rule; the pointer here is the sanctioned cross-repo artifact, and it is local).
- Never copy requirements/design/tasks content. Pointer + local change list only.
- Idempotent: if the link already exists, refresh it (do not duplicate or clobber hand-written prose).

## Flag parsing
- `--from <parent-repo-or-path>`: the repo that owns the real spec — a name, or a local path to its
  checkout (a local path lets this skill auto-read the gist/category/remote).
- `--spec <category/YYYY-MM-DD-slug>`: the owning spec's `spec_path` (e.g. `features/2026-07-17-notification-settings`).
- `--role satellite|peer`: default `satellite`. Use `peer` only in a **Split** (≥2 heavy repos, see
  `rules/multi-repo-linkage.md`) where THIS repo also has its own full spec.
- If required args are missing, STOP and show the usage from `argument-hint`.

## Execution Steps

### Step 1: Resolve context
- This repo root: `git rev-parse --show-toplevel`. Confirm it is NOT the same repo as `--from`
  (if `--from` is a path, compare git roots). If they are the same repo, STOP — a link points at
  ANOTHER repo.
- Parse `<category>/<YYYY-MM-DD-slug>` from `--spec`. Category ∈ `features|bugs|tech-debt|chores`.

### Step 2: Pull what you can from the parent (best-effort)
- If `--from` is a readable local path, read `<from>/{{KIRO_DIR}}/specs/<spec>/spec.json` and the
  design file(s) to snapshot the **gist** (feature title + 1–2 line summary), the parent `remote`
  (`git -C <from> remote get-url origin`), and `source_of_truth` (the design/tasks files that exist:
  `design-hld.md` / `design-lld.md` default, `design.md` legacy fallback — never assume a bare
  `design.md`).
- If `--from` is only a name (not a local checkout), record the pointer with the given values and
  leave the gist/why as a clearly-marked TODO for the developer.

### Step 3: Branch parity
- Apply the **Branch parity** rule from `rules/multi-repo-linkage.md` (safe by default: create/switch
  in this repo ONLY if this repo is clean and on its default branch; else warn + record `mismatch`;
  `n-a` when the parent is on `main`/`master`). Capture `this_repo` + `parent_repo` branch names.

### Step 4: Write the link (into THIS repo only)
- **Collision guard (BLOCKING, per `rules/multi-repo-linkage.md`):** inspect any existing
  `{{KIRO_DIR}}/specs/<category>/<slug>/spec.json` here. Absent → create. Present with
  `kind: linked-spec` and the SAME role → refresh. Present as anything else (a full/real spec, other
  `kind`, or a different role) → **REFUSE**; warn about the slug collision and STOP. Never overwrite
  or reclassify an existing non-link spec.
- Create `{{KIRO_DIR}}/specs/<category>/<YYYY-MM-DD-slug>/` if absent (create the category dir too).
- Write `spec-link.md` **per the role-specific format** in `rules/multi-repo-linkage.md` — a
  **satellite** uses the `parent:` block with `source_of_truth` derived from the parent spec.json's
  actual artifacts (never a fixed list; `bugfix.md` for bugfix specs, only the design files that
  exist); a **peer** uses `peers:` + `contract` and does NOT name a parent. Seed the "Changes in THIS
  repo" checklist scoped to the files relevant to this spec (for a satellite, trim the child's
  uncommitted changes to the relevant ones — do not attribute the whole dirty tree). Resolve
  `plugin_version` by reading `.claude-plugin/plugin.json` — walk up from `${CLAUDE_SKILL_DIR}` (this
  skill lives at `<plugin>/skills/spec-link/`, so the plugin root is two levels up); if it cannot be
  resolved, keep the value already present on a refresh and never write `"unknown"`.
- For a **satellite**, write the minimal satellite `spec.json` (`kind: linked-spec`,
  `role: satellite`, all artifacts `false`, `phase: linked`) so `/kiro-spec-status` recognizes it and
  the lifecycle router runs no phases. For a **peer**, do NOT write that stub — a peer keeps its own
  full `spec.json`; write only the `spec-link.md` cross-reference alongside it.
- On refresh: keep `created_at`, update `updated_at` (only when a generated field changed) + checklist
  + branch + version; preserve any
  hand-written "why".

### Step 5: Report
- Print the created/updated path, the branch-parity outcome, and a reminder to enrich the "why this
  repo is touched" section. If `role: peer`, remind the dev to pin the shared contract in BOTH repos'
  `spec.json.contracts[]`.

## Notes
- Automatic linking: `/kiro-impl` and `/kiro-impl-fast` create/refresh satellite links on their own
  when a task edits files in another repo — so you usually only run this skill manually for `peer`
  links (the **Split** shape) or to re-link after a move. Same rule, same format.
