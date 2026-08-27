# Triage Criteria

## Purpose
Guide the AI agent to classify a requirement description into one of three paths before creating spec files: **Skip SDD**, **Single Spec**, or **Multi-Spec**. Apply this decision tree using both the description text and a targeted codebase scan.

## Scoring Dimensions

Evaluate the description and codebase signals across these five dimensions:

### 1. Scope Breadth
How many components, modules, or domains does this work touch?
- **Narrow** (1 component/file): bug fix, config tweak, single-module change
- **Bounded** (2-3 components): feature addition within a clear boundary
- **Wide** (4+ components/domains): cross-cutting concern, platform-wide change

### 2. Requirement Count
How many distinct behaviors or capabilities does the description imply?
- **Minimal** (1-2 behaviors): single change, one outcome
- **Moderate** (3-6 behaviors): a feature with a few acceptance criteria
- **High** (7+ behaviors): multiple features or a large initiative

### 3. Dependency Depth
Do requirements chain across domains or create cross-cutting concerns?
- **None**: self-contained change
- **Shallow**: touches one adjacent domain
- **Deep**: spans multiple domains or requires coordinated changes

### 4. Risk Profile
What type of change is this?
- **Cosmetic / non-behavioral**: typo, formatting, comment, CSS/styling/layout, static text/label, config value, dependency bump, docs, manifest permission declaration (iOS `Info.plist` usage-description, Android `<uses-permission>`) — does NOT change what the code computes/returns/persists (a manifest permission string is config, not access-control logic — do not read the word "permission" as security/redline)
- **Behavioral bug fix**: repairs broken logic/behavior (wrong output, broken handler, bad state) — changes what the code does, so it is NOT cosmetic even in one file
- **Config / dependency update**: changing settings or versions
- **Extension**: adding to an existing feature
- **New feature**: building something that doesn't exist yet
- **Cross-cutting / migration**: restructuring or platform-wide change

### 5. Estimated Task Volume
How many implementation tasks would this likely generate?
- **Trivial** (0-2 tasks): direct edit, no design needed
- **Small** (3-9 tasks): well-scoped feature
- **Large** (10+ tasks): complex initiative needing multiple design rounds

## Complex bugfix signals (design-critique gate)
Bugfix specs skip the design phase **by default** (a CSS/typo/null-check fix needs no architecture
critique). But a bug whose *fix* is architecturally risky must NOT bypass the blast-radius critique.
A bugfix is **complex** when the fix exhibits ANY of these signals:
- changes a public interface, API contract, DTO/response shape, or event/message schema
- touches a shared/common module, utility, or component called from outside the fix's boundary
- alters state management, locking, ordering, retry, idempotency, or concurrency behavior
- risks data corruption / migration, or changes persisted data semantics
- spans more than one service or repository

A complex bugfix has the same blast radius as a feature change of equal reach, so it earns a design
(HLD) pass and the architect-critique-loop. A bugfix with none of these signals stays on the fast
`bugfix_analysis → tasks` path.

## Decision Tree

### Tier the small change FIRST: cosmetic vs behavioral vs redline

"Bug fix" is NOT a single class. Before recommending any no-spec path, place the change in one of three tiers. The discriminator is **what the change does and how risky the path is — NOT file count** (file count is meaningless in small repos where everything touches 1-2 files).

**Cosmetic / non-behavioral** — does not change what the code computes, returns, decides, or persists:
- typo, comment, formatting
- styling / layout / color / spacing / font (CSS only)
- static text / label / copy content (no logic)
- adding or repositioning a UI control that **reuses an existing, already-working handler** (no new logic)
- single-file config value, dependency bump, docs-only edit, env/secret rotation
- OS/manifest permission or capability **declaration** — an iOS `Info.plist` usage-description string (e.g. `NSCameraUsageDescription`, `NSLocationWhenInUseUsageDescription`) or an Android `<uses-permission>` entry. This is a required manifest string, NOT access-control logic. It is still worth a record (it has privacy/review relevance), so it lands in cosmetic-tier *capture* (a minimal spec via `/kiro-spec-quick`), not silent direct-edit.

**Behavioral** — changes what the code does: a real logic fix (wrong output, broken handler, bad state), new wiring that adds behavior, an error-handling / control-flow / state change. A broken function being repaired is behavioral **even if it is one file**.

**Redline** — touches money, auth, security, IO-critical paths, data/migration/persisted semantics, a public contract (API/DTO/event/message schema), concurrency/ordering, or spans more than one service. "Security" here means authorization / access-control **logic**, auth flows, crypto, or secrets — NOT a manifest permission **declaration**. An iOS `Info.plist` usage-description string or an Android `<uses-permission>` entry is cosmetic/config even though the word "permission" appears; do not escalate it to redline on the keyword alone.

### Skip SDD — direct implementation, COSMETIC tier ONLY

Skip SDD applies **only to the cosmetic / non-behavioral tier**. A cosmetic change carries no knowledge worth a spec, so it MAY be implemented directly — but never silently and never by the discovery skill itself:

- The consuming skill (discovery) MUST get **explicit user consent** before any direct implementation — an `AskUserQuestion` offering *implement directly now* vs *capture as a minimal spec*. **Silent direct-edit is prohibited**; the user controls the call.
- On *implement directly now*, hand off to **`/kiro-impl-fast --direct "<change>"`** (spec-less fast mode — edits + a single build/smoke gate, records nothing). On *capture*, route to **`/kiro-spec-quick "<change>"`** — for a change this small it auto-selects its MINIMAL depth (one inline pass, no design, no gates, ~1 model turn), so choosing "capture" costs about the same as the direct edit. (Behavioral changes capture via the bugfix fast path below, not this cosmetic gate.)
- **Spec-ownership override (BLOCKING)** still applies: if an approved, implemented spec (`approvals.tasks.approved == true`) tracks the affected behavior, even a cosmetic edit to its files must be logged to that spec's `learnings.md` (see discovery Path B), and a **behavioral** change to it is NOT cosmetic — it routes to Path A (update that spec).

> **Codebase indicators** (1-2 files, single directory, no new modules) remain a sanity check but never override the tier — a behavioral change in one file is still behavioral.

### Bugfix spec (fast path) — BEHAVIORAL tier

A behavioral bug MUST be captured — it carries debuggable knowledge (root cause, the broken-vs-fixed contract) a future maintainer needs. Do NOT Skip SDD. Route it to a **bugfix spec** on the fast path:
- `spec_type: "bugfix"`, categorized under `specs/bugs/`, design skipped by default (`bugfix_analysis → tasks`); promoted to HLD only if the **complex bugfix signals** above trip.
- Capture via **`/kiro-spec-quick "<bug>" --bug`** — it auto-selects its **MINIMAL** depth (one inline pass → minimal `bugfix.md` current/expected/unchanged + a 1–3 task checklist) for a simple bug with a clear broken-vs-fixed contract, and its **STANDARD** depth (requirements + tasks, design only if the complex-bugfix signals trip) when the bug has real nuance. Then `/kiro-impl-fast`. For the simple case this keeps the compliant path about as cheap as a direct prompt.
- The user may still opt out to `/kiro-impl-fast --direct` after an explicit warning — **except** for the redline tier.

### Redline — always capture, never direct

Redline changes are never Skip SDD and never `--direct`, regardless of consent. Route to a bugfix spec (or feature spec) so the contract / blast radius is recorded and reviewed.

### Single Spec — one spec; SIZE picks the tool (not novelty)

Fits in one spec. Which tool creates it is decided by **size**, the same ladder `spec-quick` climbs
internally — NOT by whether the work is "new":
- **bounded** (single domain, up to ~9 tasks) → `/kiro-spec-quick` (auto-selects MINIMAL or STANDARD depth)
- **large** (10+ tasks, multi-artifact, design-first, multi-repo, or you want guided artifact/workflow
  selection + per-phase approval gates) → `/kiro-spec-init`

**Recommend "Single Spec" when the description matches ALL of these:**

- Bounded feature with clear scope
- 1-3 components or modules affected
- 3-9 distinct behaviors or acceptance criteria implied
- Work fits within a single domain or layer
- No "and" joining fundamentally different features
- Estimated 3-9 implementation tasks

**Codebase indicators:**
- 3-15 files likely affected
- 1-3 directories involved
- Extends existing patterns rather than creating new architecture

**Output guidance:**
> "This fits one spec. Routing to [spec-quick | spec-init] because [size signal — approx task count,
>  single vs multiple domains, design-first, multi-repo]."
> State the tool AND the size reason (1-2 sentences) so the developer can override if the read is wrong.

### Multi-Spec — Suggest breakdown, do not create files

**Recommend "Multi-Spec" when the description matches ANY of these:**

- Description contains "and" joining unrelated capabilities (e.g., "add auth AND build dashboard AND migrate database")
- 4+ components or domains affected
- Multiple distinct user stories or personas
- Work spans multiple architectural layers that don't share a boundary
- Cross-cutting concern affecting the entire codebase
- Platform-wide migration or restructuring
- Estimated 10+ implementation tasks
- Description would produce a design document exceeding 500 lines

**Codebase indicators:**
- 15+ files likely affected
- 4+ directories or modules involved
- Would require new architectural boundaries or patterns

**Output guidance:**
> "This initiative is too large for a single spec. Recommended split into N specs:"
> List each suggested spec with: name, one-line description, recommended order, and dependencies.

## Multi-Repo Classification (when the change spans >1 repository)

Orthogonal to single-vs-multi-**spec**: a change can touch more than one **repo**. Classify by
**change weight per repo** (weight = design/behavior depth, NOT file count) and route. Full contract:
`multi-repo-linkage.md`.

| Situation | Route |
|---|---|
| Only one repo, really | normal single spec here |
| This repo **heavy**, other repo(s) **light** | **Satellite — this repo owns the spec.** Full spec here; record the light repos in `spec.json.affected_repos` (`{repo, weight: "light", why}`). Each light repo gets a **pointer-only** `spec-link.md` (+ minimal `spec.json`) — **never code and never a full spec**: written INTO that light repo by `/kiro-impl` / `/kiro-impl-fast` when they edit it (the sanctioned pointer-only cross-repo write, CLAUDE.md #12), or created by running `/kiro-spec-link` in the light repo. |
| This repo **light**, another repo **heavy** | **Satellite — this repo IS the satellite.** Do NOT create a full local spec here. This repo carries only a pointer `spec-link.md` to the heavy owner: run `/kiro-spec-link --from <heavy-repo> --spec <path>` here, or let it be auto-created when the heavy repo's `/kiro-impl` edits this repo. |
| **≥2 repos heavy** | **Split** — do NOT author across repos from here. Recommend the developer run `/kiro-discovery` + `/kiro-spec-init` in **each** repo (its own full spec) and pin the shared seam contract in every repo's `spec.json.contracts[]`. |


If a repo classified "light" later needs real design/tasks, **escalate** it to its own full spec
(it joins a **Split** as a `role: peer`). A satellite is only for genuinely light, incidental changes.

## Breakdown Guidance for Multi-Spec

When recommending multi-spec, identify natural split points:

### Split by Domain
Separate specs for each business domain (e.g., "auth", "billing", "notifications"). Each domain gets its own spec with clear boundaries.

### Split by Layer
Separate specs for backend API, frontend UI, data migration, infrastructure. Useful when changes span the full stack.

### Split by User Story
Separate specs for each distinct user-facing capability. The "and" test: if you can split the description at "and" and each half is independently valuable, they should be separate specs.

### Split by Phase
For migrations or incremental rollouts: Phase 1 (foundation/core), Phase 2 (main feature), Phase 3 (polish/optimization).

### Dependency Ordering
- Specs that provide shared infrastructure go first
- Specs that consume shared interfaces go next
- Specs with no dependencies can run in parallel

## Worked Examples

### Example 1: Skip SDD (cosmetic — consent then direct)
**Description**: "Fix the typo in the error message shown when config file is missing"
**Analysis**: Cosmetic tier — a static-text edit, no behavior change, 1 file
**Recommendation**: Skip SDD (cosmetic) — ask the user *implement directly now* vs *capture as a fast bugfix spec*; on consent, hand off to `/kiro-impl-fast --direct "fix the missing-config error-message typo"`. Discovery does not edit it.

### Example 2: Skip SDD (cosmetic)
**Description**: "Update vitest from v3 to v4"
**Analysis**: Cosmetic/non-behavioral — dependency bump, no logic change
**Recommendation**: Skip SDD (cosmetic) — on consent, `/kiro-impl-fast --direct "bump vitest v3→v4 and fix any breaking config"`.

### Example 2b: Bugfix spec, fast path (behavioral)
**Description**: "The copy button beside the Cloudinary URL doesn't work, and add a copy button beside the BlurHash too"
**Analysis**: **Behavioral** — the broken copy button is a real logic fix (clipboard API fails in the iframe), and "add a copy button" is new wiring. NOT cosmetic. Not redline.
**Recommendation**: Bugfix spec (fast path) — capture, do NOT direct-implement silently. `/kiro-spec-quick <copy-button-fix>` auto-typed `bugfix` writes `bugfix.md` + requirements + tasks, then implements. (This is the case that previously short-circuited straight to code.)

### Example 2c: Redline (always capture)
**Description**: "Fix the off-by-one in the refund-amount calculation"
**Analysis**: **Redline** — touches money. Never direct, never `--direct`, regardless of consent.
**Recommendation**: Bugfix spec — `/kiro-spec-quick <refund-amount-fix>` (the complex-bugfix signals likely trip the HLD/design-critique gate given money + contract risk).

### Example 3: Single Spec
**Description**: "Add a --dry-run flag to the install command that shows what files would be created without writing them"
**Analysis**: Bounded feature, 2-3 components (CLI parsing, plan execution, output formatting), 4-5 behaviors, extension of existing feature
**Codebase scan**: 5-8 files across cli/ and plan/ directories
**Recommendation**: Single Spec — "Well-scoped feature extending the existing install command. One spec is appropriate."

### Example 4: Multi-Spec
**Description**: "Add support for a new AI agent (Aider), implement i18n for Japanese and Korean, and add a plugin system for custom commands"
**Analysis**: Three unrelated features joined by "and", 3 different domains (agent registry, localization, plugin architecture), 15+ behaviors, 20+ tasks
**Codebase scan**: 30+ files across agents/, template/, cli/, and new plugin/ directories
**Recommendation**: Multi-Spec — split into:
1. `agent-aider-support` — "Add Aider agent configuration, manifest, and command templates" (order: 1, no dependencies)
2. `i18n-ja-ko` — "Add Japanese and Korean language localization templates" (order: 1, no dependencies, parallel with #1)
3. `plugin-system` — "Design and implement plugin architecture for custom commands" (order: 2, independent but larger scope)

### Example 5: Multi-Spec
**Description**: "Migrate the entire codebase from CommonJS to ES modules and update all tests"
**Analysis**: Platform-wide migration, affects every file, high risk, deep dependency chains
**Codebase scan**: 50+ files across all directories
**Recommendation**: Multi-Spec — split into:
1. `esm-core-migration` — "Convert core source files from CJS to ESM with .js extensions" (order: 1)
2. `esm-test-migration` — "Update test framework and all test files for ESM compatibility" (order: 2, depends on #1)
3. `esm-build-tooling` — "Update build scripts, shebang handling, and CI for ESM output" (order: 2, depends on #1, parallel with #2)
