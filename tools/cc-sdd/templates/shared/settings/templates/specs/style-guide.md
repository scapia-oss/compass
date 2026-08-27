# Code Style Guide

## What this file is

This is this repository's own **living style guide** — the same *kind* of artifact as the industry
references engineers already carry a mental model of: the Google Java/Python/JS style guides, the
Airbnb JavaScript/React style guide, PEP 8, PSR-12, *Effective Java*, *Clean Code*. Those references
teach general-purpose taste (naming, control flow, layering, error handling). **This file is the
repo-specific layer on top of that taste** — the conventions *this* codebase's engineers have actually
enforced in review, captured the moment they enforce them, so the next implementation run — by this
model or a different one, on this spec or a different one — already knows them instead of re-learning
them the hard way. Where a repo convention here conflicts with general-purpose taste, the repo
convention wins (steering wins over this file too — see the precedence chain in
`global-context-loading.md`).

**Durable, repo-wide code-style conventions** — how controllers/services should be shaped, how control
flow (if/switch/guard clauses) should read, method naming and length, frontend component nesting vs
flatness, SQL/query-preparation conventions, and similar broad-stroke shape decisions. This is **not**
a bug/mistake log (that's `learnings.md`/`patterns.md` — those capture "the AI got this specific thing
wrong") and **not** a one-off scope choice (that's `decisions.md` — "we picked SSE over WebSockets for
this feature"). An entry here is a convention meant to shape *every future line of code of that kind*,
regardless of spec, regardless of which model or engineer writes it next.

## What to record — and what not to

**Record it** when the correction reads like a *standing rule*, not a one-time fix. Real corrections
tend to arrive with recognizable phrasing: "we always do X here", "never do Y in this codebase",
"let's standardize on Z going forward", "the convention in this repo is...", "every PR that does this
gets flagged in review". If a correction sounds like it belongs in a team's engineering handbook next
to "we use `snake_case` for DB columns" or "controllers stay thin", it belongs here.

**Apply the broad-stroke test before recording:** would this same correction plausibly recur on **3+
unrelated files** if it weren't written down? If yes → record it, with an example. If it's a one-off
fix scoped to a single file's local quirk, or a purely cosmetic preference with no repeat risk (a
single rename, a one-off reordering, "add a comma here") → do **not** record it. The goal is a style
guide that stays **meaty with signal, not bloated with nitpicks** — every entry earns its place by
being something a reviewer would actually flag again and again if it weren't written down.

Loaded as binding context by `kiro-impl`/`kiro-impl-fast` — inlined into the implementer subagent
verbatim, the same tier as `code-simplification.md`, not treated as an optional fallback path.

<!-- Entries are appended synchronously (never via a fire-and-forget background call) by kiro-impl /
     kiro-impl-fast when a human correction passes the broad-stroke test above. -->
<!-- On dedup, add a new Example to the existing entry instead of creating a duplicate rule. -->
<!-- Cap: 3 examples per entry. Oldest replaced when at capacity. -->
<!-- Every entry MUST include a code example — a bare prose rule with no example is incomplete. -->

<!-- Entry format:

## <Title> (backend|frontend|global)
**Rule:** <one-line imperative statement>
**Example:**
```<lang>
// ❌ bad
<snippet>
// ✅ good
<snippet>
```
**Why:** <rationale — one or two sentences>
**Source:** <spec-slug>, <phase>, YYYY-MM-DD

-->

<!-- Common categories to watch for — not exhaustive, but a prompt so a durable correction doesn't get
     missed just because it doesn't look like a "rule":

     Backend: layering & delegation · control flow shape (guard clauses, switch/enum vs string compare)
     · method naming & length · error handling (wrap/rethrow vs swallow) · DTO/entity boundaries · DI
     conventions · logging · null/empty handling.

     SQL / data access (either side): parameterized queries only, never string-concatenated values ·
     explicit column lists over `SELECT *` · index-aware WHERE/JOIN key ordering · batch/paginate
     instead of N+1 per-row queries · transaction boundary placement · migrations are additive/reversible.

     Frontend: component nesting vs flatness · state colocation vs lifting · conditional-rendering shape
     (early-return vs chained ternaries) · list keys (stable id vs index) · prop drilling vs
     context/composition · hook extraction · styling conventions · accessibility (semantic elements,
     aria, focus) · form handling.

     Global: file/module organization · comment discipline (why, not what) · test structure.
-->

<!-- Worked examples — one per major category, to calibrate what a good entry looks like:

## Controllers delegate, never branch on business state (backend)
**Rule:** A controller calls exactly one service method and maps the result — it never inspects
business fields to decide what to do next.
**Example:**
```java
// ❌ bad
if (order.getStatus() == PENDING) { ... } else { ... }
// ✅ good
return OrderResponse.from(orderService.process(orderId));
```
**Why:** Keeps controllers thin/testable; branching belongs in the service layer, unit-testable
without HTTP scaffolding.
**Source:** order-refund-flow, implementation, 2026-07-20

## Guard clauses over nested if/else (backend)
**Rule:** Return/throw early on the invalid case; keep the happy path unindented, not nested in `else`.
**Example:**
```java
// ❌ bad
if (p != null) { if (p.getAmount() > 0) { return charge(p); } else { throw new InvalidAmountException(); } }
// ✅ good
if (p == null) throw new NullPaymentException();
if (p.getAmount() <= 0) throw new InvalidAmountException();
return charge(p);
```
**Why:** Nesting depth tracks the complexity a reader must hold in their head; guard clauses flatten
the happy path to read top to bottom.
**Source:** payment-retry-flow, implementation, 2026-06-30

## Parameterized queries only — never string-concatenate values into SQL (backend/SQL)
**Rule:** Every value in a query goes through a bind parameter / prepared statement placeholder —
never `+`/f-string/template interpolation of a value into the SQL text, even for "safe" internal IDs.
**Example:**
```java
// ❌ bad — concatenated, SQL-injectable, defeats query-plan caching
String sql = "SELECT * FROM orders WHERE customer_id = '" + customerId + "'";

// ✅ good — bound parameter, cacheable plan, no injection surface
String sql = "SELECT id, status, total FROM orders WHERE customer_id = ?";
jdbcTemplate.query(sql, new Object[]{customerId}, ...);
```
**Why:** Concatenation is an injection vector regardless of the source's trust level, and it forces the
DB to re-parse/re-plan the query on every distinct literal instead of reusing a cached plan for the
parameterized form. Also select explicit columns, not `SELECT *` — a schema change shouldn't silently
change what a caller receives.
**Source:** order-history-api, implementation, 2026-05-15

## Extract a named subcomponent past 2 levels of JSX nesting (frontend)
**Rule:** When JSX nests more than ~2 conditional/structural levels deep, extract a named
subcomponent — don't keep growing one `return`.
**Example:**
```tsx
// ❌ bad
return <div>{items.map(i => <div>{i.active && <div>{i.tags.map(t => <span>{t}</span>)}</div>}</div>)}</div>;
// ✅ good
return <div>{items.map(item => <ItemRow key={item.id} item={item} />)}</div>;
```
**Why:** Nesting depth in JSX costs readability the same way imperative nesting does; a named
subcomponent labels "what this block does" instead of forcing the reader to parse structure to find out.
**Source:** dashboard-item-list, implementation, 2026-07-02

## Never use array index as a list key when items can reorder/filter (frontend)
**Rule:** Use a stable, unique identifier from the data (`item.id`) as `key` — never the array index —
for any list that can reorder, filter, or have items inserted/removed.
**Example:**
```tsx
// ❌ bad — state attaches to position, not item
{items.map((item, i) => <Row key={i} item={item} />)}
// ✅ good — stable identity survives reordering
{items.map(item => <Row key={item.id} item={item} />)}
```
**Why:** React matches elements across renders by key; an index key causes state (focus, input values,
animation) to jump to the wrong row whenever order changes.
**Source:** sortable-task-list, implementation, 2026-07-10

## Semantic HTML over div-soup with click handlers (frontend)
**Rule:** Use the semantic element for the interaction (`<button>`, `<a>`, `<label>`) instead of a
`<div>`/`<span>` with `onClick` — a non-interactive element standing in for one breaks keyboard/screen-reader access by default.
**Example:**
```tsx
// ❌ bad
<div className="btn" onClick={handleSubmit}>Submit</div>
// ✅ good
<button type="button" className="btn" onClick={handleSubmit}>Submit</button>
```
**Why:** Semantic elements carry built-in keyboard activation, focus management, and accessibility-tree
roles that a styled `div` has to reimplement by hand and usually doesn't — the most common a11y
regression in review.
**Source:** checkout-form-redesign, implementation, 2026-06-18

-->
