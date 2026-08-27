# Multi-Repo Linkage

## Purpose
Single source of truth for how one logical change that spans **more than one repository** is
represented in cc-sdd — without duplicating spec content and without a central cross-repo session.
Used by `/kiro:spec-link` (manual), by `/kiro:impl` / `/kiro:impl-fast` (automatic, when a task edits
files in another repo), and by the triage step of `/kiro:discovery` / `/kiro:spec-init` (routing).

## Governing invariants (read before changing anything here)
- **One repo owns the real spec.** HLD/LLD/tasks live in exactly one repo. Other repos **reference**
  it by pointer — never a copy (spec-global artifacts are pinned, not duplicated).
- **Sanctioned cross-repo write = the pointer ONLY.** cc-sdd normally never writes into another repo.
  The single exception: it MAY write/refresh a **`spec-link.md` pointer file** (and, in the child
  repo's own `.kiro/specs/…`, a minimal `spec.json`) into a sibling repo that the *same
  session is already editing*. It must **never** write code, a full spec, or design artifacts
  cross-repo. Anything heavier ⇒ that repo needs its own spec (see **Split** below).

## The two multi-repo shapes (routing matrix)
Classify at triage by **change weight per repo** (weight = design/behavior depth, NOT file count).
The two shapes are named for what they produce — use these names everywhere (no opaque "Type A/B"):

- **Satellite** = ONE owning (heavy) repo holds the full spec; each other (light) repo carries only a
  pointer. Produces `role: satellite` links.
- **Split** = every repo is heavy enough to own a full spec; no single repo authors the others.
  Produces one full spec per repo, joined by a shared contract pin (and optional `role: peer` links).

| Situation | Shape | Action |
|---|---|---|
| One repo only | — | normal single-repo spec |
| This repo **heavy**, other repo(s) **light** | **Satellite** | full spec here; each light repo gets a one-file `spec-link.md` pointer (auto during impl, or manual `/kiro:spec-link`) |
| **≥2 repos heavy** | **Split** | do NOT author across repos from here; run `/kiro:discovery` + `/kiro:spec-init` in **each** repo (its own full spec); connect via a shared contract pin (`spec.json.contracts[]`) and optional `role: peer` links |

If a repo classified "light" (a satellite) turns out to need real design/tasks mid-flight,
**escalate**: give it its own full spec (it joins a **Split**, as a `role: peer`).


## Roles
- `role: satellite` — a **light** repo (the Satellite shape). Holds only the pointer + a local change list;
  the owning (parent) repo holds the real spec.
- `role: peer` — a **heavy** repo in a **Split**. It has its **own full spec**; the `spec-link.md`
  just records the sibling specs + shared contract so every repo can see the others.

## Path mirroring
The link is created at the **same path** as the owning spec, in the child repo:
`.kiro/specs/<category>/<YYYY-MM-DD-slug>/` — same category (`features`|`bugs`|`tech-debt`|`chores`),
same dated folder name. So a reviewer opening any involved repo sees the matching spec folder.

## Which repos qualify for an AUTO satellite link (impl / impl-fast)

Automatic linking creates **satellites only**, and **only for declared light repos**:

1. When impl edits a file, resolve its git repo root (`git -C <dir> rev-parse --show-toplevel`). If it
   equals the session repo → not cross-repo, skip. Skip paths under `node_modules/`, `vendor/`,
   `dist/`, `build/`, `.git/`, or any generated/dependency tree — never create `.kiro/specs/…`
   inside a dependency checkout.
2. The cross-repo edit qualifies for an auto satellite link **only if that repo is declared in the
   owning spec's `affected_repos` with `weight: "light"`**.
3. If the edited repo is **not declared** in `affected_repos`, or is declared `weight: "heavy"`: do
   **NOT** write a satellite. A heavy repo owns its own spec — writing a `role: satellite` stub would
   overwrite/disable its real lifecycle metadata. **STOP and emit an escalation:** "Changes landed in
   `<repo>`, which is not a declared light satellite — it likely needs its own spec (a Split peer).
   Run `/kiro:discovery` + `/kiro:spec-init` there and pin the shared contract." Report it; never
   silently satellite-link a heavy or undeclared repo.
4. **Peers are NEVER auto-created.** A `role: peer` link is only ever written by an explicit
   `/kiro:spec-link --role peer` — a Split is a deliberate, per-repo decision.

## Collision guard (before writing ANY satellite file — BLOCKING)

Before creating/refreshing satellite files at the mirrored path, inspect any existing
`.kiro/specs/<category>/<slug>/spec.json` **in the child repo**:

- **Absent** → safe to create.
- **Present AND `kind: linked-spec` with `role: satellite`** → safe to refresh (idempotent).
- **Present as anything else** (a full/real spec, a different `kind`, or `role: peer`) → **REFUSE.**
  Do not overwrite or reclassify it. Warn the developer that the slug collides with an existing
  non-satellite spec in that repo, and stop.

## Branch parity (safe by default — never disrupt uncommitted work)
Cross-repo work should live on the **same branch name** in every repo.
1. Read the parent branch: `parent_branch="$(git -C <parent> rev-parse --abbrev-ref HEAD)"`. **Validate
   it is a plain branch name** (reject any value containing shell metacharacters / whitespace) and
   **always double-quote it** in git commands — never interpolate it raw.
2. If it is `main`/`master` (no feature branch) → skip parity; record `parity: n-a`.
3. Otherwise, in the child repo:
   - **Already on `"$parent_branch"`** (the child's current branch equals the parent's) → nothing to
     do; record `parity: matched`. (This is the common re-run case — do not treat it as a mismatch.)
   - **Clean and on its default branch** → adopt the parent branch:
     - **Fetch first** so the base is current: `git -C <child> fetch origin`.
     - If the branch already exists locally or as `origin/"$parent_branch"` → check it out.
     - Else create it from a **verified upstream base — the child's real `origin/<default>`, never a
       stale local `main`** (per this repo's branch discipline): resolve the child's default with
       `git -C <child> symbolic-ref --short refs/remotes/origin/HEAD` (e.g. `origin/main`) and
       `git -C <child> checkout -b "$parent_branch" <that-origin-ref>`.
     - Record `parity: matched`.
   - **Dirty, or on a DIFFERENT feature branch** → **do NOT switch.** Warn the developer and record
     `parity: mismatch` with both branch names. The dev resolves it.
Always record `branch.this_repo` and `branch.parent_repo` in `spec-link.md` regardless of outcome.

## Idempotency & run-scoped checklist
- `spec-link.md` is a **no-op when its generated content is unchanged**. On re-run: keep `created_at`;
  refresh `updated_at` **only when a generated field actually changes** (branch, checklist, contract,
  `source_of_truth`, `plugin_version`). An unchanged link must not churn `updated_at` or the git diff.
- The "Changes in THIS repo" checklist is **scoped to the current run**, NOT the child's whole working
  tree. Seed it from the files THIS run actually edited in the child repo (the impl run already tracks
  the files it touched per task — filter that set to the child repo root). Do **NOT** derive it from a
  raw `git -C <child> status --porcelain`: a dirty child repo is explicitly supported, so its full
  status includes unrelated pre-existing edits that must never be attributed to this spec. (For a
  manual `/kiro:spec-link` with no run to scope, seed from the child's uncommitted changes but **trim
  to only the files relevant to this spec** — do not attribute the whole dirty tree.)
- Never duplicate the folder or clobber a developer's hand-written "why" prose.

## `spec-link.md` format — role-specific

The front matter and body **differ by role**. Do not use a satellite `parent:` block for a peer, or
vice versa.

**Satellite** (`role: satellite`, a light repo) — include a `parent:` block, OMIT `peers:`, and the
body names the parent as source of truth:

```markdown
---
kind: linked-spec
role: satellite
spec_name: <YYYY-MM-DD-slug>
category: features          # features | bugs | tech-debt | chores
weight: light
created_at: <YYYY-MM-DD>
updated_at: <YYYY-MM-DD>
plugin_version: <x.y.z>
branch: { this_repo: <child branch>, parent_repo: <parent branch>, parity: matched }  # matched|mismatch|n-a
parent:
  repo: <parent repo name>
  remote: <git remote url>
  spec_path: .kiro/specs/<category>/<YYYY-MM-DD-slug>/
  source_of_truth: <derived from the parent spec.json — see rule below>
contract: { id: <contract-id>, version: <x.y.z> }   # optional; omit if no shared seam
---

# Linked spec — <title> (satellite: <this repo>)

> **Source of truth is the parent repo.** Read the parent's requirements/design/tasks in
> `<parent repo>`. Do NOT duplicate them here. This file is a pointer + the local change list.

## Why this spec exists (gist)
<1–2 lines snapshotted from the parent spec at link time>

## Why THIS repo is touched
<auto-seeded "auto-linked <date>: files changed here under parent spec <slug>"; dev enriches intent>

## Changes in THIS repo (this run only)
- [ ] <file/task touched by THIS run in this repo — NOT the child's full git status>

## Back-reference
Parent spec lists this repo under `spec.json.affected_repos`.
```

`parent.source_of_truth` MUST list the parent spec's **actual** files — derive from the parent
`spec.json` artifacts, never a fixed list: `requirements.md` (or `bugfix.md` when `spec_type:
bugfix`), whichever design files exist (`design-hld.md` and/or `design-lld.md` per the enabled
artifacts; legacy `design.md` fallback), and `tasks.md` when present. Omit any file the parent did not
generate — a satellite must never point at a nonexistent file.

**Peer** (`role: peer`, a heavy repo in a Split) — this repo owns its OWN full spec; the link only
cross-references siblings. OMIT the `parent:` block, include `peers:` + the shared `contract`, and the
body must NOT claim a parent is the source of truth:

```markdown
---
kind: linked-spec
role: peer
spec_name: <YYYY-MM-DD-slug>
category: features
created_at: <YYYY-MM-DD>
updated_at: <YYYY-MM-DD>
plugin_version: <x.y.z>
branch: { this_repo: <branch>, parent_repo: <branch>, parity: matched }
peers:
  - { repo: <sibling repo>, remote: <url>, spec_path: .kiro/specs/<category>/<slug>/ }
contract: { id: <contract-id>, version: <x.y.z> }
---

# Linked spec — <title> (peer: <this repo>)

> This repo owns its **own full spec** (the `requirements.md` / design / `tasks.md` in this folder).
> The repos below are **siblings** in a Split, coordinated via the shared contract — none is a parent.

## Sibling repos
- <sibling repo> — `<spec_path>`

## Seam / contract
Pinned `<contract-id>@<version>`.
```

## `spec.json` shape by role
- **Satellite** — a stub so `/kiro:spec-status` recognizes it and the lifecycle router **never runs
  phases** on it:
  ```json
  {
    "feature_name": "<slug>",
    "spec_path": "<category>/<YYYY-MM-DD-slug>",
    "kind": "linked-spec",
    "role": "satellite",
    "artifacts": { "requirements": false, "design_hld": false, "design_lld": false, "tasks": false },
    "approvals": {},
    "phase": "linked"
  }
  ```
- **Peer** — a peer does **NOT** get this stub. It has its **own full `spec.json`** (real phases).
  `/kiro:spec-link --role peer` writes only the `spec-link.md` cross-reference alongside that real
  spec; it must never replace or downgrade the peer's own `spec.json`.
