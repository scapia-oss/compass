---
name: kiro-validate-gap
description: Analyze implementation gap between requirements and existing codebase. Use when planning integration with existing systems.
allowed-tools: Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, Agent, AskUserQuestion
argument-hint: <feature-name>
metadata:
  shared-rules: "document-style.md, command-tracking.md, gap-analysis.md, lifecycle-navigation.md, codebase-grounding.md, global-context-loading.md, learning-promotion.md"
  shared-scripts: "record-command-fired.py, validate-patterns-append-only.py"
---

# kiro-validate-gap Skill

## Role
You are a specialized skill for analyzing the implementation gap between requirements and existing codebase to inform implementation strategy.

## Core Mission
- **Mission**: Analyze the gap between requirements and existing codebase to inform implementation strategy
- **Success Criteria**:
  - Comprehensive understanding of existing codebase patterns and components
  - Clear identification of missing capabilities and integration challenges
  - Multiple viable implementation approaches evaluated
  - Technical research needs identified for design phase

## Execution Steps

### Step 1: Gather Context

**Spec Path Resolution**: The feature directory may be in one of five locations (check in this order):
1. `{{KIRO_DIR}}/specs/features/<feature>/spec.json` (categorized feature)
2. `{{KIRO_DIR}}/specs/bugs/<feature>/spec.json` (categorized bugfix)
3. `{{KIRO_DIR}}/specs/tech-debt/<feature>/spec.json` (categorized tech debt)
4. `{{KIRO_DIR}}/specs/chores/<feature>/spec.json` (categorized chore)
5. `{{KIRO_DIR}}/specs/<feature>/spec.json` (legacy flat structure)

If `spec.json` contains a `spec_path` field, use that as the canonical path. Otherwise, use whichever location exists. All subsequent file reads/writes for this spec use the resolved path. Throughout this skill, `{spec_dir}` denotes that resolved path; project-global paths under `{{KIRO_DIR}}/steering/`, `{{KIRO_DIR}}/learnings/`, and `{{KIRO_DIR}}/settings/` are NOT spec-relative and keep their `{{KIRO_DIR}}/` form.

**Record command fired**: Read `rules/command-tracking.md`, then run
`python3 "${CLAUDE_SKILL_DIR}/scripts/record-command-fired.py" "{spec_dir}" "kiro-validate-gap" "validate-gap"` (or `python`).

Skip re-reading a file only if its content is already present in this conversation; if you cannot point to where it was loaded, read it now. Never assume steering or spec files are already loaded.
Otherwise, load all necessary context:
- Read `{spec_dir}/spec.json` for language and metadata
- Read `{spec_dir}/requirements.md` for requirements
- Relevant local agent skills or playbooks only when they clearly match the feature's host environment or use case and provide analysis-relevant context

**Steering + cross-spec learnings + spec-scoped decisions/learnings**: follow
`${CLAUDE_SKILL_DIR}/rules/global-context-loading.md` in full — glob-all steering and cross-spec
learnings, read spec-scoped `decisions.md`/`learnings.md` if present, apply what was loaded to the
gap analysis, print the context manifest.

### Step 2: Read Analysis Guidelines
- Read `rules/gap-analysis.md` from this skill's directory for comprehensive analysis framework
- Read `rules/document-style.md` from this skill's directory for plain writing style

### Step 3: Execute Gap Analysis

#### Parallel Research


After all parallel research completes, synthesize findings for gap analysis.

- Follow gap-analysis.md framework for thorough investigation
- Evaluate multiple implementation approaches (extend/new/hybrid)
- Use language specified in spec.json for output
- Use plain, simple English from `rules/document-style.md`

### Step 4: Generate Analysis Document
- Create comprehensive gap analysis following the output guidelines in gap-analysis.md
- Present multiple viable options with trade-offs
- Flag areas requiring further research

### Step 5: Write Gap Analysis to Disk

**Write the gap analysis to disk so it survives session boundaries and can be referenced during design phase.**

- Write the gap analysis to `{spec_dir}/gap-analysis.md` (overwrite if exists — gap analysis is a point-in-time snapshot)
- Also append a summary to `{spec_dir}/research.md` (separated by `---`) for backward compatibility with design skills that read research.md
- Verify the file was written by reading it back

### Step 6: Record Learnings

If the gap analysis identified significant findings (architectural mismatches, missing capabilities, unexpected constraints):
- Record this **synchronously now** (use Write/Edit directly — do NOT dispatch a background subagent; a fire-and-forget call can be dropped when the turn ends and silently lose the record):
  - Steps (do these yourself, do not delegate): "Record a LEARNING for phase 'gap-analysis' in spec dir '{spec_dir}'. The gap analysis found: [key findings summary]. These will impact the design approach. Read {spec_dir}/learnings.md (create if missing) and append. If the finding is generalizable, follow `rules/learning-promotion.md`: dedupe against {{KIRO_DIR}}/learnings/*.md, update {{KIRO_DIR}}/learnings/patterns.md append-only, include `Source spec` pointing back to this learning entry, and run `validate-patterns-append-only.py`."
  - Finish the append before continuing.

## Important Constraints
- **Information over Decisions**: Provide analysis and options, not final implementation choices
- **Multiple Options**: Present viable alternatives when applicable
- **Thorough Investigation**: Use tools to deeply understand existing codebase
- **Explicit Gaps**: Clearly flag areas needing research or investigation
- **Context Discipline**: Start with core steering and expand only with analysis-relevant steering or use-case-aligned local agent skills/playbooks

## Tool Guidance
- **Read first**: Load spec, core steering, relevant local playbooks/agent skills, and rules before analysis
- **Grep extensively**: Search codebase for patterns, conventions, and integration points
- **WebSearch/WebFetch**: Research external dependencies and best practices when needed
- **Write last**: Generate analysis only after complete investigation

## Output Description
Provide output in the language specified in spec.json with:

1. **Analysis Summary**: Brief overview (3-5 bullets) of scope, challenges, and recommendations
2. **Document Status**: Confirm analysis approach used
3. **Next Steps**: Guide user on proceeding to design phase

**Format Requirements**:
- Use Markdown headings for clarity
- Keep summary concise (under 300 words)
- Detailed analysis follows gap-analysis.md output guidelines

## Safety & Fallback

### Error Scenarios
- **Missing Requirements**: If requirements.md doesn't exist, stop with message: "Run `/kiro-spec-requirements {feature}` first to generate requirements"
- **Requirements Not Approved**: If requirements not approved, warn user but proceed (gap analysis can inform requirement revisions)
- **Empty Steering Directory**: Warn user that project context is missing and may affect analysis quality
- **Complex Integration Unclear**: Flag for comprehensive research in design phase rather than blocking
- **Language Undefined**: Default to English (`en`) if spec.json doesn't specify language

### Next Phase: Design Generation

**If Gap Analysis Complete**:
- Review gap analysis insights
- **Compute the next command from `rules/lifecycle-navigation.md`** (do not hardcode a design command): read `spec_type`, `workflow`, and `artifacts` from spec.json and route to the first enabled design phase —
  - `artifacts.design_hld` enabled → `/kiro-spec-design-hld {feature}`
  - else `artifacts.design_lld` enabled → `/kiro-spec-design-lld {feature}`
  - else (older specs with neither HLD/LLD toggle) → `/kiro-spec-design {feature}` (combined design)
  - Emit the **bare** command (no `-y`). Add a one-line note: "⚙ optional: add `-y` to auto-approve requirements and skip your review — fast-track for low-risk specs only; default is to review first."
- This keeps gap analysis consistent with the HLD/LLD split and artifact toggles instead of always sending the user to the combined `spec-design`.

**Note**: Gap analysis is optional but recommended for brownfield projects to inform design decisions.
