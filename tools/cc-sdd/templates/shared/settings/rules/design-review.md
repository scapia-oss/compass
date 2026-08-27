# Design Review Process

## Objective
Review the design against the codebase and decide if it is ready for implementation. This is a gate: GO or NO-GO.
Use `architect-questioning.md` and `architect-question-catalog.md` to find issues the design loop should catch.
Write the review in plain, simple English. Follow `rules/document-style.md`.

## Review Philosophy
- **Evidence over opinion**: ground every blocker in code or steering. A finding without evidence is a question, not a blocker.
- **Prioritize, never suppress**: lead with the most important blockers. Do not hide real issues to keep the report short.
- **Quality assurance, not perfection seeking**: acceptable risk is GO with a call-out. Do not invent blockers.
- **Interactive dialogue**: Engage with the designer, push back once or twice per topic, then converge.
- **Balanced assessment**: Recognize genuine strengths and weaknesses.
- **Clear decision**: Definitive GO/NO-GO with rationale.

## Scope & Non-Goals

- Scope: Evaluate the quality of the design document against project context and standards to decide GO/NO-GO.
- Non-Goals: Do not perform implementation-level design, deep technology research, or finalize technology choices. Defer such items to the design phase iteration.

## Core Review Criteria

### 1. Existing Architecture Alignment (Critical)
- Integration with existing system boundaries and layers
- Consistency with established architectural patterns
- Proper dependency direction and coupling management
- Alignment with current module organization

### 2. Design Consistency & Standards
- Adherence to project naming conventions and code standards
- Consistent error handling and logging strategies
- Uniform configuration and dependency management
- Alignment with established data modeling patterns
- Plain language: uses simple words, concrete names, and short bullets/tables where useful. Flag jargon when a simpler accurate word exists.

### 3. Extensibility & Maintainability
- Design flexibility for future requirements
- Clear separation of concerns and single responsibility
- Testability and debugging considerations
- Appropriate complexity for requirements

### 4. Type Safety & Interface Design
- Proper type definitions and interface contracts
- Avoidance of unsafe patterns (e.g., `any` in TypeScript)
- Clear API boundaries and data structures
- Input validation and error handling coverage

## Review Process

### Step 1: Analyze (code-grounded)
Analyze the design against the review criteria and `architect-questioning.md`.
Compare it with verified codebase facts from `codebase-grounding.md`.
Focus on integration, failure paths, affected files, maintainability, complexity, and requirement coverage.

### Step 2: Identify Blocking Issues (prioritized, evidence-backed)
List blockers in priority order. Include every verified failure path, affected-file risk, or correctness issue. Do not pad. Do not hide real issues. For each issue:
```
🔴 **Blocking Issue [n]**: [Brief title]
**Concern**: [Specific problem]
**Impact**: [Why it matters — one plain sentence: what breaks, or what it costs, if we ship it wrong. A new joiner should get it without a glossary.]
**Suggestion**: [Concrete improvement]
**Traceability**: [Requirement ID/section from requirements.md]
**🔧 basis**: [repo · path:line · Class#method, or steering rule — the evidence this rests on]
```

### Step 3: Recognize Strengths
Acknowledge 1-2 strong aspects to maintain balanced feedback.

### Step 4: Decide GO/NO-GO
- **GO**: No critical architectural misalignment, requirements addressed, clear implementation path, acceptable risks
- **NO-GO**: Fundamental conflicts, critical gaps, high failure risk, disproportionate complexity

## Traceability & Evidence

- Link each critical issue to the relevant requirement(s) from `requirements.md` (ID or section).
- Cite evidence locations in the design document (section/heading, diagram, or artifact) to support the assessment.
- When applicable, reference constraints from steering context to justify the issue.

## Output Format

### Design Review Summary
2-3 sentences on overall quality and readiness.

### Blocking Issues (prioritized, evidence-backed)
For each: Issue, Impact, Recommendation, Traceability (e.g., 1.1, 1.2), and `🔧 basis` (repo · path:line or steering rule). Count follows the evidence.

### Design Strengths
1-2 positive aspects.

### Final Assessment
Decision (GO/NO-GO), Rationale (1-2 sentences), Next Steps.

### Interactive Discussion
Engage on designer's perspective, alternatives, clarifications, and necessary changes.

## Length & Focus

- Summary: 2–3 sentences
- Each blocking issue: 5–7 lines total (including Issue/Impact/Recommendation/Traceability/`🔧 basis`)
- Keep each issue tight. The review may run longer when the evidence shows several real breaks.

## Review Guidelines

1. **Blocking Focus**: Flag every issue that significantly impacts success; don't bikeshed nits, don't suppress real breaks
2. **Constructive Tone**: Provide solutions, not just criticism
3. **Interactive Approach**: Engage in dialogue rather than one-way evaluation
4. **Balanced Assessment**: Recognize both strengths and weaknesses
5. **Clear Decision**: Make definitive GO/NO-GO recommendation
6. **Actionable Feedback**: Ensure all suggestions are implementable

## Final Checklist

- **Blocking issues prioritized** (most-important-first) and each includes Impact and Recommendation
- **Traceability**: Each issue references requirement ID/section
- **🔧 basis**: Each blocking issue cites the code/steering evidence it rests on (and design doc location)
- **Decision**: GO/NO-GO with clear rationale and next steps
