# Write-Time Code Quality

> **Single source.** This file is the canonical code-quality kernel. The `kiro-impl` controller inlines it verbatim into every implementer dispatch (alongside steering), and `kiro-validate-impl` (check E.5) cites its anti-pattern vocabulary for the cross-unit duplication scan. Edit here — both consumers follow. Distilled for write-time from the `code-simplification` agent skill (addyosmani/agent-skills), itself after Anthropic's code-simplifier plugin.

These are **generation rules**, applied *while* code is written — NOT a cleanup phase that runs after, and NOT a separate refactor pass. Write the code this way the first time so no refactor pass is ever needed.

Goal: code a new teammate understands fast. The aim is fewer things to hold in your head, **not** fewer lines — a dense one-liner is not simpler than a clear five-liner.

**Five principles — apply as you write:**
1. **Spec-exact behavior.** Implement exactly the behavior the acceptance criteria / design define. No cleverness that shifts edge-case, error, or ordering semantics. (There is no prior code to "preserve" — the spec is the contract.)
2. **Conform to injected steering & design.** Match THIS repo's conventions (the steering provided) and the design's interfaces, naming, layering, and error-handling — not generic style. Code that breaks repo consistency is churn, not simplicity.
3. **Clarity over cleverness.** Explicit beats compact whenever the compact form needs a mental pause to parse.
4. **Right-sized abstraction.** Don't add a wrapper / factory / strategy until a real second caller needs it; don't inline away a helper that gives a concept its name. No speculative "might need later" code.
5. **Stay in your boundary.** Touch only the assigned `_Boundary:_`. No drive-by edits to unrelated code — they create noisy diffs and regression risk.

**Emit-clean checklist — do NOT write these in the first place:**
- ❌ 3+ levels of nesting → use guard clauses / early returns
- ❌ functions doing several things (~50+ lines) → split into focused, named functions
- ❌ nested ternaries → if/else chain, `switch`, or a lookup map
- ❌ boolean-flag params (`doThing(true, false)`) → options object or separate functions
- ❌ generic names (`data`, `result`, `temp`, `val`, `item`) → name for the content (`userProfile`, `validationErrors`)
- ❌ comments restating the code (`// increment counter`) → delete them; keep only WHY comments (intent the code can't carry)
- ❌ duplicated logic within the unit → one well-named function
- ❌ re-implementing a helper / util / constant / type / component / mapper / DTO / widget / service / adapter / config wrapper / test fixture that already exists → before writing one, `grep` the boundary and the repo for an equivalent; reuse and import the existing one when it fits (import only — do NOT edit outside the `_Boundary:_`). Read enough of the existing code to confirm behavior, state source, errors, and testability; do not reuse by name alone. Create a new unit only when reuse would blur ownership, add hidden coupling, or change behavior for existing callers.
- ❌ dead code, unused imports, commented-out blocks → never add them
- ❌ removing or weakening error handling to "look cleaner" → never; failure paths stay explicit
