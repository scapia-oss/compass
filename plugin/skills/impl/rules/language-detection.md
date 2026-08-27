# Language Detection (for write-time language packs)

cc-sdd runs ONE repo per session. Scan root build manifests ONCE (deterministic — this is bookkeeping, not judgment) to discover every supported language the repo has manifests for, then inline the matching language pack(s) into the implementer dispatch alongside steering + `code-simplification`.

## Detection table (match by repo-root manifest)

| Repo-root manifest | Language | Pack to inline |
|---|---|---|
| `pubspec.yaml` (Flutter/Dart SDK) | Dart / Flutter | `lang-dart-flutter.md` |
| `pom.xml`, `build.gradle`, or `build.gradle.kts` with `.java` sources | Java (JVM backend) | `lang-java-backend.md` |

Reuse the manifest scan already done to discover BUILD/TEST commands — it is the same signal.

## Rules
- **Single-language repo** (only one manifest language detected — the common case): select that one pack for the whole repo.
- **Polyglot repo** (multiple manifest languages detected): select the pack(s) matching the unit's `_Boundary:_` file extensions — inject only for the files actually changed.
- **No match / unknown language**: inject NO pack — never block. The language-agnostic `code-simplification.md` rule and steering still apply.
- **Precedence**: repo steering ＞ language pack ＞ `code-simplification`. Steering is the repo's real conventions and wins on any conflict. (A pack MAY insert its own ecosystem-specific layer — e.g. `lang-dart-flutter.md` puts package-local Dart/Flutter style guides above itself.)
- The pack is a **thin write-time baseline**. The deep, authoritative best-practices live in the org architect skills, composed at REVIEW (Phase 2 — see `kiro-validate-impl` / `kiro-review`), referenced via a config so skill names are not hardcoded.

> **These packs are provisional STARTER baselines** from widely-accepted public guidance. Architects must verify and expand them. Treat them as a floor, not an authority.
