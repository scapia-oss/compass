# Gap Analysis Process

## Objective
Analyze the gap between requirements and existing codebase to inform implementation strategy decisions.

Write the report in plain, simple English. Follow `rules/document-style.md`.

## Analysis Framework

### 1. Current State Investigation

Use facts only. Cite `file:line` where possible.

| What to check | Output |
|---|---|
| Key files/modules | paths and short role |
| Reusable code | components, services, utilities |
| Existing patterns | naming, layering, dependency direction |
| Tests | test location and current coverage shape |
| Integration surfaces | APIs, schemas, events, auth, clients |

### 2. Requirements Feasibility Analysis

Map requirements to what the code already has.

| Requirement | Existing asset | Gap | Constraint / unknown |
|---|---|---|---|
| 1.1 | `path/Class#method` | Missing / Unknown / Constraint | short note |

Mark unknowns as `Research Needed`. Do not guess.

### 3. Implementation Approach Options

Show only real options. Do not list all three if only one is credible.

| Option | When it fits | Pros | Risks | Evidence |
|---|---|---|---|---|
| Extend existing | fits current structure | short | short | `file:line` |
| Create new | distinct responsibility | short | short | `file:line` |
| Hybrid | both are needed | short | short | `file:line` |

State the preferred option in one line. State one rejected option and why, if it was a serious contender.

### 4. Out-of-Scope for Gap Analysis

- Defer deep research activities to the design phase.
- Record unknowns as concise "Research Needed" items only.

### 5. Implementation Complexity & Risk

Use labels plus one-line reasons.

| Label | Meaning |
|---|---|
| Effort S | 1-3 days; existing patterns; small integration |
| Effort M | 3-7 days; some new integration or moderate complexity |
| Effort L | 1-2 weeks; multiple workflows or broad functionality |
| Effort XL | 2+ weeks; architecture shift, migration, or unfamiliar tech |
| Risk Low | clear scope, familiar code, minimal integration |
| Risk Medium | new pattern or integration with known path |
| Risk High | unknown tech, broad impact, unclear security/performance path |

### Output Checklist

- Requirement-to-Asset Map with gaps tagged (Missing / Unknown / Constraint)
- Options A/B/C with short rationale and trade-offs
- Effort (S/M/L/XL) and Risk (High/Medium/Low) with one-line justification each
- Recommendations for design phase:
  - Preferred approach and key decisions
  - Research items to carry forward
- Critical files list:
  - 3-5 files or constructs most important for implementation
  - Use backend names such as `Controller`, `Service`, `Repository`, table, migration
  - Use Flutter names such as route, screen, widget, provider/bloc, view model, API client

## Principles

- **Information over decisions**: Provide analysis and options, not final choices
- **Multiple viable options**: Offer credible alternatives when applicable
- **Explicit gaps and assumptions**: Flag unknowns and constraints clearly
- **Context-aware**: Align with existing patterns and architecture limits
- **Transparent effort and risk**: Justify labels succinctly
- **Simple format first**: Use diagrams or tables when they make the gap easier to see
