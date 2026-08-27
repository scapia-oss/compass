# Implementation Handoff (`impl` vs `impl-fast`) — educate, don't just emit one command

When the computed next step is `implementation` (arriving from requirements / HLD / LLD / tasks), do **not** print a
single bare `impl` line. Present **both** implementation commands so the engineer chooses deliberately. Use this block:

```text
Next step — implementation. Two paths:

  impl {feature}        ← default. TDD per task (RED→GREEN), kiro-verify-completion gate, and a commit
                          per task unless this spec chose to leave the work uncommitted.
                          Use for anything behavioral, or money / auth / IO-critical.
  impl-fast {feature}   ← build + review ONCE at the end, no per-task TDD.
                          Use ONLY for config / DTO / non-behavioral edits, or slow-build repos.
                          NOT for behavioral or money / auth / IO paths.

  ⚙ optional flags:
    --review inline|required   turn per-task review ON (it is OFF by default). Add for behavioral /
                               money / auth / IO changes. inline = main-context review; required = reviewer subagent.
    --validate                 (impl) force /kiro:validate-impl after the run.
    --impl-model opus          (impl) use Opus for code generation (max quality, higher cost; default sonnet).
    --no-tests                 (impl-fast) skip tests — non-behavioral edits only.
    --commit | --no-commit     override this spec's commit_policy for one run. --no-commit leaves
                               every change in your working tree for you to stage and commit.
```

`spec.json` may carry `implementation_mode` (`"standard"` default, or `"fast"`; absent ⇒ `"standard"`). Keep
`impl {feature}` as the **primary/default** regardless. When `implementation_mode == "fast"`, you may add a one-line
note that the spec was triaged low-risk so `impl-fast` is a reasonable pick — but never demote `impl` below it or
omit it. `impl-fast` defers all verification to the end, so it is always an explicit opt-in, never the default.

`spec.json` may also carry `commit_policy` (`"per-task"` default, or `"leave-uncommitted"`; absent ⇒ `"per-task"`),
chosen at `spec-init`. When it is `"leave-uncommitted"`, add one line to the block above so the engineer is not
surprised by a clean `git log`: *"this spec leaves the work uncommitted — impl/impl-fast will implement and gate,
then hand you the working tree to commit."*

After implementation, print the next gates as part of the same handoff/report. They are not optional follow-up prose:

```text
Next gate: validate-impl {feature}
   Required before merge / success claim. Writes impl-validation.md and catches cross-task drift.
After GO: retrospective {feature}
   Required to close the workflow. Writes feedback + skill-improvement artifacts while the session is fresh.
```
