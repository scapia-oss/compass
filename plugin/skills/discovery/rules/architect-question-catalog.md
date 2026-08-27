# Architect Question Catalog (anti-pattern → sharper question)


## Problem & scope framing (discovery, and design when the requirement leaks in)
- **Solution stated as requirement** ("we need a Redis cache here") → *"That's a mechanism. What
  constraint forces it — what breaks at current load without it? Walk me through the slow path you're fixing."*
- **Goal stated as problem** ("we need the API to be faster") → *"That's a target. Which call, at which
  percentile, is slow today, and what does the trace say is spending the time?"*
- **Symptom, not cause** ("orders are getting stuck") → *"That's the symptom. At which state transition
  do they stick, and what's the code doing at that moment?"*
- **Two changes in one** → *"You said '<verbatim A>' and '<verbatim B>' — those are two different changes
  with different blast radii. Which one is this spec?"*
- **Surface-narrowed scope** ("just the checkout handler") → *"The change touches `<traced contract>` — a
  cancel, a retry, and `<N>` callers also hit it. Are those consciously out of scope, or unhandled?"*

## Evidence & assumptions (challenge unbacked claims)
- **Asserted without basis** ("the retry handles that") → *"Walk me through the retry path — the trace
  shows it `<replays the mutation / reuses the key>`. Where's the dedup?"* (If genuinely unverifiable
  now: park it in the assumptions ledger, don't block.)
- **"It's just a local change"** → *"It exposes `<endpoint/event/DTO>`. Until we've checked callers, we
  can't call it local — let me run one blast-radius query."* (the earn-the-word-single-repo rule)
- **Cargo-culted pattern** ("we always do it this way") → *"In `<this>` case the usual pattern assumes
  `<X>`, which the trace shows isn't true here. Does it still hold?"*

## Reliability & correctness (the failure-path lenses)
- **Happy-path-only design** → *"That's the success path. What does the caller see when `<traced
  downstream>` times out after we've already `<mutated state>`?"*
- **Missing idempotency** → *"This is retried at-least-once by `<source>`. What happens on the second
  delivery — double-charge, duplicate row, or is there a key I'm not seeing?"*
- **Unstated consistency model** → *"Two writers can reach `<state>` concurrently. Last-writer-wins, a
  lock, or optimistic versioning — and what does the loser see?"*
- **Transaction spanning a network call** → *"The DB commit and the `<external call>` aren't in one
  transaction. If the call succeeds and the commit fails, who reconciles?"*
- **Silent failure** → *"When this breaks at 2am, what fires — a log, a metric, an alert? Or does it fail
  closed and quiet?"*


## Scope discipline (don't gold-plate, don't under-build)
- **Feature-list design** ("caching + batching + a new queue + …") → *"Which ONE of those does the
  requirement actually need for v1? What's the smallest design that delivers it?"* (attachment probe — the
  last probe before synthesis)
- **Speculative future-proofing** → *"Which current requirement needs that? If none, it's carrying cost —
  defer it and keep the interface open instead."*

## Stack & convention fidelity (preserve what the project already runs)
- **Out-of-stack suggestion** (design or engineer reaches for a tool the project doesn't use) → *"We
  don't run `<X>` anywhere in this codebase. What can't `<existing stack element>` do here? If `<X>` is
  genuinely needed that's a separate platform decision — not this design's to introduce."*
- **Adopt outside the stack** (build-vs-adopt picks a non-stack library) → *"Adopt is right — but adopt
  within what we run. Does `<existing lib / platform capability>` cover this before we add a new dependency?"*
- **Convention drift, steering silent** (steering doesn't spell out the rule, but the code clearly has one)
  → *"Steering doesn't document this, but every `<sibling module>` does `<observed convention — naming /
  layering / error handling / test style>`; this design does `<other>`. Match the house style, or justify
  the divergence."* (You are expected to know the house style from the code even when it isn't written down.)

## Steering / convention alignment (when steering defines a rule)
- **Convention drift** → *"Steering's `<file>` says `<verbatim rule>`; this design does `<other>`. Is that
  a deliberate exception worth recording, or drift?"* (challenge once; the engineer may proceed — record the answer.)

## How to use this catalog
- Match the *answer/claim*, not the topic. One sharper question, then listen.
- Always pair with a `🔧 basis` when the challenge rests on the code (`rules/architect-questioning.md`).
- If the engineer's answer resolves it, **update and move on** — a credible critic concedes on evidence.
- Two rounds max per topic. Then capture (decision → `decisions.md`; unresolved → assumptions ledger) and continue.
