# High-Level Design Document Template

---
**Purpose**: Capture architectural decisions, system boundaries, and component overview at a level sufficient for stakeholder review before committing to implementation details.

**Approach**:
- Write in plain, simple English. Follow the document-style rule.
- Prefer diagrams and tables. Use prose only for decisions, trade-offs, and risks.
- Focus on architecture, boundaries, and flows. Do not include implementation contracts.
- **No current-state narrative.** Do not add a "Current State", "As-Is", or "Existing Architecture" section
  and do not walk through how the system works today. The design states what we are building and what
  changes; codebase grounding still runs, but its evidence lives in `research.md`
- Include visual diagrams when they make the shape easier to review
- Provide a Component Summary table as a bridge to the Low-Level Design phase
- Match detail level to feature complexity

**Warning**: Approaching 500 lines indicates excessive scope for a high-level design — consider simplifying or splitting the feature.
---

> Sections may be reordered when it improves clarity. Keep the same headings. In each section, lead with the useful answer first, then add scope, decisions, impacts, and risks.

## Changed in this revision

At most 5 bullets, one line each, rewritten from scratch every time this file is regenerated — a pointer
for a returning reviewer, never a running history. Each line ends with `→ D-<n>` when a decision drives
it. On the first version, write `First version.`

- [what changed since the last review, one line] → D-n

## Overview
Write 1-2 short sentences: what changes, why it matters, and the scope boundary.

| Item | Answer |
|------|--------|
| Purpose | [specific value] |
| Users | [target users and workflow] |
| Impact | [what changes, if meaningful] |


### Goals
- Primary objective 1
- Primary objective 2
- Success criteria

### Non-Goals
- Explicitly excluded functionality
- Future considerations outside current scope
- Integration points deferred

## Architecture

> Keep this file self-contained for review. Put decisions here. Put discovery notes and current-system evidence in `research.md`.
> Let diagrams show structure. After a diagram, add only decisions, risks, or notes that are not obvious from the diagram.

### Architecture Pattern & Boundary Map
**RECOMMENDED**: Include a Mermaid diagram when 3 or more parts interact. Use a C4-style view when it fits: context, container, or component.

**Architecture Integration**:
- Selected pattern: [name and brief rationale]
- Domain/feature boundaries: [how responsibilities are separated to avoid conflicts]
- Existing patterns preserved: [list key patterns]
- New components rationale: [why each is needed]
- Steering compliance: [principles maintained]

### Technology Stack

| Layer | Choice / Version | Role in Feature | Notes |
|-------|------------------|-----------------|-------|
| Frontend / CLI | | | |
| Backend / Services | | | |
| Data / Storage | | | |
| Messaging / Events | | | |
| Infrastructure / Runtime | | | |

> Keep rationale concise here and, when more depth is required (trade-offs, benchmarks), add a short summary plus pointer to `research.md` for raw investigation notes.

## System Flows

Show only the diagrams needed to explain non-trivial flows. Use pure Mermaid syntax. Common patterns:
- Sequence (multi-party interactions)
- Process / state (branching logic or lifecycle)
- Data / event flow (pipelines, async messaging)

Skip this section entirely for simple CRUD changes.
> After the diagram, describe only key decisions such as gates, retries, or failure paths. Do not repeat every step.

## Change Surface (APIs, Contracts & Impact)

> Show what changes outside one component: APIs, events, tables, screens, areas, and repos.
> Use names and change type only. Do not include request/response bodies or full file lists here.
> Put those details in the LLD.
>
> Describe the new change. Do not explain today's full system. Current-system evidence lives in `research.md`.
>
> Pick the framing that matches the repo:
> - **Backend / service repo:** list APIs, events, and schemas this repo exposes or changes. Name the consumers.
> - **Frontend / app repo:** list upstream APIs this app calls and the screens/routes that change. Do not invent backend APIs.
>
> Omit Contract Delta and Impacted Areas for a trivial single-repo change with no contract movement.
> Keep Impacted Repositories when more than one repo is touched.

### Contract Delta

**Backend (producer) framing** — APIs, events, and schemas this repo owns or calls:

| Surface (endpoint / event / table) | Direction | Change class | Affected consumers | Channel |
|-------------------------------------|-----------|--------------|--------------------|---------|
| `POST /v2/example` | produce | additive (new version) | other-service, app | HTTP |
| `order.created` event | produce | breaking (field removed) | billing-service | Kafka |
| `deferred-credit/release` | consume | additive (new dependency) | this repo calls it | HTTP |

**Frontend (consumer) framing** — upstream contracts this repo binds to and pins:

| Upstream contract (`id@version`) | Owning service | Direction | Change for this repo |
|----------------------------------|----------------|-----------|----------------------|
| `pass-status@1.2` | acme-loyalty-service | consume | new binding (pinned) |

- **Change class:** `additive` (backward-compatible) · `breaking` (consumers must change) · `unchanged` (reused).
- Every `breaking` row needs a one-line migration/compatibility note here — do not defer it to the LLD.
- Rows that cross a service boundary are **pinned `id@version`** and hardened in the LLD per
  the **contract-negotiation** rule; intra-repo API changes belong in this table too.

### Impacted Areas

Show which backend areas or Flutter screens/features change, and why. This is not a file list. Exact files live in the LLD.

| Area / subsystem (backend) · feature area / screen (frontend) | New / Extend | Why it is touched |
|---------------------------------------------------------------|--------------|-------------------|
| `lounge/action` — Claim & Upload | new + extend | activate-first generation and late upload |
| `/pass` screen + pass provider (frontend) | extend | renders the new pass-status binding |

### Impacted Repositories

List every repo this change touches. Include why, confidence, and source.


> Call out infra, data, and config impact explicitly: SQL, migrations, IaC, and feature flags.
> Code search may miss these.

## Requirements Traceability

Use this section for complex or compliance-sensitive features where requirements span multiple domains. Straightforward 1:1 mappings can rely on the Component Summary table.

Map each requirement ID (e.g., `2.1`) to the design elements that realize it.

| Requirement | Summary | Components | Interfaces | Flows |
|-------------|---------|------------|------------|-------|
| 1.1 | | | | |
| 1.2 | | | | |

> Omit this section only when a single component satisfies a single requirement without cross-cutting concerns.

## Component Summary

Provide a quick table of all components. This table feeds the LLD. Do not add detailed interfaces here.

| Component | Domain/Layer | Intent | Req Coverage | Key Dependencies (P0/P1) | Contracts |
|-----------|--------------|--------|--------------|--------------------------|-----------|
| ExampleComponent | UI | Displays XYZ | 1, 2 | GameProvider (P0), MapPanel (P1) | Service, State |

- Only list components here; full detail blocks (interfaces, contracts, dependencies) belong in `design-lld.md`
- Include enough context for reviewers to assess architectural completeness
- Mark key dependencies with criticality (P0 blocking, P1 high-risk, P2 informational)
