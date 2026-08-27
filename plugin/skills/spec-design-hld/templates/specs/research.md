# Research & Design Decisions Template

---
**Purpose**: Capture discovery findings, architectural investigations, and rationale that inform the technical design.

**Usage**:
- Log research activities and outcomes during the discovery phase.
- Document design decision trade-offs that are too detailed for `design.md`.
- Provide references and evidence for future audits or reuse.
- Write in plain, simple English. Follow the document-style rule.
---

## Summary
- **Feature**: `<feature-name>`
- **Discovery Scope**: New Feature / Extension / Simple Addition / Complex Integration
- **Key Findings**:
  - Finding 1
  - Finding 2
  - Finding 3

## Research Log
Document useful investigation steps and outcomes. Group entries by topic.

### [Topic or Question]
- **Context**: What triggered this investigation?
- **Sources Consulted**: Links, documentation, API references, benchmarks
- **Findings**: Concise bullet points summarizing the insights
- **Implications**: How this affects architecture, contracts, or implementation

_Repeat the subsection for each major topic._


> Write this section even when `artifacts.research` is `false`.
> That flag skips the discovery log, not this evidence log.

| Query | Tool (semantic/bm25) | Top result(s) `repo · path:line · Class#method` | Body-verified? | Used for |
|-------|----------------------|--------------------------------------------------|----------------|----------|
| "how does X work" | semantic | other-service · src/...:120 · XService#handle | yes | current flow |

- **Index snapshot caveat**: results reflect the index at query time; line numbers may drift.
- **Coverage caveat**: methods/classes/endpoints in indexed repos only — no SQL/migrations/IaC/config.

## Architecture Pattern Evaluation
List options that were considered. Use the table when it is easier to scan.

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Hexagonal | Ports & adapters abstraction around core domain | Clear boundaries, testable core | Requires adapter layer build-out | Aligns with existing steering principle X |

## Design Decisions
Record decisions that shape the design. Focus on choices with real trade-offs.

### Decision: `<Title>`
- **Context**: Problem or requirement driving the decision
- **Alternatives Considered**:
  1. Option A — short description
  2. Option B — short description
- **Selected Approach**: What was chosen and how it works
- **Rationale**: Why this approach fits the current project context
- **Trade-offs**: Benefits vs. compromises
- **Follow-up**: Items to verify during implementation or testing

_Repeat the subsection for each decision._

## Risks & Mitigations
- Risk 1 — Proposed mitigation
- Risk 2 — Proposed mitigation
- Risk 3 — Proposed mitigation

## References
Provide canonical links and citations (official docs, standards, ADRs, internal guidelines).
- [Title](https://example.com) — brief note on relevance
- ...
