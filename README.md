# Compass

**Spec-driven development for Claude Code.** Compass is a Claude Code plugin that gives your AI coding sessions a structured workflow — from idea to requirements, design, implementation, review, validation, and learning — with durable project memory that survives after the chat scrolls away.

[Docs](https://scapia.github.io/compass/) · [Install](#install) · [Commands](#commands) · [Contributing](CONTRIBUTING.md)

---

## Why Compass?

AI coding tools are great at turning a prompt into a diff. They don't automatically solve the harder problem: keeping intent, design decisions, boundaries, and validation evidence visible across sessions and teammates.

Compass fills that gap:

- **Before code, clarify the job.** `/kiro:discovery` turns a rough idea into a scoped path — no spec, quick spec, full spec, or multi-spec roadmap.
- **Before design, load the repo.** Steering files teach the agent what the repository is, how it's built, and how the code is organized.
- **Before implementation, make tasks executable.** Tasks are milestones with boundaries, dependencies, test intent, and validation expectations.
- **Before "done", require evidence.** Implementation commands run build/test/review/verify gates, and validation catches drift before handoff.

Everything lands in version-controlled files under `.kiro/` — specs, decisions, learnings, feedback. Nothing stays only in chat history.

---

## Install

Compass installs as a Claude Code plugin from a marketplace source. The `release` branch contains the generated plugin artifact; `main` contains the source.

```
/plugin marketplace add scapia/compass@release
/plugin install kiro@kiro-compass
/reload-plugins
/kiro:doctor
```

> **SSH vs HTTPS:** The `owner/repo@branch` shorthand works regardless of your Git transport. Claude Code clones via SSH by default. If you don't have SSH keys configured for GitHub, either [add an SSH key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh) or configure Git to use HTTPS for GitHub:
> ```
> git config --global url."https://github.com/".insteadOf git@github.com:
> ```

> **Tip:** `/kiro:doctor` verifies the install is healthy — plugin loaded, hooks active, steering accessible. Run it after every install or update.

### Update

To pull the latest version:

```
/plugin marketplace update kiro-compass
/plugin install kiro@kiro-compass
/reload-plugins
/kiro:doctor
```

### Uninstall

```
/plugin uninstall kiro@kiro-compass
/plugin marketplace remove kiro-compass
/reload-plugins
```

---

## Quick Start

**First time in a repo:**

```
/kiro:steering              # bootstrap project memory (product, tech, structure)
/kiro:discovery "your idea" # scope the work — routes to the right workflow
```

**Lost mid-workflow?**

```
/kiro:next                  # prints the exact next command for your spec
/kiro:spec-status my-feature # full status of a spec
```

**Typical flow:**

```
/kiro:discovery "add user notifications"    # 1. scope
/kiro:spec-quick notification-settings      # 2. spec (adaptive depth)
/kiro:impl notification-settings            # 3. implement (TDD + review)
/kiro:retrospective notification-settings   # 4. learn
```

---

## Commands

24 commands, all prefixed `/kiro:`. Grouped by workflow phase:

### Discovery & Setup

| Command | What it does |
|---------|-------------|
| `/kiro:steering` | Bootstrap or sync project memory (`.kiro/steering/`) |
| `/kiro:steering-custom` | Create domain-specific steering (auth, database, etc.) |
| `/kiro:discovery "idea"` | Scope work — routes to the right spec workflow |
| `/kiro:doctor` | Health-check plugin install and repo setup |

### Specification

| Command | What it does |
|---------|-------------|
| `/kiro:spec-quick feature` | Adaptive spec — auto-picks minimal or standard depth |
| `/kiro:spec-init "description"` | Initialize a new spec with guided workflow |
| `/kiro:spec-requirements feature` | Generate EARS-format requirements |
| `/kiro:spec-design feature` | Full design (combined HLD + LLD) |
| `/kiro:spec-design-hld feature` | High-level design (architecture, flows) |
| `/kiro:spec-design-lld feature` | Low-level design (interfaces, contracts) |
| `/kiro:spec-tasks feature` | Generate implementation tasks from design |
| `/kiro:spec-batch` | Create specs for all features in a roadmap |
| `/kiro:spec-link` | Link a spec across repositories |
| `/kiro:spec-status feature` | Show spec progress and next steps |

### Validation

| Command | What it does |
|---------|-------------|
| `/kiro:validate-gap feature` | Analyze gap between requirements and codebase |
| `/kiro:validate-design feature` | Interactive design quality review |
| `/kiro:validate-impl feature` | Feature-level integration validation |
| `/kiro:verify-completion` | Fresh-evidence gate before claiming "done" |

### Implementation

| Command | What it does |
|---------|-------------|
| `/kiro:impl feature` | TDD implementation with per-task review |
| `/kiro:impl-fast feature` | Fast implementation (no TDD, build + review once) |

### Review & Debug

| Command | What it does |
|---------|-------------|
| `/kiro:review` | Review implementation against spec and boundaries |
| `/kiro:debug "failure"` | Root-cause-first debugging (not guess-and-patch) |

### Learning

| Command | What it does |
|---------|-------------|
| `/kiro:retrospective feature` | Developer journey interview + skill improvement report |
| `/kiro:next` | Show where you are and the exact next command |

---

## How It Works

```
.kiro/
├── steering/           # project memory (product, tech, structure, custom)
│   ├── product.md
│   ├── tech.md
│   └── structure.md
├── specs/              # one directory per feature
│   └── features/
│       └── 2026-08-27-my-feature/
│           ├── spec.json          # metadata, phase status
│           ├── requirements.md    # EARS-format requirements
│           ├── design-hld.md      # architecture
│           ├── design-lld.md      # interfaces & contracts
│           ├── tasks.md           # implementation milestones
│           ├── decisions.md       # design decisions (ADR-style)
│           └── learnings.md       # patterns learned
├── feedback/           # developer journey interviews
└── retrospective/      # skill improvement reports
```

Steering files are project-wide memory. Specs are per-feature, with a 3-phase approval workflow: Requirements → Design → Tasks → Implementation. Each phase produces durable files that any teammate (or future session) can pick up.

---

## Repository Structure

This is a **source-first** repository for contributors and **artifact-first** for users.

| Branch | What's in it | Who writes |
|--------|-------------|-----------|
| `main` | Source templates, builder, tests | Contributors via PRs |
| `release` | Generated plugin (marketplace-installable) | CI only |
| `gh-pages` | Documentation site | Maintainers |

Users install from `release`. Contributors edit `main`. The CI pipeline builds the plugin deterministically from source and publishes it.

### Source layout

```
tools/cc-sdd/
├── scripts/            # builder (build-plugin.mjs)
├── templates/
│   ├── agents/claude-code-skills/skills/   # 24 skill templates
│   ├── shared/                             # rules, settings, scripts, spec templates
│   └── plugin/                             # hooks, agents
├── test/               # parity + self-containment tests
├── package.json
└── tsconfig.json
```

---

## FAQ

**Q: Does Compass work with any Claude Code plan?**
A: Yes. Compass is a standard Claude Code plugin. It works on any plan that supports plugins (Pro, Team, Enterprise).

**Q: Do I need Node.js to use the plugin?**
A: No. Users install the pre-built plugin from the `release` branch. Node.js is only needed if you want to contribute to the source.

**Q: Why are there so many commands?**
A: Each command maps to one step in the workflow. In practice, most sessions use 3-5 commands. `/kiro:discovery` routes you to the right starting point; `/kiro:next` tells you what to run next. You don't need to memorize the list.

**Q: Does this increase token usage?**
A: Yes — Compass adds guiding prompts that teach the AI how to follow the workflow (requirements format, design protocols, TDD discipline, review criteria). These prompts are the reason the workflow is consistent. The tradeoff is intentional: tokens spent on structure save rework, context loss, and ungrounded implementations.

**Q: Can I use Compass on an existing project?**
A: Yes. Run `/kiro:steering` to bootstrap project memory, then `/kiro:discovery` with your next piece of work. Compass doesn't require restructuring your code — it adds `.kiro/` alongside whatever is already there.

**Q: What if I'm mid-workflow and don't know what's next?**
A: `/kiro:next` reads your spec state and prints the exact next command. `/kiro:spec-status feature` gives the full picture.

**Q: What's the difference between `/kiro:impl` and `/kiro:impl-fast`?**
A: `/kiro:impl` follows TDD (write tests first, then implement) with per-task review. `/kiro:impl-fast` builds everything then reviews once — use it for config changes, DTOs, or low-risk edits. Don't use `impl-fast` for behavioral changes, auth, payments, or I/O-critical paths.

**Q: Can I use this across multiple repositories?**
A: Yes. Each repo gets its own steering and specs. For changes that span repos, `/kiro:spec-link` creates a pointer from one repo to another's spec without duplicating content.

**Q: How does the plugin update?**
A: The release workflow rebuilds the plugin on every merge to `main` and publishes to the `release` branch. Run `/plugin marketplace update kiro-compass` then `/plugin install kiro@kiro-compass` to pull the latest.

**Q: How does auto-learning work?**
A: When you correct the AI during review or debug, the correction is recorded in the spec's `learnings.md`. If the pattern is reusable, it's promoted to a global `patterns.md` file. 19 of 24 skills load this file, so the AI applies learned patterns to future specs automatically. A feedback-capture hook also catches corrections made between skill runs. See [Auto-Learning](#auto-learning-how-compass-gets-smarter).

**Q: Is the retrospective useful?**
A: `/kiro:retrospective` produces two files: a developer journey interview (what worked, what didn't, friction points) and a skill improvement report (what the plugin should do better). It's optional but valuable — the feedback files are the primary signal for improving Compass itself.

---

## Auto-Learning: How Compass Gets Smarter

Compass has a built-in learning loop. When the AI makes a mistake and you correct it — wrong design choice, missed constraint, bad architectural call — that correction doesn't vanish when the session ends. It's recorded, promoted, and loaded into future work.

```
┌──────────────────────────────────────────────────────┐
│              YOU CORRECT THE AI                       │
│  (approach, scope, architecture, technical choice)   │
└──────┬──────────────────┬─────────────────┬──────────┘
       │                  │                 │
       ▼                  ▼                 ▼
 ┌───────────┐   ┌───────────────┐   ┌─────────────┐
 │  In-skill │   │  Feedback     │   │  Retro-     │
 │  capture  │   │  capture hook │   │  spective   │
 │  (review/ │   │  (between     │   │             │
 │   debug)  │   │   sessions)   │   │             │
 └─────┬─────┘   └──────┬────────┘   └─────────────┘
       │                 │
       ▼                 ▼
 ┌─────────────────────────────────┐
 │  Per-spec learnings             │
 │  .kiro/specs/.../learnings.md   │
 │  (what went wrong, root cause,  │
 │   correction, is it reusable?)  │
 └──────────────┬──────────────────┘
                │ generalizable?
                ▼
 ┌─────────────────────────────────┐
 │  Global patterns                │
 │  .kiro/learnings/patterns.md    │
 │  (append-only, validated,       │
 │   cited with back-pointers)     │
 └──────────────┬──────────────────┘
                │ loaded by 19 of 24 skills
                ▼
 ┌─────────────────────────────────┐
 │  Next spec / design / impl      │
 │  applies learned patterns       │
 │  and cites them in decisions    │
 └─────────────────────────────────┘
```

### Three ways corrections enter the system

1. **In-skill capture.** During `/kiro:review` and `/kiro:debug`, if you override the AI's verdict — wrong design call, missed constraint, bad root cause — the skill records it to the spec's `learnings.md` immediately.

2. **Feedback-capture hook.** Corrections often arrive *after* a skill finishes — you see the result, then tell the AI what was wrong. A background hook detects this and prompts the AI to record the correction, even though no skill is running.

3. **Retrospective.** `/kiro:retrospective` runs a structured developer-journey interview — what worked, what didn't, where friction was — and produces both a feedback file and a skill-improvement report.

### From local to global

Each correction lands in the spec's `learnings.md` first. If the pattern is generalizable (useful beyond this one spec), it gets promoted to `.kiro/learnings/patterns.md` — a global, **append-only** file. Patterns are never deleted or reordered; a validation script enforces this. Each pattern carries a back-pointer to the spec that discovered it.

### How patterns influence future work

19 of 24 skills load `patterns.md` as context — discovery, all spec phases, design, implementation, review, debug, and validation. When a loaded pattern affects a decision, the skill cites it:

```
Learning applied: .kiro/learnings/patterns.md:42 — P-3 "Batch inventory calls" → used batch API in cart pricing
```

The result: the AI doesn't repeat the same mistake twice in the same project. Patterns accumulate over weeks and sessions, building a project-specific knowledge base that every future spec benefits from.

---

## Facts & Design Principles

- **24 skills**, each one step in the workflow. No monolith commands.
- **3-phase approval**: Requirements → Design → Tasks. Each phase produces a durable file. Nothing is implicit.
- **Adaptive depth**: `/kiro:spec-quick` auto-classifies — a one-line config change gets a minimal spec (one model turn, no ceremony); a cross-cutting feature gets full requirements → design → tasks.
- **Steering = project memory**: `.kiro/steering/` files persist across sessions. Every consuming skill loads all of them — no relevant context is silently dropped.
- **Evidence over claims**: `/kiro:verify-completion` requires fresh build/test evidence before "done". Self-reported status is never trusted alone.
- **Root-cause debugging**: `/kiro:debug` investigates before patching. It traces divergence between working and broken states, not guess-and-patch.
- **Auto-learning loop**: corrections are captured, promoted to global patterns, and loaded into future specs. The AI doesn't repeat the same mistake twice. See [Auto-Learning](#auto-learning-how-compass-gets-smarter).
- **Deterministic build**: `npm run build:plugin` from the same source produces byte-identical output. The parity test enforces this in CI.
- **Plugin is a derived artifact**: the `plugin/` directory is generated. Source of truth is always `tools/cc-sdd/templates/`. Hand-editing `plugin/` is never correct.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide: branch naming, commit conventions, PR checklist, and how the CI pipeline works.

```bash
git clone https://github.com/scapia/compass.git
cd compass/tools/cc-sdd
npm ci
npm run ci    # build + test
```

## Security

See [SECURITY.md](SECURITY.md). Do not report security issues in public issues.

## License

[MIT](LICENSE) — Copyright (c) 2025 Scapia Technology Private Limited

## Credits

Compass is a Claude Code plugin built on [cc-sdd](https://github.com/gotalab/cc-sdd) (MIT), inspired by [AWS Kiro's spec-driven development model](https://kiro.dev/docs/specs/).
