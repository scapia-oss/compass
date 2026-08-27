# Agentic SDLC and Spec-Driven Development

Kiro-style Spec-Driven Development on an agentic SDLC

## Project Context

### Paths
- Steering: `{{KIRO_DIR}}/steering/`
- Specs: `{{KIRO_DIR}}/specs/`

### Steering vs Specification

**Steering** (`{{KIRO_DIR}}/steering/`) - Guide AI with project-wide rules and context
**Specs** (`{{KIRO_DIR}}/specs/`) - Formalize development process for individual features

### Active Specifications
- Check `{{KIRO_DIR}}/specs/features/` for feature specifications
- Check `{{KIRO_DIR}}/specs/bugs/` for bugfix specifications
- Check `{{KIRO_DIR}}/specs/tech-debt/` for tech debt specifications
- Check `{{KIRO_DIR}}/specs/chores/` for chore specifications
- Legacy specs may exist directly under `{{KIRO_DIR}}/specs/`
- Use `/kiro-spec-status [feature-name]` to check progress

## Development Guidelines
{{DEV_GUIDELINES}}

## Spec Types & Workflows

### Spec Types
- **Feature**: Full workflow (requirements → design → tasks → implementation)
- **Bugfix**: Lightweight flow (bugfix analysis → tasks → implementation, design phases skipped)
- **Tech Debt**: Focused flow (requirements → optional design → tasks → implementation)
- **Quick Change**: No spec needed (triage recommends skipping SDD)

### Workflow Approaches (features only)
- **Requirements First** (default): Requirements → Design → Tasks
- **Design First**: Design → Requirements (derived) → Tasks

### Design Artifacts (features only)
- **High-Level Design** (`/kiro-spec-design-hld`): Architecture, system flows, component overview
- **Low-Level Design** (`/kiro-spec-design-lld`): Interfaces, data models, contracts
- **Combined Design** (`/kiro-spec-design`): Both HLD + LLD in one step
- **Research Log**: External API investigation, technology comparison (toggle on/off)

## Minimal Workflow
- Phase 0 (optional): `/kiro-steering`, `/kiro-steering-custom`
- Discovery: `/kiro-discovery "idea"` — determines action path, writes brief.md + roadmap.md for multi-spec projects
- Phase 1 (Specification):
  - Single spec (adaptive depth): `/kiro-spec-quick {feature} [--auto]` — auto-picks MINIMAL (one inline pass, no design/gates) for a tiny low-risk change or STANDARD (requirements → design-if-warranted → tasks → sanity) otherwise; `--minimal`/`--standard` to force. Or step by step:
    - `/kiro-spec-init "description"` (includes triage + spec type + workflow + artifact selection)
    - `/kiro-spec-requirements {feature}`
    - `/kiro-validate-gap {feature}` (optional: for existing codebase)
    - `/kiro-spec-design {feature} [-y]` or split into:
      - `/kiro-spec-design-hld {feature} [-y]` (high-level design)
      - `/kiro-spec-design-lld {feature} [-y]` (low-level design)
    - `/kiro-validate-design {feature}` (optional: design review)
    - `/kiro-spec-tasks {feature} [-y]`
  - Multi-spec: `/kiro-spec-batch` — creates all specs from roadmap.md in parallel by dependency wave
- Phase 2 (Implementation): `/kiro-impl {feature} [tasks] [--review required|inline|off]`
  - Without task numbers: autonomous mode (subagent per task + independent review + final validation)
  - With task numbers: manual mode (selected tasks in main context, still reviewer-gated before completion)
  - `--review off` skips task-local review; use it intentionally and keep `/kiro-validate-impl {feature}` as the final quality gate
  - Fast path for simple/low-risk specs: `/kiro-impl-fast {feature} [tasks]` — sequential, no TDD cycle, with build/tests + review run **once at the end** (not per task). Avoids repeated slow builds on small changes; warns and recommends `/kiro-impl` for behavioral/cross-cutting work.
  - `/kiro-validate-impl {feature}` (standalone re-validation)
- Progress check: `/kiro-spec-status {feature}` (use anytime)

## Skills Structure
Skills are located in `.claude/skills/kiro-*/SKILL.md`
- Each skill is a directory with a `SKILL.md` file
- Skills run inline with access to conversation context
- Skills may delegate parallel research to subagents for efficiency
- Additional files (templates, examples) can be added to skill directories
- `kiro-review` — task-local adversarial review protocol used by reviewer subagents
- `kiro-debug` — root-cause-first debug protocol used by debugger subagents
- `kiro-verify-completion` — fresh-evidence gate before success or completion claims
- **If there is even a 1% chance a skill applies to the current task, invoke it.** Do not skip skills because the task seems simple.

## Development Rules
- 3-phase approval workflow: Requirements → Design → Tasks → Implementation
- Human review required each phase; use `-y` only for intentional fast-track
- Keep steering current and verify alignment with `/kiro-spec-status`
- Follow the user's instructions precisely, and within that scope act autonomously: gather the necessary context and complete the requested work end-to-end in this run, asking questions only when essential information is missing or the instructions are critically ambiguous.

## Steering Configuration
- Load entire `{{KIRO_DIR}}/steering/` as project memory
- Default files: `product.md`, `tech.md`, `structure.md`
- Custom files are supported (managed via `/kiro-steering-custom`)
