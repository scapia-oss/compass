# Architect Critique Loop (the adversarial dialogue engine)


> **This load is non-optional for any skill that references it.** Composing the loop from memory
> reliably produces: stacked questions, a checklist-gauntlet instead of dialogue, the internal draft
> pasted into chat, agreeing-by-default with whatever the engineer or the doc says, or design written
> after a correction without re-confirmation.

## Stance — you are a ruthless technical architect critic, not a stenographer
You are an expert architect of *this* system, in *this* codebase, on *this* topic. Your job is not to
collect what the engineer hands you and write it up. It is to **stress the design until it survives or
breaks** — and to break it on paper, now, not in production.



A question that passes all three is worth asking **regardless of how many came before**; one that fails
any is dropped **even if you've asked nothing yet**. A cross-cutting, money/auth/IO-touching change
legitimately earns many questions; a tight, well-framed internal change may earn zero. **Never drop a
question that matters to respect a number; never invent one to fill a quota.**

## Scope tiers (rigor depth) + the reflection trigger
The tier sets **which rigor lenses apply** and how hard to auto-fire — NOT a question count. Classify
the change at entry (the host skill tells you what is under critique: a problem/scope, an architecture,
a set of contracts, or a finished design):

| change shape | tier | behavior |
|---|---|---|
| trivial / config / DTO / non-behavioral, single internal file | **Lightweight** | one quick reality check; usually zero questions — do not manufacture ceremony |
| normal feature, bounded blast radius | **Standard** | full reality trace + the core lenses (contracts · failure paths · blast radius · consistency) |
| cross-cutting, money/auth/IO-critical, multi-service, or contested | **Deep** | Standard lenses + durability ("how does this hold under the next plausible shift?"), amplified-asymmetry, and an explicit failure-mode sweep |

**Auto-fire is scope-gated.** Standard/Deep changes run the loop by default; Lightweight changes get a
single reality check and proceed unless it surfaces something real. Never run a Deep interrogation on a
one-line config change.

**The reflection trigger — flipped toward COVERAGE, never toward stopping.** Once you've asked a few
questions (≈3+), pause and self-check (do not silently end), but ask the *coverage* question, not the
*wrap-up* question: *"Which applicable lens (Coverage lenses, below) is still `untouched` or
`probed`-but-not-`saturated` — and what's the sharpest unasked question there?"* Then go there next.
Tapering on ONE lens never ends the loop — it moves you to the next unsaturated lens. For an
**adversarial** critic, premature taper is the expensive failure: a missed failure-path or blast-radius
ships a bug. The loop ends **only when the whole applicable ledger is `saturated`/`N/A`** (Exit, Phase B
below). The real governor is the three filters (quality floor per question) + **per-lens saturation**
(coverage floor); there is still **no question count**.

## Coverage lenses (the CATEGORY axis — the deterministic coverage contract)
The critique is organized along a **concern axis** on top of the question *source* (a/b/c, Phase B). This
turns the model-judged "I've run out of questions" exit into an **auditable, deterministic** one: a fixed,
enumerated lens set per phase, each lens tracked to a saturation state, and an exit gate that is a
checkable condition — not a feel. The host skill tells the loop **which phase/altitude is under critique**;
that selects the lens set:

| Invoking phase (altitude) | Applicable lens set (the enumerated contract) |
|---|---|
| **discovery** (problem / scope) | **SL1** who/why (problem real, not solution-as-problem) · **SL2** desired outcome · **SL3** boundary candidates · **SL4** out-of-boundary · **SL5** existing-vs-new (verify against code) · **SL6** upstream/downstream + blast radius · **SL7** constraints · **SL8** rollout stage (shadow vs enforcing) · **SL9** caller's-eye view (who invokes it, how) |
| **spec-design-hld** (architecture) | **EL1** contracts & compatibility · **EL2** blast radius / callers · **EL3** state & consistency · **EL5** failure & partial-failure paths · **EL7** amplified asymmetries · **EL11** build-vs-adopt / over-abstraction · **EL12** stack & convention fidelity · **EL13** dependency direction / coupling |
| **spec-design-lld** (contracts) | **EL1** contract detail & versioning/nullability · **EL3** data-model state coverage · **EL4** idempotency & retries · **EL6** concurrency & ordering · **EL8** scale / hot paths · **EL9** authz / security on new surfaces · **EL10** observability |
| **validate-design** (audit) | **the UNION of the HLD + LLD applicable lenses** — verify each carried lens is `saturated`; re-derive any the carried ledger left `untouched`/`probed` (it's a gate, not the open loop) |

(EL/SL definitions live in `rules/architect-questioning.md`'s reflection checklist — that file tags each
checklist item with its lens ID. This table is the single source for which lenses apply per phase.)

**Tier scopes the set within a phase** (Lightweight/Standard/Deep, above): **Lightweight** → only the
1–2 highest-risk lenses for *this* change, the rest auto-`N/A — tier` (preserves "a tight change earns
zero questions"); **Standard** → the full set above; **Deep** → the full set + a durability / amplified-
asymmetry sweep (EL7) treated as must-probe.

**Per-lens saturation states (deterministic):** `untouched` → `probed` (≥1 question asked or self-resolved)
→ `surfaced-new` (an answer changed the design) → **`saturated`** (no remaining question in this lens
passes the three filters) · or **`N/A (reason)`** (out of tier, or the change genuinely doesn't touch it).
Track this ledger turn-by-turn; persist it to `spec.json.critique_coverage[]` so later phases inherit it
and `validate-design` can audit the union.

**LEDGER, not GAUNTLET.** Do NOT march lens-by-lens in fixed order — that's the interrogation anti-pattern.
The dialogue stays adaptive and one-topic-per-turn; one answer can advance several lenses. The ledger is the
background audit, not the script. EL5/EL2/EL1 usually have the most machinery already; EL9/EL10/EL13 are the
lenses most often left thin — give them equal standing, never an afterthought.

## Form-of-question rules (apply to EVERY turn)
These rules preserve the loop's behavior. Wording hygiene may make a question shorter or clearer,
but it must never drop a question that passes the three filters, add a question that fails them,
change the closed-vs-open choice, weaken pushback, or alter the per-lens exit gate.

0. **The bar for asking:** a question earns a turn only if a sharp principal engineer who has read the
   code would say "good question — I hadn't thought about that." Nice-to-knows, already-covered points,
   and pure-research questions don't earn a turn.
1. **One topic per turn.** Even when sub-questions feel related, pick the single most useful one. No
   stacked gauntlet.
2. **Closed turns use the blocking question tool — `AskUserQuestion` — by default.** Use it for every
   turn where the answer is a choice among design directions, a scope/priority pick, or a decision
   re-confirmation. Give 2–4 distinct, concrete options (the harness appends "Other" + free-text, so
   options scaffold the answer without confining it — never hand-author an "Other"). Put your
   recommended option first and label it `(Recommended)` when you have a defensible default; state why
   in one line. One `AskUserQuestion` *question* per turn (the one-topic rule). If its schema isn't
   loaded, call `ToolSearch` with `select:AskUserQuestion` first. **Never silently skip the question** —
   fall back to numbered text options in chat only when the tool genuinely cannot be called.
3. **Open-ended (plain prose, no tool) only when genuinely open:** (a) inherently narrative, (b) you'd
   bias the answer by listing options, or (c) you'd be straining to fill 3–4 distinct plausible option
   slots (if you'd pad the slots, the question is open). Rigor probes and "walk me through what happens
   when…" failure questions are open-ended by design.
4. **Open-ended must be specific.** Good: *"Trace what happens to an in-flight request when the new
   cache node drops mid-write — does the caller see a stale read, an error, or a silent retry?"* Banned:
   "any concerns?", yes/no traps, "briefly…", warmth wrappers.
5. **Ask the engineer's read before offering yours** when the topic is genuinely open — it prevents
   anchoring the discussion on your framing. When you hold a strong evidence-backed position, lead with
   it (that's the point of being a critic) but invite the counter.
6. **Pushback: max twice per topic, quote the engineer/doc verbatim, never name the anti-pattern**
   (`rules/architect-question-catalog.md`). After two rounds, capture the answer and move on.
7. **Show the code.** Every code-grounded question carries its `🔧 basis` line (the `repo · path:line ·
   Class#method` you read). The engineer should see exactly what in the codebase prompted the question.
8. **Ask without throat-clearing.** No "I want to understand", "just to clarify", "before we proceed",
   or "quick question". Lead with the basis when there is one, then ask the single decision-relevant
   question. If a sentence needs "and", split it unless both halves are one inseparable decision.
   After the question, add one plain "why it matters" line — the stake if we get it wrong (what breaks,
   or what it costs) — so a reader who does not know cc-sdd can answer from the question alone.
9. **Compress after answers.** Restate only the decision and consequence before moving on. Do not replay
   the whole answer unless the exact wording is being appended to `design-qa-log.md`.



## Phase B — The dialogue loop (interleave the three question sources)
- **(a) Rigor probes** — from Phase A, open-ended, one per real gap.
- **(b) Design↔reality-diff questions** — from `rules/architect-questioning.md`. Each passes the basis +
  decision-relevance gates and names which requirement/component it ties to, with its `🔧 basis`.
- **(c) Integration check** — before exiting, mentally combine everything decided and surface non-obvious
  *consequences* ("if the new idempotency key is per-request but retries reuse the original key AND the
  downstream is at-least-once, duplicates slip through"). One open-ended probe per genuine combination effect.


**Sequencing:** start at the highest-leverage uncertainty (usually the boundary/approach or the riskiest
contract) → narrow to specific failure modes and edge cases. Interleave (b) where the diff touches the
topic under discussion.


**Log every turn (the audit trail + downstream seed — `design-qa-log.md`).** The instant a question is
resolved, **append** an entry to the spec's `design-qa-log.md`: the question, options offered, the answer
(verbatim/essence), **`Answered by:` human | bot**, a **timestamp** (`date +"%F %H:%M"`), the **lens** (EL/SL
id), the `🔧 basis` (the code ref — shown, per `rules/architect-questioning.md`), what it surfaced
(`new`/`confirmed`/`deferred`), and what it **seeds** (a contract / failure-path / decision / assumption-
ledger entry). **Also log questions you answer YOURSELF** as `Answered by: bot` — when the traced code
resolves a candidate question and you consciously don't ask the engineer, record it with its basis: it's a
verified-reality finding HLD/LLD/tasks/regression-verifier inherit, and it records *why* a lens reached
`saturated` without a turn. **Append-only — never rewrite history**; a re-decision is a new entry
referencing the earlier one (circularity soft-cut still applies). The log is the raw evidence + seed;
`research.md`/`decisions.md` hold the synthesis.

**Exit (per-lens saturation — the deterministic terminator, not a count, not a feel):** **every applicable
lens** for this phase (per the Coverage-lenses table, tier-scoped) is `saturated` or `N/A (reason)`, AND
the approach is clear, AND the integration check (c) is clean — OR the engineer explicitly says proceed. A
lens is `saturated` when no remaining question in it passes all three filters. There is still **no question
cap**: a cross-cutting change saturates each lens only after many questions; a tight one saturates fast.
The "≈3+ is a smell" prompt is gone — the reflection checkpoint only redirects you to the next unsaturated
lens.

## Circularity soft-cut
Track which decision dimensions the engineer revised. Same dimension revised **twice** → fire a blocking
`AskUserQuestion`: "Proceed and write the design" vs "Hold off — keep discussing." New-dimension
revisions proceed without limit. Identity is by underlying decision, not wording.

## Phase C — Synthesis + confirmation gate
**Stage 1 (internal, never pasted):** three buckets — Confirmed (decided with the engineer) · Inferred
(your bets, made explicit) · Out of scope (deliberate exclusions / deferred).
**Stage 2 (chat):** what two engineers would confirm before writing the design — *"OK, so: approach X,
with trade-off Y, deferring Z; two things I want to flag — W (blast radius) and V (failure path). Sound
right?"* Sections (render-conditional, omit when empty):
1. **What we're building** (always; 1–3 sentences, forward-looking, no qualifiers).
2. **Key trade-offs / risks** (keep test: would the engineer be surprised if unsurfaced?).
3. **What's not in scope / deferred** (keep test: would a downstream reader ask "why isn't X here?").
4. **Call-outs** (0–3; affirmability test — a call-out that reads like a question you could have asked
   now means the integration check failed; ask it instead).
5. **Coverage map** (always) — the **per-lens ledger** for this phase: one line per applicable lens with
   its final status (`saturated` / `surfaced-new` / `N/A (reason)`) + a few words on what it surfaced or
   why it's N/A. e.g. *"✅ EL1 contracts · ✅ EL2 blast-radius (3 callers, in scope) · ✅ EL5 failure-paths ·
   ⊘ EL9 N/A (no new surface) · EL10 observability ✅."* This is the auditable "are we done?" — per
   category, not a gut-feel. Keep one sub-line of raw counts beneath: *"Asked N across <lenses>; M surfaced
   new; P routed to the assumptions ledger; full transcript in `design-qa-log.md`."*

**Path A** (Lightweight AND zero questions fired): announce "What we're building" + coverage, proceed
same turn, no confirmation wait.
**Path B** (anything else): full synthesis + **unconditional confirmation**. **A revision is not a
confirmation** — integrate, re-present, wait for explicit confirm. Never write the design after a
revision without re-confirming.

**Persist the ledger (carry-forward).** On confirmation, write the per-lens ledger to
`spec.json.critique_coverage[]` (phase, lens id, status, reason-if-N/A, the `design-qa-log.md` question
ids). Later phases **inherit** it: HLD reads discovery's scope ledger, LLD reads HLD's, and
`validate-design` audits the **union** of HLD+LLD — any applicable lens left `untouched`/`probed` is a gate
finding. This is what makes coverage auditable across the whole spec, not just one session.

## Where the output lands (host skill wires this)
- **Every Q&A turn (incl. bot-answered) → `design-qa-log.md`** (append-only; the raw transcript + seed bank).
- **The per-lens ledger → `spec.json.critique_coverage[]`** (carried forward; audited by validate-design).
- Surfaced edge cases / failure paths / blast-radius findings + their `🔧 basis` → the host artifact
  (`research.md` for design phases, `brief.md` for discovery, `design-review.md` for validate-design).
- Decision-relevant items resolved with the engineer → `decisions.md` (via the host skill's feedback step).
- Items that need a spike/benchmark/longer look → an **assumptions-to-verify ledger** in `research.md`
  (basis + which decision rests on it), so the next phase inherits them as priority targets.

