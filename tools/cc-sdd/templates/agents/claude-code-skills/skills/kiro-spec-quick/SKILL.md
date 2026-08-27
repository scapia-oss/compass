---
name: kiro-spec-quick
description: Adaptive spec generator — classifies the change and generates exactly as much spec as it needs. A short, low-risk task (a few lines) gets a MINIMAL spec in one inline pass (~1 model turn, no design, no gates, no sub-skills) so the compliant path costs about as much as prompting directly; anything larger gets the STANDARD pipeline (requirements → design-if-warranted → tasks → sanity review). Design is auto-included only when the change needs it. Flows into /kiro:impl-fast. Override depth with --minimal/--standard and design with --design/--no-design.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Skill, Agent, AskUserQuestion
argument-hint: <description> [--minimal|--standard] [--no-design|--design] [--bug|--chore] [--auto]
metadata:
  shared-rules: "document-style.md, command-tracking.md, triage-criteria.md, interaction-style.md, global-context-loading.md"
  shared-templates: "specs/init.json, specs/requirements-init.md, specs/bugfix-init.md"
  shared-scripts: "stamp-plugin-version.py, record-command-fired.py"
---

# Adaptive Quick Spec Generator

`kiro-spec-quick` produces a compliant, lifecycle-valid spec at the **right depth for the change** — so
a tiny fix isn't forced through a full design pipeline, and a real feature still gets requirements and
(when warranted) design. It picks one of two tiers by classifying the change, and you can override.

| Tier | When (auto) | What runs | Cost |
|------|-------------|-----------|------|
| **MINIMAL** | a few lines, low-risk, single obvious behavior, 0–3 tasks | one inline pass — no sub-skills, no design, no gates, no sanity subagent; auto-approved | ~1 model turn |
| **STANDARD** | everything else (a real behavior / feature, multiple tasks, or redline) | `spec-requirements` → **design (only if warranted)** → `spec-tasks` → sanity review | full pipeline |

**Design is conditional inside STANDARD**: it runs only when the change actually needs architecture
thinking (a design decision, complex-bugfix signals, cross-component work, or redline). A bounded
change that needs requirements but no design skips straight to tasks (the "middle" case) — no design
tax. See `rules/triage-criteria.md` for the tiering + complex-bugfix signals.

<instructions>

## Execution Steps

### Step 0: Input Validation

**MANDATORY — run before anything else.** Strip flags (`--auto`, `--minimal`, `--standard`,
`--design`, `--no-design`, `--bug`, `--chore`) from `$ARGUMENTS`. If what remains is empty, blank, or
only whitespace, **do NOT proceed** — show this and STOP:

```
---------------------------------------------
  MISSING INPUT
---------------------------------------------

  /kiro-spec-quick needs a description to work with.

  Usage:
    /kiro-spec-quick "Add retryCount to PaymentConfig, default 3"
    /kiro-spec-quick "Build notification system" --auto
    /kiro-spec-quick "Fix null crash on empty address line 2" --bug

---------------------------------------------
```

If the description is very short (under 10 characters) or vague ("do something", "fix it", "help"),
ask the user to elaborate before proceeding. This one is **open-ended** per
`rules/interaction-style.md` — print it as prose, do NOT force it into `AskUserQuestion` (there are no
options to enumerate).

### Step 1: Parse Arguments

- `--auto` — no prompts; run to completion (batch/silent).
- `--minimal` / `--standard` — force the depth tier (skip the Step 2 auto-classification).
- `--design` / `--no-design` — force the STANDARD design decision on/off (ignored for MINIMAL).
- `--bug` — force `spec_type: "bugfix"`; `--chore` — force `spec_type: "chore"`.
- The remaining text is the **description**.

### Step 2: Classify Depth (MINIMAL vs STANDARD)

**Redline is checked first, unconditionally — no flag can bypass it.** Before honoring `--minimal`/
`--standard`, check the redline signals below. If the change is redline, classify STANDARD
regardless of which flag was passed: `--minimal` on a redline change is refused (report why,
classify STANDARD anyway, note in the summary that the flag was overridden), and `--standard` is
simply honored as already-correct. "Never MINIMAL" is an absolute rule, not a default that a flag
or a later consent answer can override — money/auth/security/IO-critical/data-migration/public
contract/concurrency/cross-service work always gets the full pipeline.

If `--minimal` or `--standard` was passed **and the change is not redline**, use it and skip to
Step 3. Otherwise classify using the tiering in `rules/triage-criteria.md`:

- **MINIMAL** when the change is a **few lines, low-risk, one obvious behavior, ~0–3 tasks** — a config
  value, a small field/DTO addition, a copy/manifest change, a one-function bug fix with a clear
  broken-vs-fixed contract. This is the cosmetic/simple-behavioral band.
- **STANDARD** otherwise — multiple behaviors, a real feature, cross-component work, ~4+ tasks, or
  anything where a late mistake is expensive.
- **Redline** (money/auth/security/IO-critical/data-migration/public contract/concurrency/cross-service)
  → **always STANDARD** with design forced on (see Step 3B). Never MINIMAL. (Reminder: a manifest
  *permission declaration* — iOS `Info.plist` usage-description, Android `<uses-permission>` — is
  config, not redline.)
- **Too big for one spec** (10+ tasks, multiple domains, unrelated capabilities joined by "and") →
  do NOT generate; recommend `/kiro-spec-init` (single spec with full control) or a multi-spec split.

Print the decision, e.g. `Depth: MINIMAL (short, low-risk change)` or
`Depth: STANDARD (bounded feature; design: needed)`.

**Consent gate — disclose before paying for STANDARD, but only when the fast path was silently
taken away (interactive mode only).** `spec-quick`'s own pitch is speed. Plain size-based STANDARD
(a real multi-behavior feature, ~4+ tasks) is expected, unsurprising scaling — nobody should be
asked to confirm the obvious. The actual broken promise is narrower: **redline** silently removes
MINIMAL for a change the engineer may have expected to be small. Gate on that specifically:

- **Fires only when the STANDARD classification's cause is redline** (money/auth/security/
  IO-critical/data-migration/public contract/concurrency/cross-service). Plain size-based STANDARD
  (4+ tasks, cross-component, no redline signal) proceeds straight to Step 3 with no gate — that
  scaling is expected, not a surprise to confirm.
- When it fires, use `AskUserQuestion` before proceeding to Step 3. Name the **specific redline
  signal** (e.g. "this touches an authorization check on a money path" — not a generic "it's
  complex"), and what it costs (design forced on, the full requirements→design→tasks→review
  pipeline, not the ~1 model turn MINIMAL promises).
- **This is a disclosure, not a permission gate — there is no option that ships MINIMAL on redline
  work.** Options: `Continue with STANDARD (Recommended)` (description: why the signal makes the
  fast path risky here) · `Narrow the scope first` (stop; ask what to cut so the change is no
  longer redline — the only way to reach MINIMAL from here). Do not offer or accept a "force
  MINIMAL anyway" choice; "Never MINIMAL" for redline is absolute (see Step 2 above), not something
  a consent answer can waive.
- Skip this gate in `--auto` mode (no prompts, by definition) — STANDARD is still enforced, just
  not disclosed interactively.

### Step 3: Determine Spec Type and Path (both tiers)

1. **Spec type** — precedence: (1) honor an explicit `--bug`/`--chore` flag; (2) else, **if a
   `/kiro-discovery` brief is present and its `## Spec Classification` block declares a `spec_type`,
   honor that declared value — do NOT re-infer** (discovery already classified it; re-inferring can
   silently downgrade a `bugfix` to a `feature` and skip the bugfix artifact); (3) else infer: `bugfix` (a real logic/behavior fix — crash,
   wrong output, null, regression); `chore` (mechanical, no-design-judgment upkeep — version/dependency
   bump, config value change, pure rename with zero behavior change, log/format tweak, doc/comment
   update, lint/style fix); `tech-debt` (needs an actual judgment call even without external behavior
   change — refactor, restructure, consolidate duplicated logic, replace an internal pattern, remove a
   legacy path still in active use); or `feature` (default). When genuinely ambiguous between chore and
   tech-debt, default to `tech-debt` — it is the broader, safer classification. State the inferred type
   in the summary so it can be corrected.
2. **Category**: `feature` → `features` · `bugfix` → `bugs` · `tech-debt` → `tech-debt` · `chore` → `chores`.
3. **Check for brief**: if a `/kiro-discovery` brief exists at the temporary flat path
   `{{KIRO_DIR}}/specs/{name}/brief.md` (or an already-categorized brief), read it as the description
   source. Do **NOT** reuse the flat directory as the spec dir — discovery writes the brief flat only
   because it does not yet know the spec type. The categorized dated path is computed in item 4 and the
   flat brief is moved into it there (same handling as `/kiro-spec-init`). Reusing the flat dir is what
   makes a discovery→spec-quick handoff wrongly leave the spec at the specs root instead of under its
   category. This applies to every `spec_type` — a `--bug` brief moves into `bugs/…`, not the flat path.
4. **Path**: `{{KIRO_DIR}}/specs/<category>/<YYYY-MM-DD>-<slug>/` (slug = kebab-case, 2–4 words; date
   via `date -u +"%Y-%m-%d"`). Use **Glob** to ensure the path is free; append `-2`, `-3`… if taken.
   Record `spec_path` as `<category>/<YYYY-MM-DD>-<slug>`. Ensure `{{KIRO_DIR}}/learnings/` exists.
   **If a flat discovery brief was found in item 3** (at `{{KIRO_DIR}}/specs/{name}/brief.md`), create
   the categorized dir and **move** the brief into it (`mv {{KIRO_DIR}}/specs/{name}/brief.md
   {spec_dir}/brief.md`) along with any spec-scoped discovery scratch in the same flat dir
   (`decisions.md`, `learnings.md`), then remove the flat `{{KIRO_DIR}}/specs/{name}/` directory once it
   is empty (leave a shared `roadmap.md` where it is — it is not spec-scoped). A brief
   that is **already at a categorized path** is reused in place **only if both its category and its full
   dated path match** the resolved `{{KIRO_DIR}}/specs/<category>/<YYYY-MM-DD>-<slug>/` (item 4). If the
   category differs — e.g. the brief sits under `features/` but a `--bug` flag (or the brief's own
   `## Spec Classification`) resolves the type to `bugfix` — the category is wrong. **Before relocating,
   check what else the old directory holds.** When it is **discovery-only** (nothing but `brief.md` plus
   discovery scratch), move `brief.md` **together with the spec-scoped scratch (`decisions.md`,
   `learnings.md`)** into the correct `{spec_dir}`, leave a shared `roadmap.md` where it is, and remove
   the old directory once it is empty. If the old directory also holds real spec artifacts (`spec.json`,
   requirements, a design file, `tasks.md`, approvals), do **NOT** move `brief.md` alone — that would
   split one spec across two paths and orphan its state. This case **fails closed** (never "keep it" —
   that would leave the spec under a category that contradicts its type): in interactive mode ask via
   `AskUserQuestion` with exactly two options, mapped by **stable id** (never by label text) —
   `move_directory` ("Move the whole spec directory to `<category>/…` after a destination-collision
   check") or `abort` ("Stop; write no spec artifacts") — and route the harness-added `Other` response
   as `abort`; in `--auto` mode **abort with a clear error** (that mode cannot prompt). When you move the
   whole directory, **rewrite `spec.json.spec_path`** to the resolved `<category>/<YYYY-MM-DD>-<slug>`
   (preserving `spec_type` and `artifacts`) so the metadata matches the new location. Never leave a spec under a
   category that contradicts its type, and never split a spec's artifacts to fix the category.

**Steering + cross-spec learnings + spec-scoped decisions/learnings**: follow
`${CLAUDE_SKILL_DIR}/rules/global-context-loading.md` in full — glob-all steering
(`{{KIRO_DIR}}/steering/*.md`) and cross-spec learnings, read spec-scoped `decisions.md`/`learnings.md`
if present, apply what was loaded, print the context manifest. Runs **once here, before either tier**,
regardless of `spec_type` (feature/bugfix/tech-debt/chore) — MINIMAL never delegates to any sub-skill that
would otherwise load this, and STANDARD's own Phase 1 draft is written before `spec-requirements` gets
a chance to.

Then branch: **MINIMAL → Step 3A**, **STANDARD → Step 3B**.

Before writing any spec artifact, read `rules/document-style.md` from this skill's directory and use
plain, simple English. Keep the structure, but make the wording short and direct.

### Step 3A: MINIMAL — one inline pass (bounded sanity scan, no sub-skills, no design)

**Lightweight file sanity scan (bounded, not discovery)**:
Before writing the three files, do a small local scan so a cosmetic fast-route is not blind.

- Extract 2-4 likely search terms from the request: label text, config key, screen name, class name, route, file name, or package name.
- Use Grep/Glob to find likely files. Read only the top likely matches.
- When a target file is found, read nearby dependent files only when obvious from imports, route wiring, provider/bloc usage, test naming, or adjacent stylesheet/template files.
- Keep this bounded: usually 1-5 files total. Do not dispatch subagents. Do not run full discovery.
- Check whether the found files are inside an existing implemented spec boundary when that is obvious from nearby `_Touchpoints:_`, file names, or spec text already loaded. Do not do a full spec ownership search here.
- Check for simple dependency clues: imports, route registration, provider/bloc binding, API client call, controller/service call, shared constant usage, test file next to the target.
- For dependency/version/config changes, read the manifest or config file plus the closest lock/build/test reference when obvious.
- For UI text/style changes, read the screen/widget/template and its adjacent style/test file when obvious.
- If the scan shows behavior, redline, public contract, migration, cross-service, or broad dependency risk, stop MINIMAL and reclassify to STANDARD (or point back to discovery when scope is unclear).
- If the scan cannot identify likely files but the wording is still clearly cosmetic, continue MINIMAL and mark the file evidence as unknown.
- If the scan cannot identify likely files and the wording is not clearly cosmetic, stop and point back to `/kiro-discovery`.
- Use the scan output only for `Current State`, `Files Touched`, and task `_Touchpoints:_`.
- When continuing without a likely file, say `Current State: not found in quick scan` and keep the task touchpoint generic.

Write **exactly three files** directly (no `/kiro-spec-*` dispatch, no subagents). Read
`{{KIRO_DIR}}/settings/templates/specs/init.json` as the base shape and apply the profile below; keep
its current top-level fields (`contracts: []`, `critique_coverage: []`, `language`, timestamps); set
`implementation_mode: "fast"` because the quick route flows into `impl-fast`; add the marker
`"spec_mode": "minimal"`. Prune `approvals` to only the kept phases.

**a) `spec.json`** — design off, requirements + tasks pre-approved, ready to implement:


**Record command fired (deterministic, right after `spec.json` exists).** Run
`python3 "${CLAUDE_SKILL_DIR}/scripts/record-command-fired.py" "{spec_dir}" "kiro-spec-quick" "quick"` (or `python`).
This appends one entry to `spec.json.commands_fired`. Fails open — skip if unavailable, never block.

**Stamp plugin version (deterministic, right after `spec.json` exists).** Run
`python3 "${CLAUDE_SKILL_DIR}/scripts/stamp-plugin-version.py" "{spec_dir}"` (or `python`). Writes/
refreshes the `kiro-plugin-version-<version>.md` marker AND the `plugin_version` field inside
`spec.json` itself, both derived the same way `/kiro-spec-init` and `/kiro-impl` already do — never
hand-write either. A MINIMAL spec was previously created with no version record at all, which is
exactly what let a CI compliance check reject a MINIMAL PR after the fact for a "plugin version"
signal nothing had ever written. Fails open — skip if the script or a Python runtime is absent, never
block.

**b) Intent doc (compact, plan-shaped where useful).**

Feature / tech-debt / chore → `requirements.md`:
- `## Project Description (Input)` with 1-2 sentences: what changes, why, and scope boundary.
- `## Current State` only when quick Grep/Read found useful evidence; cite `file:line`.
- `## Approach` when the change needs plan context: 2-4 sentences with the chosen strategy and one
  rejected alternative, if there was a real alternative.
- `## Files Touched` when known: one line per file or construct, with what changes.
- One `### Requirement 1` with 2-4 crisp `#### Acceptance Criteria` (WHEN/THEN/SHALL).
- Optional `## Out of Scope` when scope could be misread.
- Optional `## Risks / Open Questions` when a real risk or decision remains.

Bugfix → `bugfix.md`:
- 1-2 sentence problem frame.
- `## Current State` when quick Grep/Read found useful evidence; cite `file:line`.
- `## Approach` when the fix shape needs plan context: chosen strategy and one rejected alternative,
  if there was a real alternative.
- `## Files Touched` when known: one line per file or construct, with what changes.
- Compact Current / Expected / Unchanged behavior.
- Cite `file:line` when quick Grep/Read found the broken or nearby path.
- Keep at least one Unchanged Behavior entry; it is the regression guardrail.
- Optional `## Risks / Open Questions` when a real risk or decision remains.

**c) `tasks.md`** — start with the `# Implementation Plan` top-level heading (same as the `spec-tasks`
template — SDD structure validation requires it), then 1–3 sequential checkboxes, no `(P)`; each with
an observable completion condition, a `_Requirements:_` back-ref, and a `_Touchpoints:_` hint if a
quick Grep found one. Do not add plan prose, approach notes, file summaries, or risk sections here;
those belong in `requirements.md` or `bugfix.md`. Keep `tasks.md` transactional.

Then go to **Step 4 (Summary)**. Do not run the sanity subagent — the artifacts are eyeball-sized.

### Step 3B: STANDARD — pipeline with conditional design

**Design decision (do this first).** Design runs **only if warranted**:
- Force: `--design` → on; `--no-design` → off.
- Otherwise **on** when any hold: the change needs an architecture/approach decision; **complex-bugfix
  signals** trip (per `rules/triage-criteria.md` — public interface/DTO/schema change, shared module,
  state/concurrency/ordering, data migration, multi-service); cross-component or multi-file feature; or
  **redline**.
- Otherwise **off** — a bounded change that needs requirements + a task breakdown but no architecture
  (the "middle" case; requirements → tasks, i.e. Path D).

Record the decision (`design: needed` / `design: skipped`) in the tier line.


**Record command fired (deterministic, right after `spec.json` exists).** Run
`python3 "${CLAUDE_SKILL_DIR}/scripts/record-command-fired.py" "{spec_dir}" "kiro-spec-quick" "quick"` (or `python`).
This appends one entry to `spec.json.commands_fired`. Fails open — skip if unavailable, never block.

**Stamp plugin version (deterministic, right after `spec.json` exists).** Run
`python3 "${CLAUDE_SKILL_DIR}/scripts/stamp-plugin-version.py" "{spec_dir}"` (or `python`) — same call,
same script, as MINIMAL's Step 3A. Writes/refreshes the marker file AND `spec.json`'s `plugin_version`
field before Phase 2 runs, so even a run that stops partway through the pipeline (Safety & Fallback:
"Phase failure") leaves a version-stamped spec dir. Fails open — skip if unavailable, never block.

**Phase 2 — Requirements.** Invoke `/kiro-spec-requirements {feature}` via the Skill tool (bugfix specs
generate the bugfix analysis). Ignore its standalone "Next Step". In interactive mode, ask whether to
continue to the next phase with **`AskUserQuestion`** (per `rules/interaction-style.md` — phase gates
are closed questions, never a `(yes/no)` text prompt); in `--auto`, continue immediately.

**Phase 3 — Design (only if `design: needed`).** Invoke `/kiro-spec-design {feature} -y` via the Skill
tool. If `design: skipped`, **skip this phase** and note `design skipped (not needed)`.

**Phase 4 — Tasks.** Invoke `/kiro-spec-tasks {feature} -y` via the Skill tool.

**Sanity review.** Run one lightweight sanity review over `requirements.md`/`bugfix.md`, `design.md`
(if generated), and `tasks.md` read from disk — prefer a fresh review subagent (pass file paths +
objective), else inline. Focus: do the artifacts tell a coherent story; contradictions; missing
prerequisites; task coverage for required design work; plausible `_Depends:_`/`_Boundary:_`/`(P)`
markers. If only task-plan-local issues, repair `tasks.md` once and re-review. If a real
requirements/design gap, stop and report follow-up rather than claiming implementation-ready.

Then go to **Step 4 (Summary)**.

### Step 4: Summary and Next Step

Plain-text confirmation (no markdown bold):

```
---------------------------------------------
  SPEC CREATED: <feature-name>
---------------------------------------------

  Depth:  <MINIMAL | STANDARD>   Type: <Feature|Bugfix|Tech-debt>
  Design: <off (minimal) | skipped (not needed) | included>
  Impl:   fast (spec.json implementation_mode = "fast")
  Path:   {{KIRO_DIR}}/specs/<category>/<date>-<slug>/
  Files:  spec.json · <requirements.md|bugfix.md>[ · design.md] · tasks.md
  Review: <n/a (minimal) | PASSED | FOLLOW-UP REQUIRED>

  NEXT:
    1. Skim the generated spec.
    2. /kiro-impl-fast <feature-name>   (or /kiro-impl for per-task TDD)
```

## Important Constraints
- **Right depth, not always full.** MINIMAL never runs sub-skills, design, gates, or the sanity
  subagent. STANDARD runs design ONLY when warranted.
- **Redline is never MINIMAL** and always gets design + review.
- **Auto-approved** (both tiers skip interactive approval gates) — the user is the review gate; the
  summary tells them to skim before implementing. (STANDARD still runs the internal sanity review.)
- **10+ tasks / multi-domain** → recommend `/kiro-spec-init` or a multi-spec split; do not force it
  through this command.
</instructions>

## Safety & Fallback
- **Templates missing** (`{{KIRO_DIR}}/settings/templates/specs/…`): report the missing path; MINIMAL
  may still write `spec.json` from the inline shape above.
- **Directory conflict**: append a numeric suffix and notify the user.
- **Phase failure (STANDARD, Phase 2–4)**: stop; show completed phases; suggest continuing manually
  from `/kiro-spec-{next-phase} {feature}`.
- **Sanity review fails**: stop; report the exact contradiction/gap; suggest `/kiro-spec-design` or
  `/kiro-spec-tasks` or manual edits.
- **Ambiguous slug**: propose 2–3 names via `AskUserQuestion` (per `rules/interaction-style.md`) and let the user pick.

## Output Description
Provide output in the language recorded in `spec.json.language`: the Step 4 summary, the created file
paths, and the exact next command (`/kiro-impl-fast <feature-name>`).
