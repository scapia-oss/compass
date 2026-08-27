# Lifecycle Navigation

## Purpose
Single source of truth for computing the next step, detecting out-of-order execution, displaying progress indicators, and generating self-skip messages across all spec lifecycle commands.

## Phase Ordering by Workflow

### Requirements-First (feature)



### Design-First (feature)



### Bugfix

```text
bugfix_analysis → [design_hld → validate_design] → tasks → implementation → validate_impl → retrospective
```


### Mandatory Gate Policy

New specs carry `required_gates`:

```json
"required_gates": {
  "design_review": true,
  "impl_validation": true,
  "retrospective": true
}
```

- `design_review`: run `/kiro-validate-design {feature}` before tasks when a design artifact exists
  (`design`, `design_hld`, or `design_lld`). Bugfixes without design skip it; complex bugfixes with design run it.
- `impl_validation`: run `/kiro-validate-impl {feature}` after implementation for feature, tech-debt, and bugfix specs.
- `retrospective`: run `/kiro-retrospective {feature}` after implementation validation. Workflow is not complete until retro writes feedback.

Every handoff/status must show the next gate as expected work, not optional prose.

## Research Toggle Semantics

The `artifacts.research` flag controls whether **discovery** findings are persisted to `research.md`:
- **research: true** — Discovery findings are written to `research.md` during the design discovery phase.
- **research: false** — Discovery still executes (findings inform the design), but its results stay in the AI's working context and are NOT written to `research.md`.

- **research: true BUT all design artifacts disabled** — Research has no effect. Discovery only runs as part of design commands; no design commands means no discovery, which means no research output.

**Exemption — the "Codebase Grounding" section is NOT governed by this flag.** The design files carry no
current-state section, so that section is the only durable record of how the system works today, and
`spec-design-lld` reads it as its reality trace without re-running discovery. It is written whenever
grounding ran, at **either** value of the flag; with `research: false` the skill still creates/updates
`research.md` holding that section alone. See the **codebase-grounding** rule → "The grounding log is
EXEMPT from the `artifacts.research` toggle". This matters because `research: false` is the default
(`init.json`) and the common `spec-init` choice.

Design commands (`spec-design-hld`, `spec-design-lld`, `spec-design`) check `artifacts.research` in their discovery step to decide whether to persist findings.

## Next-Step Algorithm

Given: `current_phase`, `workflow`, `artifacts`


### Command Mapping


Commands here are **bare on purpose** — see "Flag Discipline" below. Never emit a next-step command with `-y`
(or any approval-skipping flag) pre-filled.

### Implementation handoff (`impl` vs `impl-fast`)

When the computed next step is `implementation`, never print a lone `impl` line: present **both**
commands so the engineer chooses deliberately, plus the optional-flags footer, and never pre-fill `-y`.
`impl {feature}` stays **primary** even when `spec.json.implementation_mode == "fast"` — `impl-fast`
defers all verification to the end, so it is always an explicit opt-in. When `commit_policy` is
`"leave-uncommitted"`, say so in the handoff so a clean `git log` is not a surprise (`--commit` /
`--no-commit` override it for one run).

The full ready-to-print block — both commands with when-to-use, and the flags footer — lives in
`lifecycle-impl-handoff.md`, bundled into the skill that emits this handoff. Read it when it is
present in your skill's `rules/` dir; otherwise emit the compact form above.

After implementation, print `validate-impl {feature}` as the required next gate. After `validate-impl` GO,
print `retrospective {feature}` as the required workflow close.

## Flag Discipline (BINDING for every next-step suggestion)

A suggested command is something the engineer **copies and pastes**. If you pre-fill an approval-skipping flag
(`-y`, `--auto`), they paste it without thinking — and the human review gate that the whole 3-phase workflow exists
to enforce is silently skipped, every time, by reflex. Observed in the field: engineers carrying `-y` into every
command because the tool always showed it.

**Rules:**
1. **Always emit the BARE command** for copy-paste — never with `-y`/`--auto` baked in. This holds for the
   "Next step" line, the progress-indicator `Next step:`, self-skip messages, and every "Suggested Action" / "Or…"
   alternative a skill prints.
2. **Educate directly below the command** with a compact, optional-flags footer (template below) — so the engineer
   makes a *deliberate* choice to fast-track instead of pasting `-y` by habit.
3. The bare command is the **safe default**: it stops at the human review gate so the engineer reviews the generated
   artifact before approving the next phase. `-y` is the **exception**, chosen consciously, not the default.

**Footer template** (print immediately under the suggested command; include only the flags that apply to *that*
command):

```
Next step:  spec-design {feature}
   ⚙ optional flags — add only if you mean it:
     -y   auto-approve the upstream gate and skip your review of the generated artifact.
          Use for an intentional fast-track on a low-risk/throwaway spec you trust.
          Default (no flag) = you review the output, then approve before the next phase.
```

**Flags reference (what each does · when to use):**

| Flag | Commands | Effect | Use when | Default (omit) |
|------|----------|--------|----------|----------------|
| `-y` | `spec-design`, `spec-design-hld`, `spec-design-lld`, `spec-tasks` | Auto-approves the upstream phase gate(s) this command depends on; runs without pausing for your approval | Intentional fast-track on a low-risk spec you're confident in | Stops at the gate so you review + approve the generated artifact first |
| `--auto` | `spec-quick` | Runs all phases (requirements→design→tasks) end-to-end with no stops | Throwaway/prototype specs, or scope you fully trust | Interactive — pauses at each phase |
| `--review required\|inline\|off` | `impl` | Per-task code review mode: `required` = fresh reviewer subagent each task; `inline` = review in main context; `off` = no per-task review (TDD + `kiro-verify-completion` + `validate-impl` still gate) | **Turn it ON** (`inline` or `required`) for behavioral / money / auth / IO-critical changes; `required` for the riskiest | `off` (review is opt-in) — fast; `validate-impl` is the standing gate |
| `--validate` | `impl` / `impl-fast` | Runs `validate-impl` immediately after implementation | You want the mandatory feature-level gate in the same command run | If omitted, the command must print `validate-impl` as the next gate |
| `--impl-model sonnet\|opus` | `impl` | Code-generation model for implementer subagents | `opus` for max quality on hard logic; `sonnet` to keep cost down | `sonnet` |
| `--no-tests` | `impl-fast` | Skips TDD | Config/DTO/non-behavioral edits only | Tests run |
| `--sequential` | `spec-tasks` | Disables parallel-task markers | Forcing strict sequential execution | Parallel where safe |

Review is **off by default**, so for a behavioral / money / auth / IO-critical change you must actively recommend
turning it **on** (`--review inline` or `--review required`) rather than letting it stay off — and never pre-fill
`-y` on the upstream phases for such a change either.

## Out-of-Order Detection

Given: `attempted_phase`, `workflow`, `artifacts`

1. Look up the phase ordering for the workflow.
2. Find `attempted_phase` in the ordering.
3. Check if all preceding enabled phases are complete (approved in spec.json).
4. If any prerequisite is incomplete, generate a nudge message:
   - "Your workflow is [workflow]. Consider running [prerequisite command] first. Proceed anyway? (y/n)"
5. Allow the user to proceed if they confirm — nudges are advisory, not blocking.

## Progress Indicator Format

After each phase completes, display:

```
Phase N/M complete: [Phase1] ✓ → [Phase2] ✓ → [Phase3] → [Phase4]
Next step: [exact command]
```

Where:
- `N` = number of completed phases
- `M` = total enabled phases (excluding skipped)
- `✓` = completed
- `⏳` = in progress
- `○` = upcoming
- `⊘` = skipped (artifact disabled)

## Self-Skip Message Format

When a command detects its artifact is disabled:

```
⊘ [Phase name] is disabled for this spec.
Your next step is: [exact command computed by next-step algorithm]
```

When a command detects bugfix spec type:

```
⊘ [Phase name] skipped for bugfix specs.
Your next step is: [exact command]
```

## Backward Compatibility

When `spec_type`, `workflow`, or `artifacts` fields are missing from spec.json:
- Default `spec_type` to `"feature"`
- Default `workflow` to `"requirements-first"`
- Default all artifacts to enabled (`true`)
- Display classic behavior (no lifecycle-specific output)


**Linked (satellite) specs.** A spec.json with `kind: "linked-spec"` (`role: satellite`, `phase:
"linked"` — see `multi-repo-linkage.md`) has **no lifecycle phases of its own**: the next-step
algorithm runs nothing on it. It is a pointer to a spec owned by another repo; `/kiro-spec-status`
surfaces that parent pointer instead of a phase progression.

## Worked Examples

- Path A — req-first, HLD+LLD: `spec-init → spec-requirements → spec-design-hld → spec-design-lld → validate-design → spec-tasks → impl → validate-impl → retrospective`
- Path B — req-first, HLD only: `spec-init → spec-requirements → spec-design-hld → validate-design → spec-tasks → impl → validate-impl → retrospective`
- Path C — req-first, LLD only: `spec-init → spec-requirements → spec-design-lld → validate-design → spec-tasks → impl → validate-impl → retrospective`
- Path D — req-first, no design: `spec-init → spec-requirements → spec-tasks → impl → validate-impl → retrospective`
- Path E — design-first, HLD+LLD: `spec-init → spec-design-hld → spec-design-lld → spec-requirements → validate-design → spec-tasks → impl → validate-impl → retrospective`
- Path F — design-first, HLD only: `spec-init → spec-design-hld → spec-requirements → validate-design → spec-tasks → impl → validate-impl → retrospective`
- Path G — design-first, LLD only: `spec-init → spec-design-lld → spec-requirements → validate-design → spec-tasks → impl → validate-impl → retrospective`
- Path H — bugfix: `spec-init → spec-requirements (bugfix mode) → spec-tasks → impl → validate-impl → retrospective`; complex bugfixes add design/review before tasks.
