# Gradle Build-Performance Rules

Gradle is, on most JVM/Spring repos, the dominant cost of the implement loop. The RED step runs the
just-written tests on impl-free code and each milestone's GREEN gate runs a scoped build + tests — on a
cold daemon, a full-context Spring boot, or an untuned `gradle.properties`, even a scoped run is tens
of seconds. When the agent appears "slow at RED", the build tool is almost always the bottleneck, not
the model. Two jobs live here:

1. **`impl` / `impl-fast`** — print the build-stack callout so the user knows *why* a gate is slow and
   what the agent is already doing about it (scoped runs per milestone, one full build per run).
2. **`doctor`** — audit the repo's Gradle files and report concrete, prioritized fixes with the *why*.

---

## A. Build-stack callout (print in `impl` / `impl-fast`)

Detect Gradle when the discovered `BUILD_COMMANDS` / `TEST_COMMANDS` invoke `gradle` or `./gradlew`
(or a `build.gradle` / `build.gradle.kts` exists at repo root). When detected, print this crisp
Markdown blockquote callout ONCE, right after the model-policy banner (keep `>` on every line):

```
> 🐘 **Build stack: Gradle — expect this to be the bottleneck**
> The gates wait on Gradle, not the model. Here is what I do to keep it fast:
> - ⚡ RED **and** each milestone's GREEN gate use **scoped** runs: `./gradlew :<module>:test --tests <Class> --offline` — never the full suite
> - 🏗️ Full build + full suite + smoke runs **once per run**, after the last milestone — not per milestone, not per step
> - 🐢 Still slow? usual causes: `@SpringBootTest` booting the full context, no build cache, or a
>   config-time `aws codeartifact … .execute()` token call running on every invocation
> - › Run `/kiro-doctor` for a Gradle health audit with concrete fixes
```

When the repo is NOT Gradle (npm/pytest/go/cargo/…), do not print this callout.

## B. Scoped-command discipline (applies whenever the stack is Gradle)

- **RED / inner loop / milestone GREEN gate**: always scope — `./gradlew :<module>:test --tests "<FQCN>" --offline`,
  plus the affected module's own build task. Never `./gradlew test` or a root `build` for a single
  milestone. In `impl`, the pre-flight test baseline is scoped the same way (boundary test targets
  only); `impl-fast` takes no test baseline, so this applies to its single end gate instead.
- **`--offline`** after the first resolve of a session — skips dependency resolution and (often) the
  config-time CodeArtifact token call.
- **Never `clean`** inside the loop — it discards incremental compilation and the local build cache,
  the two things that make repeat runs fast.
- **Run-closing full gate** = the one place a full `build` + full suite + smoke runs, once per run,
  after the last milestone (see `kiro-impl` Step 3.5). A milestone's own GREEN gate is scoped.

---

## C. Gradle health audit (run in `doctor`)

Read the repo's `gradle.properties`, root + module `build.gradle(.kts)`, `settings.gradle(.kts)`, and
`gradle/wrapper/gradle-wrapper.properties`. For each check below: state the **finding**, the **why it
matters**, and the **fix**. Severity guides ordering, not a hard gate — this is advisory and
read-only. Report only checks that actually apply to the repo.

### C1. `gradle.properties` missing or untuned — **HIGH**
- **Detect**: no `gradle.properties`, or it lacks `org.gradle.parallel` / `org.gradle.caching`.
- **Why**: without these, modules build serially and nothing is restored from cache — every run pays
  full cost. This is the single biggest, cheapest win.
- **Fix**: create/extend `gradle.properties`:
  ```properties
  org.gradle.parallel=true
  org.gradle.caching=true
  org.gradle.configuration-cache=true
  org.gradle.vfs.watch=true
  org.gradle.jvmargs=-Xmx3g -XX:MaxMetaspaceSize=512m -Dfile.encoding=UTF-8
  ```

### C2. Configuration cache off — **MEDIUM** (HIGH on Gradle ≥ 8)
- **Detect**: no `org.gradle.configuration-cache=true` and the wrapper is Gradle ≥ 7.6 (stable from 8.1).
- **Why**: the configuration phase re-runs on every invocation; the config cache skips it when build
  logic is unchanged — large savings on repeated targeted RED runs. Note it surfaces latent
  config-time work (see C5), so enabling it is also a forcing function.
- **Fix**: add `org.gradle.configuration-cache=true`; run once and fix any reported incompatible tasks.

### C3. Config-time external/`.execute()` calls — **HIGH**
- **Detect**: any `"...".execute()`, `exec`, or network/token call at the top level of `build.gradle`
  (classic example: `aws codeartifact get-authorization-token … .execute().text` assigned to an
  `ext.` token). Doubly bad when it appears more than once.
- **Why**: it runs on **every** Gradle invocation — including each scoped RED run — adding a network
  round-trip to commands that should be instant. It also breaks the configuration cache.
- **Fix**: resolve the token once per session (env var or `~/.gradle/gradle.properties`) and pass it
  as a project property (`-PcodeArtifactToken=$TOKEN`), or guard the `.execute()` behind
  `providers.environmentVariable(...)` / `project.hasProperty(...)` so the default path does no I/O.

### C4. `@SpringBootTest` not carved out from unit tests — **HIGH**
- **Detect**: heavy `@SpringBootTest` classes in the same `test` task as fast unit tests, with no
  separate task; or full-context boot where a slice (`@WebMvcTest`, `@DataJpaTest`, `@JsonTest`) would do.
- **Why**: full-context boot is the dominant per-class RED cost. Mixing them blocks parallel forking
  (shared ports/context) and makes every RED run pay boot cost.
- **Fix**: split heavy integration tests into a dedicated single-fork task and let the default `test`
  fork pure unit tests in parallel; prefer slice annotations over `@SpringBootTest` where possible.
  *(A good reference shape: a separate `regressionTest` task with `maxParallelForks = 1` that the
  default `test` task `exclude`s.)*

### C5. Test task caching disabled — **MEDIUM**
- **Detect**: `outputs.cacheIf { false }` or `outputs.upToDateWhen { false }` on a `Test` task.
- **Why**: forces every test run from scratch even when nothing changed — defeats the build cache for
  the most expensive task. Sometimes intentional (flaky/time-dependent tests); confirm before flagging
  as wrong.
- **Fix**: remove the override if tests are deterministic; if a subset is genuinely non-cacheable,
  isolate those into their own task rather than poisoning the whole `test` task.

### C6. No test parallelism — **MEDIUM**
- **Detect**: `Test` task with no `maxParallelForks` (defaults to 1 → serial) on a multi-core repo.
- **Why**: serial test execution leaves cores idle; pure unit tests parallelize cleanly.
- **Fix**: `maxParallelForks = Runtime.runtime.availableProcessors().intdiv(2) ?: 1` (or a
  `-PtestForks` override), keeping heavy shared-resource tests on a single-fork task (see C4).

### C7. No build cache (local/remote) — **MEDIUM**
- **Detect**: `org.gradle.caching` unset, and no `buildCache {}` block in `settings.gradle`.
- **Why**: a shared remote cache lets a clean checkout (or another dev/CI) restore outputs instead of
  rebuilding; the local cache speeds repeat runs on the same machine.
- **Fix**: enable `org.gradle.caching=true`; for teams, add a remote `buildCache` (S3/HTTP) with
  `push` gated to CI and read enabled for local dev.

### C8. `build` hard-wired to `test` — **LOW/MEDIUM**
- **Detect**: `build { dependsOn test }` (or `assemble dependsOn test`).
- **Why**: you can never produce artifacts without running the full suite — there's no fast
  compile-only path, so the inner loop can't avoid the test cost.
- **Fix**: rely on the default lifecycle (`check` runs tests; `assemble` doesn't) instead of forcing
  `build → test`; let the run-closing full gate own the full suite explicitly.

### C9. Outdated Gradle wrapper — **LOW**
- **Detect**: `distributionUrl` pins Gradle < 8.x.
- **Why**: newer Gradle has a stable configuration cache, faster incremental compilation, and better
  parallelism. (Upgrade is a real migration — flag, do not auto-apply.)
- **Fix**: plan a wrapper upgrade (`./gradlew wrapper --gradle-version <latest>`) and validate the build.

### Doctor output for the Gradle audit
Add a `Gradle build-health` group to the report: one line per applicable finding as
`<severity>: <check> — <one-line fix>`, then a one-line takeaway naming the top win (usually C1 or C3).
This is **advisory** — never a `FAIL` that changes the doctor verdict, and **read-only** (instruct the
fix, never edit the consumer's build files). If the repo is not Gradle, skip this section silently.
