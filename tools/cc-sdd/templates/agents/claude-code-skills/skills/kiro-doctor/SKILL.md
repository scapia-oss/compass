---
name: kiro-doctor
description: Diagnose a kiro plugin setup — verify the repo is wired correctly (.kiro/ layout, steering, optional settings overrides), the environment is sane (node, marker dir), and report the installed plugin/hooks/scripts. Use when "/kiro:* commands aren't working", "is kiro set up right", "hooks not firing", or after installing/updating the kiro plugin. For consumers of the plugin, not framework maintainers.
allowed-tools: Bash, Read, Glob
disable-model-invocation: true
metadata:
  shared-rules: "gradle-performance.md"
  shared-scripts: "doctor.mjs, kiro-gate.mjs, common.mjs"
---

# kiro-doctor Skill

Health-check a **consumer's** kiro plugin setup and report exactly what is wired, what is missing,
and the fix for each problem. Hybrid: a deterministic script does the mechanical checks; you (the
skill) interpret them, add judgment checks the script can't make, and produce the fix guidance.

## What this CAN and CANNOT verify (state these honestly in your output)
- **CAN**: repo wiring (`{{KIRO_DIR}}/` layout, steering present, and any OPTIONAL `{{KIRO_DIR}}/settings/`
  overrides — including whether an override has drifted from the current plugin template; absent settings
  is the normal default since skills bundle their own rules/scripts/templates), spec.json validity
  (reusing the kiro-gate validator), environment (node version for the gate scripts + doctor itself;
  python3 for the hooks, incl. the version-manager/non-interactive-shell trap; marker dir writable), and
  a best-effort report of the installed plugin version / hooks / scripts (incl. whether each hook
  command resolves to a real script), and — on Gradle repos — an **advisory** build-performance audit
  (untuned `gradle.properties`, config-time token calls, test parallelism) that explains why the
  `impl` RED/GREEN gates may be slow.
- **CANNOT**: prove a hook *actually fires* at runtime (that is Claude Code-internal). It uses the
  presence of the installed plugin's hooks/scripts as the proxy. And it is **unreachable if no skill loads at all** — if `/kiro:*`
  commands don't even appear, the plugin isn't installed/enabled: check `/plugin` and the README,
  this skill can't help in that state.
- **Does NOT** detect "you're behind latest" — a bundled doctor ships inside the version it reports,
  so it cannot know a newer version exists. It prints the installed version; compare with the marketplace.

## Procedure

### 1. Run the deterministic checks
```bash
node "${CLAUDE_SKILL_DIR}/scripts/doctor.mjs"
```
This prints a grouped PASS/WARN/FAIL/SKIP report (Environment, Repo wiring, Plugin) and exits non-zero
if any check FAILs. Show the user the report verbatim.

**Degrade gracefully** if the script can't run (no `node`, or `${CLAUDE_SKILL_DIR}` unset / script
missing): do NOT stop. Fall back to the manual prose checklist below using your own tools and say you
ran the fallback.

Prose fallback checklist (only if the script is unavailable):
- `node --version` resolves (the gate scripts + this doctor need node).
- `python3 --version` (or `python`) resolves (the hooks — git-guard, feedback-capture, session-init —
  are pure-stdlib Python 3; without it they silently fail open).
- `{{KIRO_DIR}}/` exists in the project root; `{{KIRO_DIR}}/steering/*.md` present.
- `{{KIRO_DIR}}/settings/` is OPTIONAL — it holds user overrides of bundled defaults. Absent is the
  normal, healthy default (skills bundle their own rules/scripts/templates and resolve them from the plugin).
- `{{KIRO_DIR}}/specs/` structure is sane; `{{KIRO_DIR}}/learnings/` may be empty or not yet exist — consuming skills glob-all `{{KIRO_DIR}}/learnings/*.md`, so this is fine either way.

### 2. Interpret and give fixes
For each WARN/FAIL, restate the script's `fix:` in context. The common ones:
- **`settings overrides`** → informational, never a failure. "none — using plugin defaults" is healthy
  (skills are self-contained); "present" just means you keep local overrides under `{{KIRO_DIR}}/settings/`.
- **`{{KIRO_DIR}}/ present` = FAIL** → not a kiro repo or wrong directory; run `/kiro:steering` or
  `/kiro:spec-init`.
- **`hooks wired` missing `UserPromptSubmit`** → the install predates the feedback-capture hook;
  update the plugin (`/plugin update kiro`) — version-gated, so an old install won't have it.
- **`hook scripts present` / `hook commands resolve` = WARN** → partial install; reinstall via `/plugin`.
- **`settings overrides up-to-date` = WARN** → a file you override under `{{KIRO_DIR}}/settings/` differs
  from the current plugin template. Intentional if you meant to override it; otherwise re-copy that file
  from the installed plugin. (Skipped entirely when you keep no overrides.)
- **`python reachable for hooks` = WARN** → either no python3/python on PATH (the hooks fail open — the
  git-guard safety net and learning capture are OFF), or python resolves via pyenv/asdf and the
  non-interactive hook shell may not load it. Install a system python3 (e.g. Homebrew) or make the hook
  shell source the version manager.
- **`spec.json validity` = WARN** → a spec's metadata is malformed/incoherent; re-run the relevant
  `/kiro:spec-*` phase or correct `phase`/`approvals`/`artifacts`.

### 3. Judgment checks the script can't make (do these yourself)
- **Steering is meaningful, not stubs**: skim `{{KIRO_DIR}}/steering/*.md` — are product/tech/structure
  actually filled in, or still template placeholders? Stub steering loads but gives the skills nothing.
- **spec.json coherence**: for each spec under `{{KIRO_DIR}}/specs/`, does `spec.json` parse and is its
  `phase`/`approvals` self-consistent? (Surface obviously stuck/broken specs; do not fix them here.)
- **Custom steering is loadable**: if there are steering files beyond product/tech/structure, note them
  so the user knows the consuming skills will load them (they load all of `{{KIRO_DIR}}/steering/*.md`).

### 3a. Gradle build-health audit (only if the repo is Gradle)
If a `build.gradle`/`build.gradle.kts` exists at the repo root, the `impl`/`impl-fast` RED & GREEN
gates are gated by Gradle — a slow/untuned build is the #1 reason those gates feel slow. Read
`rules/gradle-performance.md` (section C) and audit the repo's `gradle.properties`, root + module
`build.gradle(.kts)`, `settings.gradle(.kts)`, and `gradle/wrapper/gradle-wrapper.properties` against
checks C1–C9. Report each applicable finding as `<severity>: <check> — <one-line fix>` under a
**Gradle build-health** group, and end with a one-line takeaway naming the top win.
This audit is **advisory** (never changes the HEALTHY/USABLE/NEEDS_ATTENTION verdict) and **read-only**
(instruct the fix; never edit the consumer's build files). Skip this section silently for non-Gradle repos.

### 4. Verdict
Emit a short consolidated verdict: `HEALTHY` (no FAIL), `USABLE` (warnings only), or
`NEEDS_ATTENTION` (≥1 FAIL), followed by the ordered list of fixes. Keep it actionable.

## Constraints
- Read-only diagnosis. Do NOT modify repo files, steering, or specs — report and instruct only.
- Never claim a hook "works at runtime"; only that it is correctly wired / scripts run.
- This skill is for plugin **consumers**; framework maintainers use the repo's `cc-sdd-review` instead.
