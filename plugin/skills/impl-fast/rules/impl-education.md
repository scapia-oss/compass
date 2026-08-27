# Implementation Walkthrough (first-run education)

Goal: the **first** time a user runs `impl` / `impl-fast` on a spec, show a short visual diagram of how
the skill executes — so they understand RED/GREEN, where review & commit happen, and (on Gradle) why a
gate is slow. Keep it terminal-tight and skimmable. Emoji carry the "color"; do not emit raw ANSI codes
(they won't render in the markdown a terminal shows).

## When to show the full diagram vs a one-liner
- **First run for this spec** = `tasks.md` has **zero** `- [x]` complete tasks. Show the full diagram
  (section A or B) once, right after the model-policy banner.
- **Subsequent runs** (some tasks already `- [x]`): skip the diagram. Print a single line instead:
  `▶ Resuming /kiro:impl — milestone cycle: 🔴 RED → ✍️ code → 🟢 scoped GREEN → 🔍 review → 📦 commit, then one 🏁 full gate at the end of the run. (X/Y milestones done)`
- Always replace the example counts in the prose with the run's **real** counts in one footer line
  (e.g. `Your run: 3 milestones, 11 steps.`).
- **When the resolved `commit_policy` is `leave-uncommitted`** (spec.json, or `--no-commit`), the `📦 commit`
  line in the diagram is wrong for that run. Replace it with `📦 no commit — left in your working tree`
  (section A) or `📦 no commit — you stage and commit` (section B), and in the one-line resume reminder
  end with `→ 📦 left uncommitted` instead of `→ 📦 commit`. Everything else in the diagram is unchanged —
  the policy moves where the work is stored, not which gates run.

---

## A. `/kiro:impl` diagram (milestone TDD flow)

Print this block verbatim (fenced) on first run, then the real-count footer:

```
 /kiro:impl — one MILESTONE = one build · review · commit unit
 ───────────────────────────────────────────────────────────────
 (example shape: 3 milestones × ~4 steps — yours may differ)
 (🔴 RED opens a milestone only when the code path already exists and its
  behavior is changing, or a bugfix must reproduce first. New code writes
  its tests alongside the implementation — same gate, no RED dispatch.)

   ┌─ MILESTONE  (e.g. task 2, steps 2.1–2.4) ──────────────────┐
   │                                                            │
   │   2.1  🔴 RED     write ALL the milestone's tests first    │
   │          ⬇        parent re-runs them → WITNESSES failure  │
   │   2.2  ✍️  code    implement the steps ┐                   │
   │   2.3  ✍️  code                         │ Sonnet subagent  │
   │   2.4  🟢 GREEN   SCOPED gate: this module's tests + build │
   │          ⬇        (+ smoke only if boot/wiring changed)    │
   │   🔍 review   independent · Opus · reads the real git diff │
   │   ✔  verify   fresh-evidence completion check              │
   │   📦 commit   one commit for the whole milestone           │
   └────────────────────────────────────────────────────────────┘
        ⬇   then the next milestone, in order
   M1 ──► M2 ──► M3 ──► 🏁 RUN-CLOSING FULL GATE ──► ✅ validate
                        full build + full suite + smoke, ONCE

 Why: each milestone verifies SCOPED (seconds), and the full build +
 full suite runs ONCE per run at the end — not once per milestone.
 On a slow stack (e.g. Gradle) that is where the minutes were going.
 Trade-off: a break caused by M2 in M1's code surfaces at the 🏁 gate,
 not at M2. Dispatches per behavioral milestone: 🔴 RED + 🟢 GREEN.
```

## B. `/kiro:impl-fast` diagram (speed mode)

```
 /kiro:impl-fast — SPEED mode (low-risk changes only)
 ───────────────────────────────────────────────────────────────
   all selected tasks ─✍️─► ONE Sonnet pass   (no TDD, no per-task build)
                                  ⬇
                        ░░ END GATE — runs ONCE ░░
                          🏗️  build + test
                          🔍  review (inline)
                          ✔   verify-completion
                          📦  commit (per file-group)

 ⚠️ No RED/GREEN per task — a mistake surfaces only at the end gate.
    Behavioral / money / auth / IO-critical work → use /kiro:impl.
```

---

## C. First-run Gradle confirmation gate (only when the stack is Gradle)

On the **first run** for the spec, if the stack is Gradle (see `rules/gradle-performance.md` for
detection), after the diagram do this **once**:

1. Print a short "why optimize" note tied to the real repo, e.g.:
   ```
   🐘 Heads-up: this repo builds with Gradle, so the 🔴 RED and 🟢 GREEN steps
      wait on Gradle — that is usually the slowest part of the run, not the model.
      I keep them scoped (module + test class only) and run the full build once
      at the end of the run. A quick tune-up (parallel + build cache, avoiding a
      config-time token call) cuts minutes off what is left.
   ```
   If you already have audit findings (e.g. from `gradle-performance.md` checks), name the single top
   win in one line (e.g. "top win here: no `gradle.properties` → tests run serially").
2. Ask **one** confirmation (use the host's question tool if available, else a plain prompt):
   - **Proceed with implementation now** (recommended — I use scoped runs + one build per milestone)
   - **Pause and optimize Gradle first** → stop and point them to `/kiro:doctor` for the full audit
3. Honor the answer. If they proceed, continue normally. If they choose to optimize, stop cleanly and
   suggest `/kiro:doctor`. **Record the choice for the session and do NOT ask again** this run or on
   later milestones.

Constraints: this gate fires **at most once** (first run, Gradle only). Non-Gradle first runs show the
diagram and proceed with no confirmation. Never block a resume run. Never edit the user's build files
here — optimization is the user's call, applied via `/kiro:doctor` guidance.
