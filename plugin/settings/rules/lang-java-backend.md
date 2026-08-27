# Language Best Practices — Java (backend services)

> **PROVISIONAL STARTER — architects must verify and expand.** A minimal set of widely-accepted public guidance (Effective Java + common service advice), placed so the implementer writes idiomatic code on the first pass. Deep, authoritative review lives in the org `backend-architect` skill (composed at review, Phase 2). **Precedence: repo steering ＞ this pack ＞ code-simplification.**

**Write-time essentials (do these from the first pass):**
- Prefer constructor injection and `final` fields; favor immutability where practical.
- Never swallow exceptions — no empty `catch`; preserve the cause and fail fast with a clear message.
- Validate inputs at the boundary; do not trust external/request data deeper in.
- Use try-with-resources for anything `Closeable`; never leak connections/streams.
- Return `Optional<T>` for absentable results instead of `null`; do NOT use `Optional` for fields/params.
- Use parameterized logging (`log.info("x={}", x)`), not string concatenation; log a failure once, at the boundary (don't log-and-rethrow at every layer).
- Use `java.time` for dates/times; avoid `Date`/`Calendar`.
- Keep methods small and single-purpose; meaningful names (no `data`/`tmp`/`obj`).

**Java test-value rules:**
- Do not test plain enums with only values. Do not test `Enum.valueOf`, `.name()`, or `.values()`.
- Do not test Lombok/generated DTO getters, setters, builders, or `equals/hashCode` unless custom behavior exists.
- Test enum behavior when it maps API values, DB codes, display labels, unknown fallbacks, or state transitions.
- Test DTO behavior when validation, JSON shape, defaults, custom constructors, or backward compatibility matter.
- Test Spring wiring only when custom conditions, profiles, security, transactions, or error handling affect behavior.

(Defer anything not listed here to the `backend-architect` review pass.)
