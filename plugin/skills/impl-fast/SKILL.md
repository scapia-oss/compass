---
name: impl-fast
description: Fast implementation for simple, low-risk specs — sequential, no TDD ceremony, with build/tests and review run once at the end instead of per task. Use for small config/DTO/non-behavioral changes where standard kiro-impl's per-task build+review is overkill (e.g. slow Gradle builds).
disable-model-invocation: true
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Glob, Grep, Agent, WebSearch, WebFetch
argument-hint: <feature-name> [task-numbers] [--no-tests] [--validate] [--impl-model sonnet|opus] [--commit|--no-commit]  |  --direct "<change>"
metadata:
  shared-rules: "command-tracking.md, lifecycle-navigation.md, gate-cli.md, gradle-performance.md, impl-education.md, test-value-guidance.md, language-detection.md, lang-dart-flutter.md, lang-java-backend.md, multi-repo-linkage.md, global-context-loading.md, learning-promotion.md"
  shared-templates: "specs/learnings.md, specs/style-guide.md"
  shared-scripts: "kiro-tasks.mjs, common.mjs, stamp-plugin-version.py, record-command-fired.py, validate-patterns-append-only.py"
---

# kiro-impl-fast Skill

## When to Use (read first)
`kiro-impl-fast` trades per-step safety for speed. It implements tasks **sequentially in the main
context**, writes code **directly without the TDD red/green cycle**, and runs the **build/tests and
review exactly once at the end** instead of after every task. This avoids repeated slow builds (e.g.
Gradle) on simple work.

**Use it for**: small, low-risk tasks — config/yaml entries, DTO or response-shape additions, copy
changes, dependency bumps, scoped non-behavioral changes, and short task sets.

**Do NOT use it for** (prefer `/kiro:impl`): behavioral changes on money/auth/payment/IO-critical
paths, cross-cutting or many-file features, large task sets, or anything where a late-discovered
mistake is expensive. If the selected tasks look behavioral, cross-boundary, or numerous, **warn the
user and recommend `/kiro:impl`** before proceeding — do not hard-block.

The single end-of-run gate (build/test + inline review + `kiro-verify-completion`) is the floor and is
**never** skipped.

## Direct mode (`--direct "<change>"`) — spec-less, COSMETIC only

`--direct` runs a single ad-hoc change with **no spec** — the inline description IS the work. It exists so
the `kiro-discovery` consent gate can hand off a **user-approved, cosmetic / non-behavioral** edit (CSS/
styling, static text/label, typo/formatting/comment, single-file config value, dependency bump, docs, or a
UI control that reuses an existing working handler) without creating spec artifacts. It is NOT a general
escape hatch from specs.

**Hard guards (binding — refuse and redirect):**
- **Cosmetic tier only.** If the change is **behavioral** (a real logic fix, broken handler, new wiring/
  behavior — even one file) or **redline** (money/auth/security/IO-critical/data/migration/public contract/
  concurrency/cross-service), do NOT proceed: STOP and capture it as a spec. A behavioral bug must be
  recorded. Capture via `/kiro:spec-quick "<change>" --bug` — it auto-selects its MINIMAL depth (one
  inline pass → minimal bugfix.md + tasks) for a simple fix and its STANDARD depth when nuanced; redline
  is always STANDARD. Then re-run impl-fast. When in doubt, refuse and route to capture.
- **Records nothing**: no spec.json, brief, requirements, tasks, learnings/decisions, or tasks.md — honoring
  the "just code it, don't record" choice. The only persistence is the code edit + its commit.

**Direct-mode flow (replaces Steps 0–2; rejoin at the Step 3 End Gate):**
1. **Skip spec resolution and approval checks** — there is no spec; the work is the `--direct "<change>"` text.
2. **Load steering + language pack** — read all `.kiro/steering/*.md` (if any), and detect the language per `${CLAUDE_SKILL_DIR}/rules/language-detection.md` to also apply the matching `lang-<lang>.md` pack — so even a cosmetic edit follows project + stack idioms. Print the one-line context manifest. A repo with no steering/no detected language is fine — say so.
3. **Preflight** — discover `BUILD_COMMANDS`/`TEST_COMMANDS`/`SMOKE_COMMANDS` (prefer scoped); record the
   `git status --porcelain` baseline. Same as normal mode.
4. **Re-confirm the tier against the real code** you are about to touch (the description may understate it).
   If it is actually behavioral → STOP and capture via `/kiro:spec-quick "<change>" --bug` (it auto-picks
   MINIMAL/STANDARD depth); if redline → `/kiro:spec-quick` / `/kiro:spec-init`. Per the guard above.
5. **Write the change** on the writer model (`impl_model`, default Sonnet), within the smallest boundary. No
   TDD, no feature flag, no new tests unless the change is itself a test edit. Apply
   `rules/test-value-guidance.md`: never add tests only for enum existence, constants, generated DTO
   accessors, generated code, or annotation-only wiring.
6. **End Gate (runs once, never skipped)** — build/smoke once (+ scoped tests where they exist), then
   `kiro-verify-completion` on fresh evidence. Inline `kiro-review` is light for a cosmetic diff, but the
   build/smoke + verify floor is mandatory. Bounded repair as in the normal End Gate.
7. **Commit** — selective staging of only the touched files (never `git add -A`); message
   `fix(<scope>): <change>` (or `style:`/`chore:` as fits). No tasks.md to update. **Skipped entirely if
   `--no-commit` was passed** — leave the edit in the working tree and say so. There is no spec here, so
   only the flag can turn commits off; absent the flag, commit.
8. **Report** — files changed, commit hash (or `uncommitted`), build/smoke result. Write NO `.kiro/` artifact.

## Relationship to kiro-impl (what is dropped vs. kept)
This skill is a lean sibling of `kiro-impl`. It preserves the substance that makes implementation
correct and only removes the machinery that makes it slow on simple tasks.

- **Dropped for speed**: *per-task* subagent dispatch, parallel `(P)` waves, per-phase TDD test runs,
  the per-task reviewer subagent, the Feature Flag RED/GREEN protocol, and per-task validation.
- **Model split (kept, same as `kiro-impl`)**: code-writing runs on **Sonnet** and the end gate
  (build/test + review + verify) runs on **Opus**. Because this skill batches, the writing is a
  **single** `kiro-implementer` (Sonnet) dispatch for all selected tasks — not per task — so the cost
  win is gained without reintroducing per-task overhead. Override with `--impl-model opus`.
- **Kept (non-negotiable)**: spec-path resolution & lifecycle awareness, approval checks, design and
  requirements grounding, validation-command discovery, selective staging (never `git add -A`), no
  destructive resets, `kiro-verify-completion` before any success claim, learnings/decisions
  recording, and every Safety & Fallback condition (spec-conflict blocking, upstream ownership,
  blocked tasks, invalidated plan).

## Execution Steps

### Step 0: Lifecycle Awareness

**Spec Path Resolution**: The feature directory may be in one of five locations (check in this order):
1. `.kiro/specs/features/<feature>/spec.json` (categorized feature)
2. `.kiro/specs/bugs/<feature>/spec.json` (categorized bugfix)
3. `.kiro/specs/tech-debt/<feature>/spec.json` (categorized tech debt)
4. `.kiro/specs/chores/<feature>/spec.json` (categorized chore)
5. `.kiro/specs/<feature>/spec.json` (legacy flat structure)

If `spec.json` contains a `spec_path` field, use that as the canonical path. Otherwise use whichever
location exists. All subsequent reads/writes for this spec use the resolved path. Throughout this skill, `{spec_dir}` denotes that resolved path; project-global paths under `.kiro/steering/`, `.kiro/learnings/`, and `.kiro/settings/` are NOT spec-relative and keep their `.kiro/` form.

**Record command fired**: Read `rules/command-tracking.md`, then run
`python3 "${CLAUDE_SKILL_DIR}/scripts/record-command-fired.py" "{spec_dir}" "kiro-impl-fast" "implementation-fast"` (or `python`).
Skip this in `--direct` mode because there is no `spec.json`.

Read `{spec_dir}/spec.json` and extract `spec_type`, `workflow`, `artifacts`, and `commit_policy`.

**Determine the commit policy** (chosen by the developer at `/kiro:spec-init`; governs the commit step after the end gate):
- `commit_policy == "leave-uncommitted"` → this run makes **no git commits**. Run the end gate and tick tasks.md as usual, then leave every change in the working tree for the developer to stage and commit.
- `commit_policy == "per-task"`, any other value, or **absent** (specs created before the field existed) → commit per task group as described in Step 3. This is the default.
- **Per-run override**: `--no-commit` (or a clear "leave it uncommitted" request) forces `leave-uncommitted`; `--commit` forces `per-task`. A flag beats `spec.json` but never rewrites it.
- In `--direct` mode there is no spec, so the policy comes from the flag alone (absent ⇒ commit).

**Verify readiness**:
- Tasks must be approved: check `approvals.tasks.approved = true` (or at minimum `approvals.tasks.generated = true`). If not approved, stop and point the user to the prior phases (see Safety & Fallback).

**Determine design artifacts to load** (same rules as `kiro-impl`):
- Load `design-hld.md` and/or `design-lld.md` when their `artifacts` flags are enabled; load `design.md` if neither is enabled but it exists (backward compatibility); for `spec_type: "bugfix"` no design files exist — skip design loading and treat `bugfix.md` as the source.
- **Backward compatibility**: if `spec_type`/`workflow`/`artifacts` are missing, default to `spec_type: "feature"`, `workflow: "requirements-first"`, all artifacts enabled (see `rules/lifecycle-navigation.md`).

### Step 1: Gather Context

Skip re-reading a file only if its content is already in this conversation; never assume steering is loaded. Otherwise load:
- `{spec_dir}/spec.json`, `requirements.md`, `tasks.md`
- Design files as determined in Step 0 (`design-hld.md`, `design-lld.md`, `design.md`, or `bugfix.md`)

**Steering + cross-spec learnings + spec-scoped decisions/learnings**: follow
`${CLAUDE_SKILL_DIR}/rules/global-context-loading.md` in full — glob-all steering and cross-spec
learnings, read spec-scoped `decisions.md`/`learnings.md` if present, print the context manifest.
Inject ALL of it into the Sonnet writer in Step 3 (that file's Rule 5 covers the deterministic
full-inline + fallback-path + post-dispatch cross-check specific to this skill's subagent dispatch).

#### Preflight
- **Discover validation commands** from repository sources of truth (in order): project scripts/manifests (`package.json`, `pyproject.toml`, `build.gradle`/`gradle.properties`, `go.mod`, `Cargo.toml`), task runners (`Makefile`, `justfile`), CI/workflow files, existing e2e/integration configs, then `README*`. Derive `TEST_COMMANDS`, `BUILD_COMMANDS`, `SMOKE_COMMANDS`.
- **Prefer scoped commands** (e.g. run only the affected module/test such as `./gradlew :<module>:test --tests <Class>`) over full builds. These run **once**, in the Step 3 end gate.
- Honor any validation commands pinned in steering over ad hoc pipelines.
- **Establish repo baseline**: run `git status --porcelain` and note pre-existing uncommitted changes.
- **Stamp plugin version (deterministic)**: run `python3 "${CLAUDE_SKILL_DIR}/scripts/stamp-plugin-version.py" "{spec_dir}"` (or `python`) to record the plugin version producing this work beside `spec.json`, so the PR surfaces which kiro version did it. Writes/refreshes `kiro-plugin-version-<version>.md`, prunes any older marker, no-op when unchanged. Fails open — skip if the script or Python runtime is absent; never block. (Skipped in `--direct` spec-less mode — there is no `{spec_dir}`.)


### Step 2: Select Tasks
- Parse the feature name and optional task numbers. With task numbers, implement only that subset; without, implement all pending sub-tasks.
- Resolve `commit_policy` for this run per Step 0: `--no-commit` → `leave-uncommitted`, `--commit` → `per-task`, otherwise the value from spec.json (absent ⇒ `per-task`).
- Determine the code-writing model: default `impl_model = sonnet`; set `impl_model = opus` on `--impl-model opus` or a clear natural-language request ("use Opus for code"). This controls only the writer; the end gate (build/review/verify) always runs in the main context on the session model.
- Build the task queue **in document order**: actionable sub-tasks (X.Y), skipping major headers and any `_Blocked:_` task.
- Honor `_Depends:_`: a referenced task must already be `[x]`; if a prerequisite is incomplete, do it first or warn the user.
- Use `_Boundary:_` / `_Repo:_` / `_Touchpoints:_` to scope each task. **Ignore `(P)` markers — this skill is always sequential.**
- **Risk check**: if the selected tasks are behavioral, cross-boundary, or numerous, warn the user that `kiro-impl-fast` defers all verification to the end and recommend `/kiro:impl`. Proceed only if the user is comfortable (or the work is clearly low-risk).

### Step 3: Implement (sequential, no TDD)

**Announce the model policy (MUST, once, before writing).** Print this crisp Markdown blockquote callout (keep `>` on every line):

```
> ⚡ **Model policy for this run (fast)**
> - ✍️ Code generation → **Sonnet 4.6** — the bulk work, keeps cost down
> - 🔍 Build · review · verify (end gate) → **Opus 4.8** — quality gate, never drops
> - › Want max quality? re-run with `--impl-model opus` (higher cost)
```
When `impl_model = opus`, change the code-generation bullet to `✍️ Code generation → **Opus 4.8** — by request (max quality, higher cost)` and drop the opt-out bullet. Adapt names to the actual session model. If `kiro-implementer` cannot be resolved, add `- ⚠️ implementer agent unavailable → writing on the session model`.

**Commit-policy banner (MUST, once, before writing).** Print one line stating the resolved policy from Step 0:

```
> 📦 **Commits: per task** — one commit per task (grouped where tasks share a file), after the end gate passes. (`--no-commit` to leave everything uncommitted instead.)
```

When `commit_policy == "leave-uncommitted"`, print this instead:

```
> 📦 **Commits: none — everything stays uncommitted** — I implement, run the end gate, and tick tasks.md, then hand you the working tree. You stage and commit. (`--commit` to commit per task instead.)
```

Say which source decided it when a flag overrode the spec.

**First-run walkthrough (MUST on first run).** Read `rules/impl-education.md`. If this is the **first implementation run for the spec** (`tasks.md` has zero `- [x]` tasks), print the `/kiro:impl-fast` speed-mode diagram (section B) once, right after the model-policy banner, then a one-line footer with the run's real task count. On a resume run, print only the one-line reminder.

**Build-stack callout (MUST when the stack is Gradle).** If the `BUILD_COMMANDS`/`TEST_COMMANDS` discovered in the Preflight invoke `gradle`/`./gradlew` (or a `build.gradle(.kts)` exists at repo root), print the **Gradle build-stack callout** from `rules/gradle-performance.md` (section A) once, after the walkthrough — so the user knows the single end gate's build/test cost is the build tool. Use its scoped commands (section B) for the end gate where possible. Skip for non-Gradle stacks.

**First-run Gradle confirmation gate (MUST, first run + Gradle only).** On the first run for the spec, if the stack is Gradle, run the one-time confirmation gate in `rules/impl-education.md` (section C): show the "why optimize" note, then ask one confirmation — proceed now, or pause to optimize via `/kiro:doctor`. Honor the answer, record it for the session, never re-ask. Fires at most once; non-Gradle and resume runs skip it.

**Write the code (model per `impl_model`):**
- **`impl_model = sonnet` (default)** → dispatch a **single** `kiro-implementer` subagent (`subagent_type: kiro:kiro-implementer` — the plugin namespace; fall back to bare `kiro-implementer` only on the npx user-level install, Sonnet) to write **all** selected tasks in one pass. Construct the invocation message with: the ordered task list + short briefs, the **inlined verbatim requirements/design excerpts**, **ALL steering verbatim (core defaults + every custom file — never the trio alone, never cherry-picked)** + design globals (Architecture/Boundary Map, contracts, error-handling, naming — same injection as `kiro-impl`), the **inlined Test Value Guidance** from `${CLAUDE_SKILL_DIR}/rules/test-value-guidance.md`, the **inlined FULL `.kiro/learnings/style-guide.md`** (when it exists and is non-empty — same binding tier as steering, under a `## Style Guide (project-wide code style — binding)` heading; these are broad-stroke conventions that should shape every line of new code, not just be consulted on trouble), the **detected Language Best Practices pack** (per `${CLAUDE_SKILL_DIR}/rules/language-detection.md` — inline the matching `lang-<lang>.md` under a `## Language Best Practices` heading, or nothing if no language matches; steering overrides it), the **inlined FULL `{spec_dir}/learnings.md` and `{spec_dir}/decisions.md`** (spec-scoped and small — inline entirely, do NOT select "relevant" entries) with `.kiro/learnings/` (the whole directory, not just `patterns.md`) passed as a fallback path, and `_Boundary:_`/`_Repo:_`/`_Touchpoints:_` scope. Prepend this **FAST-MODE override** (the agent's default protocol is TDD; override it explicitly): *"FAST MODE — write the code directly; NO TDD red/green, NO feature flag; write only value-bearing tests the tasks explicitly call for (skip all new tests if `--no-tests`); do NOT add tests only for enum existence, constants, generated DTO accessors, generated code, or annotation-only wiring; do NOT run the build or test suite — the parent runs a single end gate. Stay within each task's boundary; report files changed per task."* The subagent follows the per-task writing protocol below and opens with a context manifest of every file it grounded on. When it returns, **glance its `CONTEXT_FILES`/manifest** and confirm it names the steering files + `{spec_dir}/learnings.md` + `{spec_dir}/decisions.md` + `.kiro/learnings/style-guide.md` (when injected) you handed it (mechanical name-presence check); if an injected grounding file is missing from the report, re-dispatch once with a "ground on these and list them" reminder before the end gate. If `kiro-implementer` cannot be resolved, fall back to writing inline in the main context.
- **`impl_model = opus`** → write inline in the main context (session model), following the per-task protocol below directly — no subagent.

The writer (Sonnet subagent or inline main) follows this per task, in order:
1. **Brief**: from the relevant requirements/design sections, note the acceptance criteria, the completion definition (files/functions/tests that must exist), and the design constraints to follow. Keep it short.
2. **Implement directly**: write the code to satisfy the task and design constraints. Write only the value-bearing tests the task explicitly calls for — but **do not run them yet** (run-once happens in the end gate). If `--no-tests` was passed, skip writing new tests. Do not add tests only for enum existence, constants, generated DTO accessors, generated code, or annotation-only wiring.
3. **Do not build, test, review, or mark `[x]` per task.** Track which files belong to which task so commits can be staged selectively later.

After **all** selected tasks are implemented, run the single end gate.

**End Gate (runs exactly once):**
- **a) Build/test once**: run the discovered `BUILD_COMMANDS` + `TEST_COMMANDS` (scoped where possible) a single time over the cumulative change.
  - On failure: fix only the concrete failures (you may dispatch a fresh `kiro-debug` subagent via the Agent tool for a stubborn root cause; parse its `NEXT_ACTION` from the exact structured field). Re-run. **Bounded to 3 repair rounds.** If still failing, stop and report — do not mark tasks complete.
- **b) Review once (inline)**: apply the `kiro-review` protocol in the main context over the cumulative `git diff`, treating the diff as the source of truth and verifying it against requirements/design. **Bounded to 2 repair rounds.** If the review exposes a real spec/design gap, stop and route back (see Safety & Fallback) rather than papering over it.
- **c) Verify completion**: apply `kiro-verify-completion` using fresh evidence from the current code state before any success claim.

**Commit & mark complete** (only after the end gate passes):

**When `commit_policy == "leave-uncommitted"`** — do not commit and do not `git add` anything. Flip every completed task's checkbox to `[x]`, leave all files (including tasks.md) in the working tree, and report the full file list with `uncommitted` in place of commit hashes. Skip the file-overlap grouping below entirely — it exists only to make per-task *commits* safe, and with no commits there is nothing to mis-attribute.

**When `commit_policy == "per-task"` (default)**:
- **First, group tasks by file overlap.** Because this skill writes all tasks in one pass, two tasks may have edited the **same file**. `git add <path>` stages the file's *entire current state*, not a task's specific hunks — so a per-task commit of a shared file would swallow the other task's changes and mis-attribute history (and leave the later task's commit empty). To prevent this: compute each task's file set; any tasks that share a file form **one commit group**.
  - **Disjoint task** (its files touched by no other selected task): commit on its own — stage only its files with explicit paths, set its checkbox `[x]`, commit `feat(<feature-name>): <task description>`.
  - **Overlapping group** (tasks sharing one or more files): make **one** commit for the whole group — stage the union of their files explicitly, set all their checkboxes `[x]`, commit `feat(<feature-name>): <task A>, <task B> (shared files)`. Do NOT attempt separate per-task commits for these; the per-task→commit mapping is not recoverable from working-tree state once files are shared.
- **NEVER** `git add -A`/`git add .` — always explicit paths. The build was deferred to the gate.
- Leave any task that could not be completed/verified as `[ ]` and report it.

**Verify the checkbox write, don't just trust it.** After flipping checkboxes (either commit-policy branch),
run `kiro-tasks.mjs status <feature>` (see `rules/gate-cli.md`) and include its JSON (`done`/`pending`/
`malformed` counts) in the Step 4 report as the completion evidence — do not report "tasks complete" from
your own memory of which checkboxes you flipped. If `allDone` is `false` or `malformed` is nonzero, say so
plainly in the report rather than presenting the run as finished.

**Record learnings/decisions/style** (record them synchronously; do not skip):
- Record only **directional** corrections (approach/scope/architecture/technical choice), not cosmetic fixes. If the human corrected the approach, record a LEARNING **synchronously now** with Write/Edit (do NOT dispatch a background subagent — a fire-and-forget call can be dropped when the run ends and silently lose the learning): read `{spec_dir}/learnings.md` (create from `templates/specs/learnings.md` in this skill's directory — repo override: `.kiro/settings/templates/specs/learnings.md` — if missing) and append "LEARNING for phase 'implementation' …"; if generalizable, follow `rules/learning-promotion.md`: dedupe against `.kiro/learnings/*.md`, update `.kiro/learnings/patterns.md` append-only, include `Source spec` pointing back to this learning entry, and run `validate-patterns-append-only.py`. If the human chose between distinct approaches, record a DECISION the same way in `{spec_dir}/decisions.md`. (Same thresholds as `kiro-impl`.)
- **If the human corrected code SHAPE/CONVENTION** (naming, control-flow shape, method length/breakage, controller/service layering, component nesting — "this is how we always write X", not a mistake and not a scope choice): apply the **broad-stroke test** — would this recur on 3+ unrelated files if not written down? If yes, record a STYLE entry **synchronously now** with Write/Edit: read `.kiro/learnings/style-guide.md` (create from `templates/specs/style-guide.md` in this skill's directory — repo override: `.kiro/settings/templates/specs/style-guide.md` — if missing). Dedup: if a matching entry exists, append a new Example (cap 3, replace oldest); otherwise append a new entry with the mandatory fields — `## <Title> (backend|frontend|global)`, `**Rule:**`, `**Example:**` (fenced ❌/✅ code block — never omit), `**Why:**`, `**Source:**`. If it's file-specific or purely cosmetic with no repeat risk, skip it — no nitpicks.
- Also fire on autonomous corrections (a debug-driven approach change during the end gate), not only human ones. Explicitly decide yes/no at the end of the run — do not silently skip.

### Step 4: Final
- **Multi-repo satellite links** (strictly per `rules/multi-repo-linkage.md`): if a task edited a file
  whose git repo root differs from the session repo (skip `node_modules/`, `vendor/`, `dist/`,
  `build/`, `.git/`), create a satellite `spec-link.md` (+ minimal `spec.json`, `role: satellite`)
  **only** for a repo declared `affected_repos` `weight: "light"`. For an **undeclared or `heavy`**
  repo, do NOT link — STOP + escalate ("needs its own spec / is a Split peer; run `/kiro:discovery` +
  `/kiro:spec-init` there"). Apply the **collision guard** (refuse a non-satellite dir), branch parity
  (safe rule), and a **run-scoped** checklist (files this run touched, not the child's full status).
  Pointer-only, idempotent, peers never auto-created. If a link write fails, report a **partial
  result** — do not claim success. Report each link, escalation, and branch mismatch.
- Report: tasks completed, files changed and commit hashes, the single build/test result, and the inline review verdict.
- If `--validate` was passed, run `/kiro:validate-impl {feature}` once for the required feature-level gate. Otherwise
  print the required gate as its own callout line, not a clause buried in closing prose — e.g.
  `> ▶ Required next gate: run /kiro:validate-impl {feature} before merge / success claim.` — for anything beyond
  trivial changes, so it survives being skimmed in a long report.
- Do not auto-run validation unless `--validate` is present.

## Critical Constraints
- **Build/test and review happen ONCE, at the end** — never per task or per phase.
- **No TDD red/green cycle and no Feature Flag RED/GREEN protocol.** If a behavioral change genuinely needs a flag (per steering), add the flag as ordinary code — but prefer `/kiro:impl` for behavioral work.
- **Selective staging only**: never `git add -A` or `git add .`; always explicit paths.
- **Honor the commit policy**: commit only when the resolved `commit_policy` is `per-task`. Under `leave-uncommitted`, make no commit and no `git add` at all — and never commit at the end of the run just because the tree looks messy.
- **No destructive resets** (`git checkout .`, `git reset --hard`, …) inside the loop.
- **Never mark a task `[x]`** before the end gate passes and `kiro-verify-completion` is applied.
- **Bounded repair**: 3 rounds for build/test failures, 2 rounds for review; then stop and report.

## Safety & Fallback
- **Tasks not approved / missing spec files**: stop; suggest completing `/kiro:spec-requirements`, `/kiro:spec-design`, `/kiro:spec-tasks`. (Does NOT apply in `--direct` mode — there is no spec; instead the Direct-mode tier guard applies: a behavioral change refuses and routes to capture via `/kiro:spec-quick "<change>" --bug` (which auto-picks MINIMAL/STANDARD depth), and a redline change to `/kiro:spec-quick` / `/kiro:spec-init`.)
- **Spec conflicts with reality** (API/platform doesn't exist as specified): append `_Blocked: <reason>_` to tasks.md for that task — do not silently work around it.
- **Upstream ownership detected**: if the failure's root cause belongs to an upstream/shared/dependency spec, route the fix back to the owning spec; keep the downstream task blocked rather than patching around it.
- **End gate fails after bounded rounds**: stop, report the remaining failures, and leave affected tasks unmarked. Recommend `/kiro:impl` (which localizes failures per task) for the remaining work.
- **Task plan invalidated** (ordering/boundary/decomposition problem surfaced during the gate): stop and return for human review of `tasks.md` instead of forcing a workaround.
- **All selected tasks blocked**: stop and report blockers.

## Output Description
Provide a concise report in the language specified in spec.json:
1. Tasks completed (IDs) and remaining/blocked tasks with reasons
2. Files changed and commit hashes — or, under `commit_policy: "leave-uncommitted"`, the file list plus the `git status --porcelain` count and `uncommitted` in place of hashes
3. Single build/test result and the inline review verdict
4. Next step (`/kiro:validate-impl {feature}` required gate, or `/kiro:retrospective {feature}` if `--validate` ran and returned GO)
