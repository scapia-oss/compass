# Low-Level Design Document Template

---
**Purpose**: Provide detailed component interfaces, data models, and implementation contracts that translate the high-level architecture (from `design-hld.md`) into actionable specifications for implementers.

**Prerequisite**: Load the approved `design-hld.md` before writing this file. It contains the architecture, flows, and Component Summary that this LLD expands.

**Approach**:
- Write in plain, simple English. Follow the document-style rule.
- Expand each component from the HLD Component Summary into full detail blocks
- Define precise interfaces, contracts, and data models
- Do NOT duplicate architecture, overview, goals, or system flows from the HLD
- Use diagrams, tables, and small shape-only snippets before prose

**Warning**: Approaching 1000 lines indicates excessive feature complexity that may require design simplification.
---

> For each component, list requirement IDs as `2.1, 2.3`. Do not write "Requirement".
> If components share the same contract, define it once and reference it.

> Pick the repo framing:
> - **Backend / service repo:** document APIs, events, schemas, jobs, services, and datastore changes this repo owns.
> - **Frontend / app repo:** document upstream APIs this app calls, plus routes, screens, widgets, state, and local cache. Do not invent backend APIs or server tables.
> Use only the contract sections that apply.

## Changed in this revision

At most 5 bullets, one line each, rewritten from scratch every time this file is regenerated — this is a
pointer for a returning reviewer, never a running history. Each line ends with `→ D-<n>` when a decision
drives it. On the first version, write `First version.`

- [what changed since the last review, one line] → D-n

## Flow

Include this section only when this spec has **no** HLD (`spec.json.artifacts.design_hld` is false).
When an HLD exists, delete this section and rely on the HLD's System Flows — do not copy it here.

One line, in plain domain words, no class names: the path the main request takes. Example:
`search → review → checkout → book → poll → ticket`. Add a Mermaid diagram only if it makes a branching
flow clearer; the plain line stays either way.

## Component map

One row per component below — the reader's index into this file. Do not replace a component's detail
block with its map row; the block still carries the full contract.

| Component | New / Change | What it does (one line) | Requirements | Anchor |
|-----------|--------------|-------------------------|--------------|--------|
| ExampleService | new | turns X into Y | 2.1, 2.3 | #exampleservice |

## Components and Interfaces

Group details by domain or layer. Every HLD Component Summary row needs a matching block here.

### [Domain / Layer]

#### [Component Name]

| Field | Detail |
|-------|--------|
| Intent | 1-line description of the responsibility |
| Requirements | 2.1, 2.3 |
| Owner / Reviewers | (optional) |

**Responsibilities & Constraints**
- Primary responsibility
- Domain boundary and transaction scope
- Data ownership and the rules that must always hold

**Dependencies**
- Inbound: Component/service name — purpose (Criticality)
- Outbound: Component/service name — purpose (Criticality)
- External: Service/library — purpose (Criticality)

Summarize external dependencies here. Put deep notes such as API signatures, limits, and migration details in `research.md`.

**Contracts**: Service [ ] / API [ ] / Event [ ] / Batch [ ] / State [ ]  ← check only the ones that apply.

##### Service Interface
> Write the shape in this repo's language. Detect it from build files: `pom.xml` or `build.gradle` means Java/Kotlin, `pubspec.yaml` means Dart, `go.mod` means Go, and `package.json` means TypeScript. If steering says something different, steering wins. Never default to TypeScript.

```
[ComponentName]Service:
  methodName(input: InputType) -> Result<OutputType, ErrorType>
```
- Preconditions:
- Postconditions:
- Rules that must always hold:

##### API Contract (backend / producer — this repo owns the endpoint)
| Method | Endpoint | Request | Response | Errors | Idempotency / Version |
|--------|----------|---------|----------|--------|------------------------|
| POST | /api/resource | CreateRequest | Resource | 400, 409, 500 | idempotency-key; v2 |

##### API Consumption Contract (frontend / consumer — owned upstream, pinned)
Document the upstream API this repo calls. Do not rewrite the upstream spec. Pin `id@version`, name the owner, and show how this repo handles request mapping, response mapping, loading, empty, and error states.
| Upstream contract (`id@version`) | Owning service | Method / Endpoint | This repo's handling |
|----------------------------------|----------------|-------------------|----------------------|
| `pass-status@1.2` | acme-loyalty-service | GET /pass-status | maps to `PassViewModel`; 404 → empty state; 5xx → retry with backoff |

##### Event Contract
- Published events:
- Subscribed events:
- Ordering / delivery guarantees:

##### Batch / Job Contract
- Trigger:
- Input / validation:
- Output / destination:
- Idempotency & recovery:

##### State Management
- State model:
- Persistence & consistency:
- Concurrency strategy:

**Implementation Notes**
- Integration:
- Validation:
- Risks:

## File Structure Plan


Use the repo's own words:
- Backend: `package/Class#method`, controllers, services, listeners, migrations.
- Flutter: routes, screens, widgets, providers/blocs, view models, API clients.
- Keep one responsibility per file.

Backend (producer) example:


Frontend (consumer) example:

| Repository | File path | Change | Existing construct (modify) / new | Used by (screens / routes) | Confidence |
|------------|-----------|--------|-----------------------------------|----------------------------|------------|
| app-repo | lib/.../pass_screen.dart | modify | `PassScreen` widget | `/pass` route | high |
| app-repo | lib/.../pass_provider.dart | new | — | `PassScreen` | high |
| app-repo | lib/.../rewards_api.dart | modify | `RewardsApi.getPassStatus` (binds `pass-status@1.2`) | `PassProvider` | high |


## Key Code Shapes

Show small code shapes for the files that carry the main implementation risk.

Include only what helps the implementer:
- Java/Spring service, controller, DTO, repository, event, or migration shape
- Flutter route, screen, widget, provider/bloc, view model, API client, or local cache shape
- SQL migration shape when storage changes

Do not write full business logic. Do not include final production code. Keep snippets shape-only.

```java
interface ExampleService {
    ExampleResult handle(ExampleRequest request);
}
```

```dart
abstract class ExampleApi {
  Future<ExampleDto> fetchExample();
}
```

```sql
ALTER TABLE example ADD COLUMN status VARCHAR(32) NOT NULL;
```

## Data Models

Focus only on data that changes with this feature.

### Domain Model
- Aggregates and transactional boundaries
- Entities, value objects, domain events
- Business rules and the rules that must always hold
- Optional Mermaid diagram for complex relationships

### Logical Data Model

**Structure Definition**:
- Entity relationships and cardinality
- Attributes and their types
- Natural keys and identifiers
- Referential integrity rules

**Consistency & Integrity**:
- Transaction boundaries
- Cascading rules
- Temporal aspects (versioning, audit)

### Physical Data Model
**When to include**: include this for backend or storage-owning repos. Flutter apps skip server tables and document only local storage, if any.

**For Relational Databases**:
- Table definitions with data types
- Primary/foreign keys and constraints
- Indexes and performance optimizations
- Partitioning strategy for scale

**For Document Stores**:
- Collection structures
- Embedding vs referencing decisions
- Sharding key design
- Index definitions

**For Event Stores**:
- Event schema definitions
- Stream aggregation strategies
- Snapshot policies
- Projection definitions

**For Key-Value/Wide-Column Stores**:
- Key design patterns
- Column families or value structures
- TTL and compaction strategies

### Data Contracts & Integration

**API Data Transfer**
- Request/response schemas
- Validation rules
- Serialization format (JSON, Protobuf, etc.)

**Event Schemas**
- Published event structures
- Schema versioning strategy
- Backward/forward compatibility rules

**Cross-Service Data Management**
- Distributed transaction patterns (Saga, 2PC)
- Data synchronization strategies
- Eventual consistency handling

Skip subsections that are not relevant to this feature.

## Error Handling

### Error Strategy
List the error types, user result, system action, and recovery path.

### Error Categories and Responses
**User Errors** (4xx): Invalid input → field-level validation; Unauthorized → auth guidance; Not found → navigation help
**System Errors** (5xx): Infrastructure failures → graceful degradation; Timeouts → circuit breakers; Exhaustion → rate limiting
**Business Logic Errors** (422): Rule violations → condition explanations; State conflicts → transition guidance

**Process Flow Visualization** (when complex business logic exists):
Include Mermaid flowchart only for complex error scenarios with business workflows.

### Monitoring
Logging, metrics, alerts, and health checks that matter for this feature.

## Testing Strategy

### Default sections (adapt names/sections to fit the domain)
- Unit Tests: 3–5 items from core functions/modules (e.g., auth methods, subscription logic)
- Integration Tests: 3–5 cross-component flows (e.g., webhook handling, notifications)
- E2E/UI Tests (if applicable): 3–5 critical user paths (e.g., forms, dashboards)
- Performance/Load (if applicable): 3–4 items (e.g., concurrency, high-volume ops)

## Optional Sections (include when relevant)

### Security Considerations
_Use this section for features handling auth, sensitive data, external integrations, or user permissions. Capture only decisions unique to this feature; defer baseline controls to steering docs._
- Threat modeling, security controls, compliance requirements
- Authentication and authorization patterns
- Data protection and privacy considerations

### Performance & Scalability
_Use this section when performance targets, high load, or scaling concerns exist. Record only feature-specific targets or trade-offs and rely on steering documents for general practices._
- Target metrics and measurement strategies
- Scaling approaches (horizontal/vertical)
- Caching strategies and optimization techniques

### Migration Strategy
Include a Mermaid flowchart showing migration phases when schema/data movement is required.
- Phase breakdown, rollback triggers, validation checkpoints

## Supporting References (Optional)
- Create this section only when keeping the information in the main body would hurt readability (e.g., very long interface/type definitions, vendor option matrices, exhaustive schema tables). Keep decision-making context in the main sections so the design stays self-contained.
- Link to the supporting references from the main text instead of inlining large snippets.
- Background research notes and comparisons continue to live in `research.md`, but their conclusions must be summarized in the main design.
