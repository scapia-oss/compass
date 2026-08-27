# Design Q&A Log — <feature-name>
<!-- Append-only transcript of the architect-critique loop (rules/architect-critique-loop.md Phase B),
     across every phase that runs it: discovery (problem/scope), spec-design-hld (architecture),
     spec-design-lld (contracts), validate-design (audit). The raw evidence + the SEED BANK that
     HLD→LLD→tasks→impl→regression-verifier inherit. research.md/decisions.md hold the synthesis; THIS
     file holds the dialogue that produced it.

     NEVER rewrite or prune entries — a reversal is a NEW entry referencing the earlier Q#. Each entry is
     logged the instant it resolves, with a TIMESTAMP, its phase, its Coverage lens (EL/SL id), the shown
     🔧 basis (engineer audience — keep the code ref), and an "Answered by":
       • human — the question was put to the engineer and they answered (a design/scope decision).
       • bot   — the agent resolved it ITSELF from the traced code/steering and consciously did NOT ask
                 (already decided by how the system works, or a reasoned default). Logged WITH its basis —
                 a verified-reality finding the next phase inherits, and the reason a lens saturated
                 without a turn.
     (Items that need a spike/benchmark go to research.md → Assumptions-to-Verify, NOT here as bot-answered.)
     Stamp each entry with real wall-clock time (`date +"%F %H:%M"`). -->

**Feature:** `<feature-name>` · **Spec type:** <feature|bugfix|tech-debt|chore>

## Coverage ledger (mirrors `spec.json.critique_coverage[]`)
<!-- One row per applicable lens, per phase. Lens sets + tier scoping: rules/architect-critique-loop.md.
     Status ∈ untouched | probed | surfaced-new | saturated | N/A (reason). validate-design audits the
     union of the HLD + LLD rows. -->
| Phase | Lens | Status | Q# | Note (what surfaced / why N/A) |
|---|---|---|---|---|
| discovery | SL1 who/why | <status> | <Q#> | <one line> |
| spec-design-hld | EL1 contracts | <status> | <Q#> | <one line> |
| spec-design-lld | EL4 idempotency | <status> | <Q#> | <one line> |
<!-- … one row per applicable lens for each phase that ran … -->

---

## Transcript (append-only, chronological)
<!-- Repeat per entry. Open-ended rigor probes have no options. Answered-by ∈ human | bot.
     Surfaced ∈ new | confirmed | deferred (→ research.md assumptions ledger). -->

### Q1 · [discovery · SL5] · Answered by: human · <YYYY-MM-DD HH:MM>
- **Asked:** <question — keep the technical framing; engineers answer engineering>
- **Options:** A) … · B) … · C) …          <!-- omit for open-ended probes -->
- **Answer:** <verbatim / essence>
- **Surfaced:** new | confirmed | deferred
- **🔧 basis:** `direct:` / `reasoned:` — <repo · path:line · Class#method (read)>
- **→ Seeds:** brief.md boundary · decisions.md D-2

### Q2 · [spec-design-hld · EL2] · Answered by: bot · <YYYY-MM-DD HH:MM>
<!-- Self-resolved from the trace — not asked. Shows why EL2 saturated without a turn. -->
- **Question (self-resolved, not asked):** "Which callers break if `OrderService#applyDiscount` signature changes?"
- **Answer (bot):** BM25 shows 2 callers, both in this repo's checkout flow, both already in spec scope → no contract breaks outside the slice; no engineer decision needed.
- **Surfaced:** confirmed
- **🔧 basis:** `direct:` — this-repo · checkout/CartController.java:88, checkout/QuoteService.java:142 (read)
- **→ Seeds:** research.md grounding log (blast radius) · contributes to EL2 `saturated`.

<!-- Re-decision example (append, never edit):
### Q9 · [spec-design-lld · EL4] · Answered by: human · <…> — RE-DECIDES Q5
- **Answer:** "Reuse the original idempotency key on retry, not a fresh one."
- **Surfaced:** new
- **→ Seeds:** updates decisions.md D-4; circularity soft-cut: idempotency dimension revised 1×.
-->
