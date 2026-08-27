# Language Best Practices — Dart / Flutter

> Generic Dart/Flutter write-time idioms — no project-specific names. These rules apply
> at **write time** — the implementer must follow them on the first pass without waiting for review.
> **Precedence: repo steering ＞ package-local guide ＞ repo-root guide ＞ this pack ＞
> code-simplification.** Where a repo or package has its own convention (state management, spacing
> constants, design-system extensions, logger, layer naming), *that* is authoritative; this pack only
> says a convention must exist and be followed consistently.

---

## Step 0 — Read the Repo's Own Guides First

A Flutter repo — especially a multi-package one (`melos.yaml`, `packages/*`, path/git deps) — often
ships its own architecture or code-style guide. That guide describes the **actual** code you are
editing; this pack only describes generic Dart/Flutter idiom. Read it **before writing**, not after
review.

**Discovery — mechanical, done once per unit. Do not judge relevance before looking; an unread
file's relevance is unknowable.**

1. Find the package(s) owning the files you will change: the nearest ancestor directory containing a `pubspec.yaml`.
2. List what actually exists in **that package root** and in the **repo root**:
   - `ARCHITECTURE.md`, `CONTRIBUTING.md`, `STYLE_GUIDE.md`, `CODE_STYLE.md`, `CONVENTIONS.md`, `README.md`
   - anything under `docs/` matching `architecture*`, `style*`, `convention*`, `coding*`, `guideline*`
   - `analysis_options.yaml` — custom lints and disabled rules **are** style rules, and they are machine-enforced, so they bind harder than this pack
3. Read what you found and follow it. Found nothing → this pack is the baseline; do **not** invent a convention.
4. Record which guides you read — or `none found` — in the implementation record defined by the invoking workflow (e.g. `kiro-impl`'s context manifest), so a reviewer can see what governed the code.

**On disagreement**, most-specific-wins for the files in scope:
`repo steering ＞ package-local guide ＞ repo-root guide ＞ this pack ＞ code-simplification`.
Steering is the curated authority: if a repo guide contradicts steering, follow steering **and flag
the contradiction** — never silently pick one.

**When no guide answers the question**, the nearest existing sibling code is the convention. Match
it rather than this pack's illustrative example.

---

## Architecture — Layer Boundaries (Clean Architecture)

- Domain entities must have **zero imports** from analytics/telemetry code or its constants files. Use a default parameter value defined in the entity itself.
- Domain entities must not import Flutter packages or core infrastructure.
- Presentation widgets must not call repositories, datasources, or use cases directly.
- BLoC must not import concrete repository implementations — only abstract interfaces.
- DTOs (`*_model.dart`) must never appear in domain entities or BLoC state.

---

## BLoC / Cubit Rules

- **No public getters** on BLoC/Cubit that expose internal mutable state. State that widgets need must be in the state class, observed via `BlocBuilder`/`BlocSelector`.
- **`isClosed` guard** — every `emit()` call after an `await` must be preceded by `if (isClosed) return;`.
- **Sealed states** — prefer `sealed class` for state hierarchies over a single state class with boolean flags.
- **Equatable completeness** — every field that affects widget rebuilds must be in `props`.
- **Events are immutable** — all fields `final`, `const` constructor, all fields in `props`.
- Never inject one BLoC into another — inject a UseCase instead.
- Handle network results through the repository's result type (e.g. exhaustive `when`/`maybeWhen` on a `Result`/`Either`) rather than raw `try`/`catch` at the Cubit boundary.

---

## Widget Rules

- **No business logic** (filtering, mapping, formatting) in `build()` — put it in BLoC or `initState`/`didUpdateWidget`.
- `initState` / `didChangeDependencies` may only dispatch a BLoC event.
- Navigation must be triggered from `BlocListener`, not `build()`.
- Use `BlocSelector` when a widget depends on only one field from state.
- Check `if (!mounted) return;` after every `await` before using `context`.

---

## State Management — One Approach Per Package

- A package/module uses **one** state-management approach. Steering declares which; if steering is silent, follow the dominant existing pattern in that package.
- Never mix two state-management approaches (e.g. BLoC/Cubit and a reactive-controller framework) in the same file or feature.
- Legacy code on an older approach stays as-is unless the task is an explicit migration — do not opportunistically convert it.

---

## Performance — Widget Build

### P1 · No expensive ops inside `build()` — BLOCKING

Never run `.sort()`, `.where()`, `.map()`, or any O(n) collection transformation inside `build()`.

```dart
// ❌ runs on every rebuild
Widget build(BuildContext context) {
  items = items.where((f) => active.contains(f.id)).toList();
  items.sort((a, b) => order.indexOf(a.id).compareTo(order.indexOf(b.id)));
  ...
}

// ✅ move to initState, didUpdateWidget, or Cubit state
```

### P2 · No `shrinkWrap: true` inside a scrollable parent — BLOCKING

```dart
// ❌
ListView.separated(shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), ...)

// ✅ Use SliverList + CustomScrollView, or Column for < 8 static items
```

### P3 · `BlocBuilder` must have `buildWhen` on frequently-emitting blocs — BLOCKING

A `buildWhen: (p, c) => true` is worse than no `buildWhen` — delete it or add real filtering.

```dart
// ❌
BlocBuilder<MyBloc, MyState>(buildWhen: (p, c) => true, builder: ...)

// ✅
BlocBuilder<MyBloc, MyState>(
  buildWhen: (prev, curr) => curr is MyStateLoaded,
  builder: (context, state) { ... },
)
```

### P4 · Scope `BlocBuilder` to the minimum subtree — BLOCKING

Wrap only the widget that actually changes, not its surrounding decorations.

### P5 · Dispose `AnimationController` and `Timer` — BLOCKING

Every controller/timer created in the widget/controller init path must be cancelled/disposed in the matching teardown (`dispose`/`close`).

```dart
@override
void dispose() {
  _timer?.cancel();
  _controller.dispose();
  super.dispose();
}
```

### P6 · `Opacity(opacity: 0)` for show/hide — BLOCKING for touch, MEDIUM for dimming

```dart
// ❌ invisible but still tappable, still painting
Opacity(opacity: isVisible ? 1.0 : 0.0, child: Button(...))

// ✅ remove from tree
if (isVisible) Button(...)

// ✅ preserve state
Visibility(visible: isVisible, child: Button(...))

// ✅ static dim + non-interactive
AbsorbPointer(absorbing: !isAvailable, child: Opacity(opacity: isAvailable ? 1.0 : 0.5, child: ...))
```

### P7 · `Row + List.generate` for long horizontal lists — BLOCKING

```dart
// ❌ eager — builds all items
SingleChildScrollView(scrollDirection: Axis.horizontal, child: Row(children: List.generate(...)))

// ✅ lazy
ListView.builder(scrollDirection: Axis.horizontal, itemCount: n, itemBuilder: ...)
```

Acceptable for provably short static lists (< 8 items).

### P8 · Prefer `MediaQuery.sizeOf(context)` over `MediaQuery.of(context)` — MEDIUM

`MediaQuery.of(context)` subscribes to all `MediaQueryData` changes. Use the targeted accessor (`sizeOf`, `paddingOf`, `viewInsetsOf`, …) when only that slice is needed — or the project's own `BuildContext` size extension where one exists.

### P9 · Add `RepaintBoundary` on independently animating widgets — MEDIUM

Any widget that animates independently (custom painters, Lottie, carousels, looping text) should be wrapped in `RepaintBoundary`.

### P10 · `GestureDetector` with `HitTestBehavior.opaque` and null `onTap` — BLOCKING

```dart
// ❌ eats all taps when onTap is null
GestureDetector(behavior: HitTestBehavior.opaque, onTap: condition ? onTap : null, child: ...)

// ✅
if (condition) GestureDetector(behavior: HitTestBehavior.opaque, onTap: onTap, child: ...) else child
```

### P11 · `Visibility` vs `if`

- `if (condition) Widget()` — cheapest; removes from tree.
- `Visibility(visible: condition, child: Widget())` — preserves state across visibility toggles.
- Never use `Opacity(opacity: 0)` for toggling (see P6).

---

## `copyWith()` — Return Value Must Be Assigned — BLOCKING

`copyWith()` returns a **new instance**, never mutates the original. Discarding the return value is a silent no-op.

```dart
// ❌ BLOCKING — original unchanged
state.copyWith(isLoading: true);
user.copyWith(name: newName);

// ✅
emit(state.copyWith(isLoading: true));
request = request.copyWith(id: newId);
```

Chain multiple field updates into a single `copyWith()` call.

---

## Null Safety

- Prefer the project's null/empty helper extensions where they exist (e.g. `isNullOrEmpty`) over repeating inline `== null || .isEmpty` chains; otherwise use a plain explicit check.
- `!` is acceptable **only** immediately after an explicit null/empty guard.
- Speculative `!` with no prior guard is **blocking**.
- `?.x!` in the same expression (e.g. `foo?.bar!.value`) is **blocking** — the `?.` already signals nullable.

---

## `const` Constructors

- Every `StatelessWidget` subclass must have a `const` constructor.
- Use `super.key` shorthand — not the old `Key? key` + `: super(key: key)` form.
- Every widget, decoration, and style that doesn't depend on runtime data must be `const`.

---

## Widget Build Conventions

- **Empty return** → `const SizedBox.shrink()` in new code (match the package's existing idiom when it differs).
- The empty-return guard must be at the **very top** of `build()`, before any variable extraction.
- **Collection-if** (`if (cond) Widget()`) for optional widgets — never `cond ? Widget() : const SizedBox.shrink()`.
- **Ternary** (`cond ? A : B`) only when both branches render a real widget.

---

## Spacing

- Follow the package's established spacing convention: if it defines named spacing/padding constants, use them; if it uses raw `const SizedBox(...)` / `const EdgeInsets...`, stay raw.
- Either way: **no new magic numbers** and **no new parallel constants set** — don't introduce a second convention in a package that already has one.

---

## Text Styles

- When the design system exposes typed style variants (extension getters, theme extensions, tokens), use them instead of inline `.copyWith(color: ...)`.
- Only fall back to `copyWith` when no named variant exists for the needed value.

---

## Data Models

- Follow the package's model convention consistently — code-generated immutability (e.g. `freezed` + `json_serializable`) or plain `json_serializable` DTOs.
- Where codegen is in use, do **not** hand-write `copyWith`, `==`, or `hashCode`.
- Keep serialization concerns in DTOs, never in domain entities.

---

## Analytics

- Constants (event names, attribute keys, sentinels) must live in a dedicated analytics constants file/class.
- No magic strings at call sites — always use the named constant.
- Sentinels (e.g. `"UNKNOWN"`) must be a named constant, never an inline string.
- Analytics imports must NOT appear in domain entities or domain events.
- Reach analytics through the project's established seam (mixin, use case, or abstraction) rather than injecting a concrete analytics service into widgets/Cubits ad hoc.

---

## Parameter Threading

- Check **every construction site** when threading a new field — a missed site silently defaults to sentinel.
- The default at every hop must use the same named constant, never an inline string.
- Use `.trim().isEmpty` (not just `.isEmpty`) when the spec says "empty or absent".

---

## File & Class Naming

- Files: `snake_case.dart`.
- Classes: `PascalCase`; private state: `_ClassName`.
- Use the **package's existing** file-suffix convention consistently — do not introduce a new one. Common Flutter suffixes:
  - `_page.dart` / `_screen.dart` — full screen (pick whichever the package already uses)
  - `_widget.dart` — reusable sub-widget
  - `_bottom_sheet.dart` — modal bottom sheet
  - `_cubit.dart` / `_bloc.dart` — state logic
  - `_model.dart` — DTO / serialization type
- If the package uses a layered/atomic naming scheme for UI files, follow that scheme for new files in it.

---

## Function and Method Naming

- Public methods start with a verb: `fetch`, `build`, `check`, `apply`, `update`, `get`, `show`, `handle`, `open`, `navigate`.
- Private methods and fields prefixed with `_`.
- Widget-builder private methods use `_buildX()` — not `_getX()`.
- All widget callback parameters use `onX` convention: `onTap`, `onPressed`, `onChanged`, `onClose`. When context is needed: `onRetryTap`.

---

## Bool Flag Naming

- `isX` — state flags (`isLoading`, `isSelected`)
- `hasX` — data presence (`hasError`, `hasItems`)
- `shouldX` — intent flags (`shouldTriggerSearch`)
- `showX` — display control (`showFilters`)
- `canX` — permission/capability (`canSubmit`)

---

## Testing

- BLoC tests must use `bloc_test` with `act`/`expect`. `Future.delayed` polling is **not acceptable**.
- Each test must set up and tear down its own state. No shared mutable state between tests.
- Fakes/stubs defined once and reused — not duplicated across test files.
- If a field has normalization logic (empty → sentinel), there must be a test for each branch: supplied, empty, absent.
- No `print()` in tests.

---

## Dead Code & Logging

- `Placeholder()` widget is **blocking** in any non-WIP branch. Replace with `const SizedBox.shrink()` or delete.
- Commented-out code: delete it.
- TODOs must carry a tracker id — `// TODO(<TICKET-ID>): description`. A bare `// TODO:` must not be merged.
- `print()` anywhere in production code is **blocking**.
- `debugPrint()` outside an `assert` block must be replaced with the project's logger (one that is gated by `kDebugMode` or a log level).

---

## Magic Strings and Numbers

- `switch`/`if` dispatch on raw string literals is **blocking** — use an `enum` or constants class.
- All analytics event name strings go in a dedicated constants class — never inline at the call site.
- Layout magic numbers (widths, heights, radii) should be extracted to a `static const` or local `const`.

---

## Widget Extraction

- Extract to a **private `StatelessWidget` (`class _XWidget`)** when: the subtree has its own parameters, is reused in 2+ places, or encapsulates a behaviour (gesture, condition, animation).
- Extract to **`Widget _buildX()`** when: the subtree is one-time use and purely for readability.
- `switch`/`if` arms in `build()` that each return a substantial subtree must be extracted to named `_buildX()` methods or separate widget classes.
- `build()` exceeding ~30 lines should be split up.
- Avoid nesting more than 4–5 pure layout wrappers before a semantic widget.
- Prefer `padding` on the parent `Row`/`Column` over sequential `SizedBox` spacers.

---

## Edge Cases to Always Cover

1. Empty / whitespace-only strings for any new `String` parameter — is normalization complete?
2. Nullable fields — what happens downstream when null?
3. `isClosed` guard after every async gap before `emit()`.
4. Double-fire risk — does analytics fire twice if parent and child both call it?
5. Session resume — does a retained value update correctly or go stale?
6. Every construction site for a new parameter — silent sentinel default vs explicit real value.
7. Analytics payload length/format constraints on new attributes.
