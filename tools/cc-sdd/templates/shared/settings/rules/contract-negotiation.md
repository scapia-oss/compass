# Cross-Service Contract Negotiation — hardening the seam between repos


## The reality this is built for (decentralized — read first)
cc-sdd runs in **one repo per session**; each repo does its own HLD/LLD with **its own steering** and
**its own internal design**. There is **no central session** that spans repos. So the **seam contract is
the single thing shared across the separate runs** — authored once by the producer, consumed *as-pinned*
by the consumer. Everything else stays per-repo. This rule hardens only the seam; it never centralizes
design.

## Roles
- **PRODUCER** — the repo that **owns/exposes** the surface. Authors + versions the contract.
- **CONSUMER** — a repo that **calls/subscribes**. Pins + conforms to a version; **never edits the
  contract** — it raises a *delta/request* and the producer owns the change.



## Version + status lifecycle
- **version**: semver-ish. Bump per the change classification below.
- **status**: `proposed` (drafted, not yet accepted by consumers) → `agreed` (producer + consumer(s) pinned
  this version) → `frozen` (shipped/stable). Producer publishes `proposed` first.

## Change classification (the determinism lever)
Classify every contract change from the grounded As-Is:
- **ADDITIVE / backward-compatible** (new optional field, new endpoint, new event, widened input) →
  producer may proceed; consumers notified async; **no hard gate**; minor version bump.
- **BREAKING** (removed/renamed/retyped field, narrowed output, changed error/idempotency/auth semantics,
  removed endpoint) → **major version bump + MANDATORY negotiation gate + coordinated rollout**
  (expand → migrate → contract, or a versioned endpoint/topic). **Never break in place.**

## The negotiation gate (async, across separate runs)
- **Producer-first (normal)** — the producer is the upstream dependency and runs first per the
  roadmap/dependency order: it authors contract `vN` (`proposed`), publishes to the source of truth,
  implements + provider test. The consumer's later run pins `vN`.
- **Consumer-first** (the API doesn't exist yet) — the consumer writes a **contract request**
  (`proposed-by-consumer`: the shape it needs) to the source of truth; its seam tasks are **BLOCKED**
  (`_Blocked: awaiting contract <id> ratification by <producer repo>`) until the producer ratifies + ships.
  (cc-sdd already blocks unmet cross-repo deps.)
- **Negotiation** = the consumer delta vs the producer proposal, reconciled to `agreed` by the two repos'
  owners (a human ratifies — like the PRD's `eng_ratified`).
- **HARD RULE**: a cross-service seam task may **not** be marked complete (ships only behind a flag) until
  its contract is `agreed`/`frozen` **and** a conformance test exists. A **breaking** change against a
  not-`agreed` contract **hard-blocks**.


## Dual conformance tests (what makes drift fail CI — mandatory for a seam)
- **Producer**: a **provider-verification** test asserting the implemented surface matches the published
  contract `@version` (shape, errors, idempotency).
- **Consumer**: a **consumer-contract** test asserting it sends/expects exactly the pinned `@version`.
- Both reference the **same** contract version. Tooling-agnostic: consumer-driven (Pact-style) where the
  stack has it, else a test that imports/asserts the shared schema. These are explicit `spec-tasks` tasks.
  This is the deterministic guarantee — a divergence fails a **test**, not a review.



## cc-sdd phase mapping
- **spec-design-hld** — identify every seam this slice **produces/consumes**; name the **role**
  (producer/consumer) per seam; **classify** additive vs breaking. Record them in the HLD's Cross-Service
  Impact section.
- **spec-design-lld** — **harden** each contract (the full content above). **Producer**: author/update the
  contract at the single source of truth (status `proposed`), bump the version per change class, and pin
  `id@version` in `spec.json`. **Consumer**: `git pull` latest, read the contract, **pin** the version (do
  NOT re-author); if it doesn't meet needs, write a contract-request delta and mark the seam blocked.
- **validate-design** — enforce the **gate**: a *breaking* seam whose contract is not `agreed` **blocks**;
  emit the contract diff (old → new) for the reviewer; confirm the spec **pins** and does not **copy** the
  schema.
- **spec-tasks** — emit the **provider/consumer conformance-test tasks**; tag every seam task with
  `contract_id@version`; consumer seam tasks `_Depends:_` the contract reaching `agreed`.
- **impl / implementer** — build the seam against the **pinned** version; write the conformance test.
- **validate-impl** — assert the implemented seam matches the pinned contract version; run the conformance
  test + the shared-component regression (regression-verifier) for the seam.

## DON'T
- Don't copy the contract schema into the service spec — **pin** it (`id@version`).
- Don't float on "latest" at build time — **pin** the version.
- Don't break a contract in place — **major bump + gate + coordinated rollout**.
- Don't mark a seam task done against a not-`agreed` **breaking** contract.
- Don't let the consumer edit the contract — it raises a **delta**; the producer owns it.
