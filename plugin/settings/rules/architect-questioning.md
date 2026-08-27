# Architect Questioning (code reality → architect-grade questions)

How the critique loop turns verified code understanding into questions worth an architect's turn. This
is the engine's question generator. It pairs with `rules/architect-critique-loop.md` (the loop) and
`rules/architect-question-catalog.md` (pushback), and it *consumes* the codebase-grounding rule
(`rules/codebase-grounding.md`) for the reality trace — it does not re-derive
grounding rules.

> **This load is non-optional for any skill running the critique loop.** Improvising code-informed
> questions from memory produces either hallucinated edge cases (no basis) or research questions
> dressed as design questions — both waste the engineer's attention and erode trust in the loop.


## The design↔reality diff (the core algorithm)
The agent does not brainstorm edge cases in the abstract. It learns the **specific subsystem the design
touches**, then asks the delta between what the design says and what the code does:





## Redirect script (when the engineer asserts without basis, or hand-waves a failure path)
1. **Quote them verbatim.** 2. **Anchor to the consequence** — *"you said 'the retry handles it' — walk
me through the retry path; the trace shows it reuses the original request, which would replay the
mutation."* 3. If they're right and you were wrong, **say so and move on** — a critic updates on
evidence. 4. If it can't be resolved now, **park it** in the assumptions ledger as a verification target.

## Question jurisdiction (what the critique loop may / may not decide here)
- **MAY surface and ask:** approach/boundary choices, contracts and compatibility, failure & retry
  behavior, consistency/concurrency guarantees, blast radius, observability, build-vs-adopt
  (within-stack), stack & convention conformance, security on new surfaces, scope of edge-case handling.
- **MUST route to the ledger (not ask):** exact performance numbers, library benchmark outcomes, "does
  prod actually retry this" when unverifiable now, anything needing a spike. Capture, tag, defer.

## DON'T
- Don't ask a question whose answer is already in steering, the requirements, or the trace — wasted attention.
- Don't manufacture an edge case: a question without a verifiable basis is AI-slop and is dropped.
- Don't batch code-derived questions — one topic per turn (`rules/architect-critique-loop.md`).
- Don't hide the basis. Engineers trust the question because they can see the code it came from.
- Don't translate the code away — that's the PM variant's rule, not this one.
