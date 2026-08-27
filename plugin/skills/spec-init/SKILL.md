---
name: spec-init
description: Initialize a new specification with guided workflow selection
allowed-tools: Bash, Read, Write, Glob, Grep, AskUserQuestion
argument-hint: <project-description> [--no-triage]
metadata:
  shared-rules: "document-style.md, command-tracking.md, triage-criteria.md, lifecycle-navigation.md, multi-repo-linkage.md, interaction-style.md, global-context-loading.md"
  shared-templates: "specs/init.json, specs/requirements-init.md, specs/bugfix-init.md"
  shared-scripts: "stamp-plugin-version.py, record-command-fired.py"
---

# Spec Initialization

<instructions>
## Core Task
Guide the user through a multi-step conversation to select their spec configuration, then create the specification structure. **No files are written until all questions are answered.**

Before writing any spec artifact, read `rules/document-style.md` from this skill's directory and use
plain, simple English. Keep the workflow structure, but make the wording short and direct.


## Execution Steps

### Step 0: Input Validation

**MANDATORY — run before anything else, even before flag parsing.**

Check whether `$ARGUMENTS` (after stripping flags like `--no-triage`) contains a meaningful project description. If the argument is empty, blank, or contains only flags/whitespace, **do NOT proceed**. Instead, show this message and STOP:

```
---------------------------------------------
  MISSING INPUT
---------------------------------------------

  /kiro:spec-init needs a project description to work with.

  Usage:
    /kiro:spec-init "Add dark mode toggle to settings page"
    /kiro:spec-init "Fix crash when uploading large files"
    /kiro:spec-init "Build notification system" --no-triage

  TIP: Just type, speak, or paste your thought.
  You can also reference a notes file:
    /kiro:spec-init "See notes in docs/feature-ideas.md"

---------------------------------------------
```

If the description is very short (under 10 characters) or vague (e.g., "do something", "fix it", "help"), ask the user to elaborate before proceeding:

```
---------------------------------------------
  NEED MORE CONTEXT
---------------------------------------------

  Your input: "[user's input]"

  That's a bit too vague for triage analysis and spec
  creation. Could you add more detail?

  For example:
  - What's the problem or feature?
  - Which part of the app is affected?
  - What should change?

---------------------------------------------
```

### Step 1: Triage Analysis (MANDATORY -- only skipped with explicit `--no-triage` flag)

**Purpose**: Analyze the requirement description and codebase to recommend whether to skip SDD, proceed with a single spec, or split into multiple specs.

**IMPORTANT**: ALWAYS execute this step and show the TRIAGE ANALYSIS output, even when `brief.md` exists from a prior `/kiro:discovery` session. Discovery determines the action path; triage provides codebase-level evidence (specific files, line numbers, scope). They serve different purposes. The ONLY way to skip this step is the explicit `--no-triage` flag.

**Steering + cross-spec learnings + spec-scoped decisions/learnings**: follow
`${CLAUDE_SKILL_DIR}/rules/global-context-loading.md` in full — glob-all steering
(`.kiro/steering/*.md`, core + custom, never a fixed list) and cross-spec learnings
(`.kiro/learnings/*.md`, glob-all, not just `patterns.md`), apply what was loaded to the
triage decision, and print the context manifest. This runs regardless of `spec_type` — feature,
bugfix, tech-debt, and chore triage all need the same project context to route correctly.
- Spec-scoped `decisions.md`/`learnings.md` under `.kiro/specs/{feature-name}/` apply only when
  re-initializing an existing spec (a brand-new spec has none yet).

1. **Check for Brief**: If `.kiro/specs/{feature-name}/brief.md` exists (created by `/kiro:discovery`), read it. The brief contains problem, approach, scope, and constraints from the discovery session. Use this to **enrich** (not replace) the triage analysis with pre-validated context.

2. **Load Triage Criteria**:
   - Read `rules/triage-criteria.md` from this skill's directory for the decision tree and scoring dimensions
   - If the rules file is missing, warn the user and skip triage (proceed to Step 2)

3. **Analyze Description**:
   - Identify scope signals: how many distinct behaviors or capabilities are implied?
   - Assess domain breadth: single component, few components (2-3), or many (4+)?
   - Classify risk profile: bug fix, config change, extension, new feature, or cross-cutting?
   - Detect complexity keywords: "migrate", "refactor", "integrate", "and" joining unrelated features
   - Count implied requirements: each distinct behavior or user-facing change counts as one

4. **Scan Codebase**:
   - Extract 3-5 key terms from the description (nouns, technical terms, component names)
   - Use **Grep** to search for those terms in the codebase to estimate blast radius
   - Use **Glob** to check which directories and modules would be affected
   - Count: affected files, distinct directories, distinct source modules
   - Note specific file names and line numbers where matches are found
   - If codebase scan fails or returns no results, proceed with description-only analysis

5. **Show Triage Output**: Present the analysis in this EXACT plain-text format:

```
---------------------------------------------
  TRIAGE ANALYSIS
---------------------------------------------

  Description: [user's description, condensed to 1-2 lines]

  FINDING: [what the codebase scan revealed -- affected files,
  patterns found, existing code, specific line numbers]

  SCOPE:
  - [N] file(s) to modify: [file names]
  - [N] test file(s) to update: [file names if any]
  - [assessment: single behavior / bounded feature / cross-cutting]

---------------------------------------------

  RECOMMENDATION: [SKIP SDD / SINGLE SPEC / MULTI-SPEC]

  [1-2 sentence reasoning]

  [If SKIP SDD: give "DIRECT FIX:" (edit inline, no record) AND, when a
   compliant record is wanted, "SPEC RECORD: /kiro:spec-quick "<desc>""
   — it auto-selects its minimal one-pass depth for a change this small]
  [If MULTI-SPEC: suggested breakdown with spec names]

  Override: Run /kiro:spec-init --no-triage "..." if you
  want a spec anyway.

---------------------------------------------
```


### Step 2: Spec Type Selection (Question 1)

1. **Check for Brief**: If `.kiro/specs/{feature-name}/brief.md` exists (created by `/kiro:discovery`), read it. The brief contains problem, approach, scope, and constraints from the discovery session. Use this to pre-fill the project description and to inform the recommended spec type. **If the brief's `## Spec Classification` block declares a `spec_type`, honor that declared value (pre-select it, do not re-infer) — discovery already classified the change.** Only fall back to inferring from the brief prose when that block is absent (older brief).

2. **Clarify Intent**: The Project Description in requirements.md must contain three elements: (a) who has the problem, (b) current situation, (c) what should change. If a brief.md exists and covers these, skip clarification. Otherwise, ask the user to clarify before proceeding. Ask as many questions as needed; do not fill in gaps with your own assumptions.

   **Form of each clarifying question** (per `rules/interaction-style.md`, applied per question -- this step is NOT blanket-prose):
   - **Closed -> `AskUserQuestion`.** The moment a clarification reduces to a choice among nameable alternatives, it MUST use the tool. Triage frequently produces exactly these: reconciling a behavioral divergence the codebase already has (which of three analytics firing shapes wins; does a missing loading guard get added), picking where content/config comes from, choosing whether a refactor preserves or standardizes behavior. You discovered the alternatives during triage, so you can name them -- that makes the question closed. One question per call unless the user can sensibly answer them together in one screen.
   - **Open -> prose.** Only when the answer is genuinely narrative: the description is too vague to act on at all, or you'd bias the answer by listing options. "Who is this for and what should change?" is open; "should the unified screen fire the event on tap, on checkbox change, or keep per-bank behavior?" is closed -- do not ask that one as prose.

3. **Print the analysis preamble** (plain text, no markdown bold/italic -- UPPERCASE and dash lines only):

```
---------------------------------------------
  STEP 1 OF 4 -- WHAT KIND OF WORK?
---------------------------------------------

  I analyzed your description:
  "[insert the user's description here]"

  [Insert AI's 1-2 sentence analysis of what the description implies]

---------------------------------------------
```

4. **Ask the selection with `AskUserQuestion`** (per `rules/interaction-style.md` -- this is a closed question, so it MUST go through the tool, never an ASCII menu ending in `Type 1, 2, 3, or 4:`).

   - `header`: `Work type`
   - `question`: `What kind of work is this?` -- append the one-line note: *Features get full design review with approval gates; bugfixes get lightweight analysis focused on what's broken, what should work, and what must not change; tech debt / chores get focused scope with optional design; quick changes skip SDD entirely.*
   - `multiSelect`: `false`
   - Options (exactly these four, no more):

   | id | label | description |
   |---|---|---|
   | `w-feature` | `Build a feature` | New functionality or capabilities that don't exist yet |
   | `w-bug` | `Fix a bug` | Fix something that's broken, crashing, or not working correctly |
   | `w-techdebt` | `Pay down tech debt / chore` | Refactor, dependency upgrade, performance work, cleanup, rename, or version bump |
   | `w-quick` | `Quick change (no spec)` | Single-file edit -- typo, config tweak, dependency bump |

**IMPORTANT**: Move whichever option your analysis recommends to the **first** position and suffix its label with ` (Recommended)`. It is usually `w-feature` or `w-bug` depending on the description. Do not hand-author an "Other" option -- the harness appends one.

**Handle response:** the `id` column is the mapping key -- it is stable regardless of option order or the ` (Recommended)` suffix. Resolve the returned label back to its `id` by matching the label text you sent for that row, then act on the `id`. Never key this mapping off the raw label string.
- `w-quick`: Output actionable advice -> STOP -- no files created
- `w-techdebt`: This one label covers two `spec_type`s — infer which from the description rather than
  asking a second question (a fifth `AskUserQuestion` option would exceed the tool's 4-option cap):
  **`chore`** when the description is dominated by mechanical, no-design-judgment signals (version/
  dependency bump, config value change, rename with zero behavior change, log/format tweak, doc/comment
  update, lint/style fix); **`tech-debt`** when it needs an actual judgment call even without external
  behavior change (refactor, restructure, consolidate duplicated logic, replace an internal pattern,
  remove a legacy path still in active use). Default to `tech-debt` when genuinely ambiguous — it is
  the broader, safer classification and always allows an optional design phase; `chore` never does.
  State which you inferred in the mode summary (`Classified as: CHORE` or `Classified as: TECH DEBT`)
  so the user can correct it before any files are written. Set `workflow: "requirements-first"` -> Show
  Tech Debt / Chore Mode summary, then skip to Step 4 (artifact selection)
- `w-bug`: Record `spec_type: "bugfix"`, set `workflow: "requirements-first"` -> Show Bugfix Mode summary, then skip to Step 5
- `w-feature`: Record `spec_type: "feature"` -> Continue to Step 3
- **Unmapped answer** (the harness appends an "Other" free-text choice, so one can always arrive): if the text clearly restates one of the four ids, treat it as that id. Otherwise **re-ask this question once** with the free-text quoted back; if it is still unmapped, STOP and report that the work type could not be determined. **Never** record a `spec_type`, write `spec.json`, or fall through to Step 3 on an unmapped answer.

**If user selects Fix a Bug, display this Bugfix Mode summary before proceeding to Step 5:**

```
---------------------------------------------
  BUGFIX MODE
---------------------------------------------

  You chose: FIX A BUG

  Bugfix specs use a streamlined path:

---------------------------------------------

  BUGFIX ANALYSIS
      > Current Behavior -- what's broken
      > Expected Behavior -- the fix
      > Unchanged Behavior -- regression guardrails

           |
           v

  TASKS -- fix + regression tests

           |
           v

  IMPLEMENTATION

           |
           v

  VALIDATE IMPLEMENTATION -- required integration gate

           |
           v

  RETROSPECTIVE -- required workflow close

      Design phases skipped automatically.

---------------------------------------------

  NOTE: The Unchanged Behavior section is what makes
  bugfix specs powerful -- every item becomes a
  regression test. No more "fix one thing, break
  another."

  One more question, then I create the spec files...
```

**If user selects Pay Down Tech Debt / Chore, display this Tech Debt / Chore Mode summary (with the
inferred classification from above filled into the `Classified as:` line) before proceeding to Step 4:**

```
---------------------------------------------
  TECH DEBT / CHORE MODE
---------------------------------------------

  You chose: PAY DOWN TECH DEBT / CHORE
  Classified as: <CHORE | TECH DEBT> -- <one-line reason from the description>

  Tech debt / chore specs use a focused path:

---------------------------------------------

  REQUIREMENTS
      > Current State -- what exists today
      > Desired State -- the improvement
      > Constraints -- backward compat, migration

           |
           v

  DESIGN (optional)
      > Only if architectural changes needed

           |
           v

  TASKS -- refactor steps + verification

           |
           v

  IMPLEMENTATION

           |
           v

  VALIDATE IMPLEMENTATION -- required integration gate

           |
           v

  RETROSPECTIVE -- required workflow close

      Design phase is optional -- you choose
      in the next step.

---------------------------------------------

  NOTE: Tech debt specs are great for refactors,
  performance optimization, and structural cleanup
  that needs a design judgment call. Chores are for
  mechanical, no-judgment upkeep -- version bumps,
  renames, config/log tweaks -- and land in a
  separate `chores/` category with no design tax.

  Proceeding to artifact selection...
```

### Step 3: Workflow Approach (Question 2 -- features only)

**Print the header** (plain text, no markdown formatting):

```
---------------------------------------------
  STEP 2 OF 4 -- WHERE DO YOU START?
---------------------------------------------

  You chose: BUILD A FEATURE

---------------------------------------------
```

**Then ask with `AskUserQuestion`** (closed question -- tool, not a `Type 1 or 2:` prompt):

- `header`: `Start point`
- `question`: `Where do you want to start?` -- append the note: *Requirements first if you know WHAT but not HOW; design first if you already have the architecture in your head or you're porting an existing design.*
- `multiSelect`: `false`
- Options:

| id | label | description |
|---|---|---|
| `s-req` | `Requirements first (Recommended)` | Gather what you need, then design how to build it |
| `s-design` | `Technical design first` | Sketch the architecture, then derive requirements from it |

**Handle response:** map on the `id`, not the label string.
- `s-req`: Record `workflow: "requirements-first"` -> Continue to Step 4
- `s-design`: Record `workflow: "design-first"` -> Continue to Step 4
- **Unmapped answer** (harness-appended "Other"): if it clearly restates one of the two ids, treat it as that id; otherwise re-ask once, then STOP rather than defaulting. **Never** record a `workflow` or continue to Step 4 on an unmapped answer -- a silently-defaulted workflow mis-routes the whole spec.

### Step 4: Artifact Selection (Question 3 -- features only)

**Print the header** (plain text, no markdown formatting):

```
---------------------------------------------
  STEP 3 OF 4 -- DESIGN ARTIFACTS
---------------------------------------------

  You chose: [REQUIREMENTS FIRST or TECHNICAL DESIGN FIRST]

---------------------------------------------
```

**Then ask with `AskUserQuestion`** (closed question -- tool, not a `Type 1, 2, 3, 4, or 5:` prompt):

- `header`: `Design`
- `question`: `What goes into your Design phase?` -- append the note: *HLD lets you review the architecture before committing to implementation details; LLD gives precise interfaces and contracts your team can build from without ambiguity; Research is useful when evaluating unfamiliar APIs or comparing technologies. To skip design entirely and go straight from requirements to tasks, choose Other and say "none".*
- `multiSelect`: `false`
- Options:

| id | label | description |
|---|---|---|
| `d-both` | `HLD + LLD (Recommended)` | Full design -- architecture AND detailed contracts |
| `d-hld` | `HLD only` | Architecture, flows, component overview -- skip the detail |
| `d-lld` | `LLD only` | Interfaces, data models, contracts -- skip the big picture |
| `d-both-research` | `HLD + LLD + Research` | Full design + external API investigation and benchmarks |

**Why four and not five:** `AskUserQuestion` caps options at 4, and *skip design entirely* is the rare, discouraged choice (it already triggers a warning below). It reaches you through the harness-appended "Other" free-text -- which the question text points at explicitly. Do NOT hand-author a fifth option or an "Other" option.

**Handle response:** map on the `id`. **Never match on the label string here** -- `HLD + LLD` is a prefix of `HLD + LLD + Research`, so a substring/prefix comparison would silently confuse `d-both` with `d-both-research` and flip `research`, which in turn changes the pruned `approvals` written to spec.json. Resolve the returned label to its row's `id` by exact comparison against the labels you sent (including any ` (Recommended)` suffix), then act on the `id`.
- Map the `id` to artifact flags:
  - `d-both`: `design_hld: true, design_lld: true, research: false`
  - `d-hld`: `design_hld: true, design_lld: false, research: false`
  - `d-lld`: `design_hld: false, design_lld: true, research: false`
  - `d-both-research`: `design_hld: true, design_lld: true, research: true`
  - `d-none` -- reached only via "Other" answering *none* / *skip design* / equivalent: `design_hld: false, design_lld: false, research: false`
- If the answer arrived via "Other" and is not recognizably one of the five ids above, re-ask once rather than guessing.
- If design is skipped entirely, display a warning: "No design artifacts selected. The workflow will go directly from requirements to tasks. This is fine for simple features but may result in less structured implementation."
- Continue to Step 5

### Step 5: Commit Policy (Question 4 -- every spec type)

Decides who makes the git commits when `/kiro:impl` or `/kiro:impl-fast` later implements this spec.
Ask this for **every** spec type (feature, bugfix, tech-debt, chore) -- both implementation skills read it.

**Ask with `AskUserQuestion`** (closed question -- tool, not a `Type 1 or 2:` prompt):

- `header`: `Commits`
- `question`: `How should Kiro handle commits?`
- `multiSelect`: `false`
- Options:

| id | label | description |
|---|---|---|
| `c-per-task` | `Commit after each task (Recommended)` | Kiro commits each verified task |
| `c-none` | `Leave changes uncommitted` | You review and commit all changes yourself |

**Handle response:** map on the `id`, not the label string.
- `c-per-task`: Record `commit_policy: "per-task"` -> Continue to Step 6
- `c-none`: Record `commit_policy: "leave-uncommitted"` -> Continue to Step 6
- **Unmapped answer** (harness-appended "Other"): if it clearly restates one of the two ids, treat it as that id; otherwise re-ask once. If it is still unmapped, record `commit_policy: "per-task"` and say so in one line: *"Could not read your commit preference -- defaulting to per-task commits. Override on the run itself with `/kiro:impl {feature} --no-commit`."* Defaulting is safe here (it is the pre-existing behavior and `git reset --soft` undoes it), so this question never blocks spec creation -- unlike `spec_type`/`workflow`, where a silent default mis-routes the whole spec.

### Step 6: Generate Feature Name and Path

- Generate a unique feature name from the project description (from brief.md if available, otherwise $ARGUMENTS with `--no-triage` stripped)
- Generate date prefix: current date in `YYYY-MM-DD` format (e.g., `2026-05-27`)
- Determine category based on spec_type:
  - `spec_type: "feature"` → category is `features`
  - `spec_type: "bugfix"` → category is `bugs`
  - `spec_type: "tech-debt"` → category is `tech-debt`
  - `spec_type: "chore"` → category is `chores`
- Full directory name: `YYYY-MM-DD-<feature-slug>` (e.g., `2026-05-27-webhook-support`)
- Full spec path: `.kiro/specs/<category>/YYYY-MM-DD-<feature-slug>/`
- Record `spec_path` as `<category>/YYYY-MM-DD-<feature-slug>` for writing to spec.json
- Verify path doesn't already exist
- **Backward compatibility**: If `.kiro/specs/{feature-name}/brief.md` exists (old flat structure from discovery), move or reference it. Check `specs/{feature-name}/`, `specs/features/{feature-name}/`, `specs/bugs/{feature-name}/`, `specs/tech-debt/{feature-name}/`, and `specs/chores/{feature-name}/`
- If a naming conflict exists, append numeric suffix (e.g., `feature-name-2`) and notify user

### Step 7: Create Directory
- `.kiro/specs/<category>/YYYY-MM-DD-<feature-slug>/` (using the categorized path from Step 6)
- Create intermediate category directory (`features/`, `bugs/`, `tech-debt/`, or `chores/`) if it doesn't exist
- Ensure `.kiro/learnings/` directory exists (create if not present). This is the project-level directory for cross-spec patterns.
- Skip if already exists from discovery (after moving brief.md to the new path)

### Step 8: Initialize Files Using Templates

The `init.json` template ships with the **maximal** `artifacts` and `approvals` shape (every phase enabled). It is a starting point, NOT the literal output. You MUST prune both objects down to the phases this spec actually uses, so spec.json never advertises documents the user opted out of (e.g. an LLD-only spec must not carry `design_hld` or a combined `design` entry).

**Common placeholder replacements (all spec types):**
- `{{FEATURE_NAME}}` -> generated feature name
- `{{SPEC_PATH}}` -> recorded spec_path from Step 6 (e.g., `features/2026-05-27-webhook-support`)
- `{{TIMESTAMP}}` -> current ISO 8601 timestamp
- `{{PROJECT_DESCRIPTION}}` -> from brief.md if available, otherwise $ARGUMENTS (with `--no-triage` stripped)
- `en` -> language code (detect from user's input language, default to `en`)
- `{{WORKFLOW}}` -> recorded workflow ("requirements-first" or "design-first"; "requirements-first" for bugfix/tech-debt/chore)
- `commit_policy` -> the value recorded in Step 5 (`"per-task"` or `"leave-uncommitted"`). Write it for every spec type. `/kiro:impl` and `/kiro:impl-fast` read this field to decide whether they commit each task or leave the working tree for the developer; when it is absent (specs created before this field existed) both default to `"per-task"`.
- `required_gates` -> write for every spec. For `feature`, `tech-debt`, and complex `bugfix` specs with a design artifact, set `design_review: true`; for bugfixes with no design set `design_review: false`. Set `impl_validation: true` and `retrospective: true` for `feature`, `tech-debt`, and `bugfix` specs. For `chore`, keep `impl_validation` and `retrospective` true when implementation tasks are enabled, and set `design_review` only when a design artifact is enabled.
- `implementation_mode` -> keep the template default `"standard"`. Set `"fast"` ONLY when the spec is clearly **low-risk and non-behavioral** (e.g. config/yaml entries, DTO/response-shape additions, copy changes, dependency bumps, a chore, scoped tech-debt with no money/auth/IO/behavioral surface). This is a router hint: it lets the lifecycle "Next step" surface `/kiro:impl-fast` as a secondary option. When in doubt, leave it `"standard"` — never set `"fast"` for behavioral, cross-cutting, or money/auth/payment/IO-critical work.
- `affected_repos` -> only if Step 1 classified this as a **Satellite** multi-repo case (this repo heavy, others light): add `affected_repos: [{ "repo": "<name>", "weight": "light", "why": "<reason this repo is touched>" }, …]` for each light repo. **Omit the field entirely** for single-repo specs. Satellite `spec-link.md` files in those repos are created automatically by `/kiro:impl` / `/kiro:impl-fast` (or manually via `/kiro:spec-link`) — never written from this run (see `multi-repo-linkage.md`).


**For Bugfix specs:**
- Read `templates/specs/init.json` from this skill's directory (repo override: `.kiro/settings/templates/specs/init.json`)
- Read `templates/specs/bugfix-init.md` from this skill's directory (repo override: `.kiro/settings/templates/specs/bugfix-init.md`)
- Apply the common placeholder replacements; set `{{SPEC_TYPE}}` -> "bugfix"
- Set `artifacts`: `requirements: false`, `bugfix_analysis: true`, `design_hld: false`, `design_lld: false`, `research: false`, `tasks: true`
- Set `required_gates`: `design_review: false`, `impl_validation: true`, `retrospective: true`. If a later complexity gate enables `artifacts.design_hld`, that command must also flip `required_gates.design_review` to `true`.
- Prune `approvals` per the rule below
- Write `spec.json` and `bugfix.md` to spec directory

**For Tech Debt / Chore specs:**
- Read `templates/specs/init.json` from this skill's directory (repo override: `.kiro/settings/templates/specs/init.json`)
- Read `templates/specs/requirements-init.md` from this skill's directory (repo override: `.kiro/settings/templates/specs/requirements-init.md`)
- Apply the common placeholder replacements; set `{{SPEC_TYPE}}` -> whichever was inferred and shown in the mode summary — `"tech-debt"` or `"chore"`. Never hardcode one; this is the one branch that produces two different `spec_type` values from a single selected option.
- Build `artifacts` from the Step 4 selection (same as Feature specs)
- Set `required_gates.design_review` to `true` when `design_hld` or `design_lld` is enabled; set `required_gates.impl_validation: true` and `required_gates.retrospective: true`.
- Prune `approvals` per the rule below
- Write `spec.json` and `requirements.md` to spec directory

**Approvals pruning rule (apply to every spec type):**

`spec-init` produces the granular (split) design workflow, so the `approvals` object must contain ONLY the entries for phases this spec will actually run. Start from an empty object and add entries — never copy the template's full `approvals` block verbatim. Each kept entry keeps its `{ "generated": false, "approved": false }` value.


**Worked example — LLD only (Step 4 option 3), feature, requirements-first:**

```json
"artifacts": {
  "requirements": true,
  "bugfix_analysis": false,
  "design_hld": false,
  "design_lld": true,
  "research": false,
  "tasks": true
},
"approvals": {
  "requirements": { "generated": false, "approved": false },
  "design_lld": { "generated": false, "approved": false },
  "tasks": { "generated": false, "approved": false }
}
```

Note there is no `design`, `design_hld`, or `research` noise — the spec.json reflects exactly what was selected.

### Step 8.5: Record command fired and stamp plugin version (deterministic)

Right after `spec.json` is written, record this skill invocation in `spec.json.commands_fired`. Run:

```bash
python3 "${CLAUDE_SKILL_DIR}/scripts/record-command-fired.py" "<resolved spec dir>" "kiro-spec-init" "init"   # or `python`
```

Read `rules/command-tracking.md` for the field shape. The script appends one entry and fails open.

Right after `spec.json` is written, record the plugin version in use **beside** it, so every PR for this
spec surfaces which kiro plugin version produced the work (adoption tracking across consumers). Run:

```bash
python3 "${CLAUDE_SKILL_DIR}/scripts/stamp-plugin-version.py" "<resolved spec dir>"   # or `python` if python3 is absent
```

where `<resolved spec dir>` is the categorized dated path from Step 6
(`.kiro/specs/<category>/YYYY-MM-DD-<feature-slug>/`). The script writes a single
`kiro-plugin-version-<version>.md` next to `spec.json` (filename encodes the version), prunes any older
version marker, and is a no-op when the version is unchanged (no git churn). It fails open: if the
script or a Python runtime is unavailable, **skip it — never block spec creation**.





### Step 9: Journey Summary

**Display the journey summary using this EXACT plain-text format (no markdown bold/italic -- use UPPERCASE and emoji only). Adapt based on actual spec type, workflow, and artifact selections.**

**Load `rules/lifecycle-navigation.md` from this skill's directory to compute the journey path.**

**For Feature specs, use this template:**

```
---------------------------------------------
  SPEC CREATED: [feature-name]
---------------------------------------------

  CONFIGURATION
  | Type:      Feature
  | Workflow:  [Requirements First / Design First]
  | Artifacts: HLD [Y/N]  LLD [Y/N]  Research [Y/N]
  | Commits:   [Per task / Left uncommitted (you commit)]

  YOUR JOURNEY
  |
  | 1. /kiro:spec-[first-command] [feature-name]
  |    [description]
  |
  | 2. /kiro:spec-[second-command] [feature-name]
  |    [description]
  |
  | [... only show enabled phases ...]
  |
  | N. /kiro:impl [feature-name]
  |    Implement
  |
  | N+1. /kiro:validate-impl [feature-name]
  |      Required integration gate before merge / success claim
  |
  | N+2. /kiro:retrospective [feature-name]
  |      Required workflow close while session evidence is fresh

  FLAGS (optional — add deliberately, never by habit)
  | -y                 on a spec-design*/spec-tasks command: auto-approve the upstream
  |                    gate and skip your review. Fast-track for low-risk specs only.
  |                    Default (no -y) = you review each artifact before approving.
  | impl vs impl-fast  impl = TDD per task (default, behavioral/critical work).
  |                    impl-fast = build+review once (config/DTO/non-behavioral only).
  | --review inline    on impl: turn per-task review ON (it is OFF by default); use for
  |   |required        behavioral / money / auth / IO changes.
  | --commit           on impl/impl-fast: override this spec's Commits setting for one
  |   |--no-commit     run. --commit = commit each task; --no-commit = leave it all
  |                    uncommitted for you to stage and commit.
  | --validate         on impl/impl-fast: run the required validate-impl gate immediately;
  |                    default = the command prints validate-impl as the next gate.

---------------------------------------------

  CREATED FILES
  | [spec-dir]/spec.json
  | [spec-dir]/requirements.md

  TRACKING (created on demand during spec lifecycle)
  | decisions.md       -- when you choose between approaches
  | learnings.md       -- when AI output is corrected
  | gap-analysis.md    -- written by /kiro:validate-gap
  | design-review.md   -- written by /kiro:validate-design
  | impl-validation.md -- written by /kiro:validate-impl
  | feedback-*.md      -- written by /kiro:retrospective
  | skill-improvements-*.md -- written by /kiro:retrospective

  NEXT: /kiro:spec-[first-command] [feature-name]
```

**For Bugfix specs, use this template:**

```
---------------------------------------------
  SPEC CREATED: [feature-name]
---------------------------------------------

  CONFIGURATION
  | Type:      Bugfix
  | Path:      Bugfix Analysis -> Tasks -> Implementation -> Validate Impl -> Retro
  | Commits:   [Per task / Left uncommitted (you commit)]

  YOUR JOURNEY
  |
  | 1. /kiro:spec-requirements [feature-name]
  |    Bugfix analysis (current/expected/unchanged)
  |
  | 2. /kiro:spec-tasks [feature-name]
  |    Generate fix + regression tasks
  |
  | 3. /kiro:impl [feature-name]
  |    Implement
  |
  | 4. /kiro:validate-impl [feature-name]
  |    Required integration gate before merge / success claim
  |
  | 5. /kiro:retrospective [feature-name]
  |    Required workflow close while session evidence is fresh
  |
  | FLAGS: add -y to spec-tasks to auto-approve + skip review (fast-track only;
  |        default = you review first). impl review is OFF by default — add
  |        --review inline for risky fixes. --commit / --no-commit on impl
  |        overrides the Commits setting above for one run. --validate runs the
  |        required validate-impl gate immediately after implementation.

---------------------------------------------

  CREATED FILES
  | [spec-dir]/spec.json
  | [spec-dir]/bugfix.md

  TRACKING (created on demand during spec lifecycle)
  | decisions.md       -- when you choose between approaches
  | learnings.md       -- when AI output is corrected
  | gap-analysis.md    -- written by /kiro:validate-gap
  | design-review.md   -- written by /kiro:validate-design
  | impl-validation.md -- written by /kiro:validate-impl
  | feedback-*.md      -- written by /kiro:retrospective
  | skill-improvements-*.md -- written by /kiro:retrospective

  NEXT: /kiro:spec-requirements [feature-name]
```

**Only show enabled phases in the journey. Replace [feature-name] with the actual generated name. Use the actual file paths.**


## Important Constraints
- Do NOT generate requirements, design, or tasks. This skill only creates spec.json and requirements.md (or bugfix.md).
- Follow stage-by-stage development principles.
- Maintain strict phase separation.
- Triage and guided questions are advisory -- the user makes the final choice.
</instructions>

## Tool Guidance
- Use **Grep** to scan codebase during triage (search for key terms from description)
- Use **Glob** to check existing spec directories for name uniqueness and to estimate codebase blast radius
- Use **Read** to fetch templates: `init.json`, `requirements-init.md` (or `bugfix-init.md`), `triage-criteria.md`, `lifecycle-navigation.md`, and `brief.md` if present
- Use **Write** to create spec.json and requirements.md (or bugfix.md) after placeholder replacement
- Perform validation before any file write operation

## Output Description
Provide output in the language specified in `spec.json` with the following structure:

### If Triage Recommends "Skip SDD" or user selects "Quick Change":
1. **Result**: Reasoning (2-3 sentences)
2. **Actionable Advice**: What to do instead
3. **Override**: Mention `--no-triage` flag if user disagrees

### If Triage Recommends "Multi-Spec":
1. **Result**: Reasoning (2-3 sentences)
2. **Suggested Breakdown**: Spec names, descriptions, ordering, dependencies
3. **Next Steps**: Commands to run `/kiro:spec-init --no-triage` for each

### If Spec is Created (Single Spec / Feature / Bugfix):
1. **Journey Summary** (as described in Step 9)
2. **Created Files**: Bullet list with full paths
3. **Next Step**: Exact command to run

**Format Requirements**:
- Use plain text with UPPERCASE for titles and option names (NOT markdown bold/italic -- raw ** and _ characters show in terminal)
- Use minimal emoji for key markers only
- Use dash lines for section boundaries
- These format rules govern **output the user reads** (banners, summaries, journey maps) -- NOT how questions are asked. Every closed question goes through `AskUserQuestion` per `rules/interaction-style.md`; never render one as a numbered ASCII menu the user has to type into.
- Keep total output concise (under 400 words per step)
- Use clear, professional language per `spec.json.language`

## Safety & Fallback
- **Ambiguous Feature Name**: If feature name generation is unclear, propose 2-3 candidate names via `AskUserQuestion` (`header`: `Spec name`) and let the user pick
- **Template Missing**: If template files don't exist in `templates/specs/` (this skill's directory), report error with specific missing file path and suggest reinstalling the kiro plugin
- **Directory Conflict**: If feature name already exists, append numeric suffix (e.g., `feature-name-2`) and notify user of automatic conflict resolution
- **Write Failure**: Report error with specific path and suggest checking permissions or disk space
- **Triage Rules Missing**: Warn and skip triage (proceed with spec type selection)
- **Lifecycle Navigation Missing**: Warn and compute journey manually based on selections
- **Codebase Scan Failure**: Proceed with description-only triage analysis
- **Ambiguous Triage**: Default to "Single Spec" with a note
