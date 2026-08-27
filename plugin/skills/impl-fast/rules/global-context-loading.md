# Global Context Loading (Steering + Cross-Spec Learnings)

## Objective
Every skill that reads, judges, or writes spec content must ground itself on the **same two
project-global memory stores**, loaded the **same mechanical way**, so a convention or a past
correction can never be silently skipped because one skill's author phrased the load differently
(or forgot it). This file is the single source for that instruction — do not re-author it per skill.

There are exactly two project-global stores, both siblings under `.kiro/`, never inside
`{spec_dir}`:

| Store | Path | Scope | Load rule |
|---|---|---|---|
| Steering | `.kiro/steering/*.md` | Project-wide conventions, architecture, domain rules | Glob-all, always |
| Cross-spec learnings | `.kiro/learnings/*.md` | Patterns/traps recorded from other specs | Glob-all, always |

Plus two **spec-scoped** files (not project-global — read only when they exist, no glob needed since
there is exactly one of each per spec):
- `{spec_dir}/decisions.md` — settled decisions for this spec
- `{spec_dir}/learnings.md` — corrections/mistakes recorded during this spec

## Rule 1 — Glob-all, never a fixed list, never "when relevant"
Load **every** file matching `.kiro/steering/*.md` and **every** file matching
`.kiro/learnings/*.md`. Do not hardcode filenames (not `product.md, tech.md, structure.md`,
not `patterns.md`) and do not filter by guessed relevance. An unread file's relevance is unknowable
before it is read — "load when applicable" phrasing defaults to skipping it, which is exactly how a
custom steering file or a recorded cross-spec trap gets silently dropped. This is why both stores are
globbed: dropping a new file into either directory must reach every consuming skill with **zero**
prose or code changes anywhere else.

## Rule 2 — Mechanical completeness check (not a judgment call)
After loading, print a one-line context manifest naming what was actually read, e.g.:
`📂 Context loaded — steering(5): product, tech, structure, security, api-conventions ·
learnings(2): patterns, anti-patterns · decisions.md · learnings.md`

A glob shorthand (`steering(5)`, `learnings(2)`) is allowed **only** if the stated count matches the
real file count in that directory at read time (`count == ls .kiro/steering/*.md`, and same
for `learnings/`). If either directory is empty or does not exist yet, say so (`learnings(0)` or
`learnings/ not found`) rather than omitting the line — a missing store is a fact worth stating, not
a reason to skip the manifest.

## Rule 2A — Context challenge
After the context manifest, add a compact `Context challenge` block. This is an audit note, not a new
phase gate. It must not change the command flow, discovery flow, validation flow, or document
structure.

Use the files already loaded by Rule 1. Do not do extra discovery for this block.

| Source | Challenge answer | Effect on this work |
|---|---|---|
| Steering | One concrete rule, convention, or constraint from a loaded steering file | How it shapes this output |
| Cross-spec learning | One relevant learning from loaded `.kiro/learnings/*.md` with file:line + pattern id/title, or `none found after reading all learning files` | How it shapes this output, or `no change` |
| Spec memory | One decision/learning from `{spec_dir}/decisions.md` or `{spec_dir}/learnings.md`, or `none present` | How it shapes this output, or `no change` |

Name the source file in the answer, for example `tech.md: use repository pattern for database access`
or `style-guide.md: keep controller methods thin`. For cross-spec learnings, use real line numbers
from `nl -ba` or an equivalent numbered read and cite the exact pattern that affected the conclusion:
`Learning applied: .kiro/learnings/<file>.md:<line> - P-N <title> -> <decision/conclusion>`.
This applies to HLD, LLD, architect/discovery Q&A, task planning, implementation, validation, and review.
If nothing applies, say so plainly. Do not invent relevance.

## Rule 3 — Spec-scoped files: read if present, skip silently otherwise
`{spec_dir}/decisions.md` and `{spec_dir}/learnings.md` may not exist yet (first spec, or nothing
recorded so far). Read them if present; skip silently if absent — do not treat absence as an error.
Include them in the manifest whenever they exist and were read.

## Rule 4 — Apply what was loaded, do not just acknowledge it
- Steering wins on any conflict with a language pack or `code-simplification.md`.
- A cross-spec pattern in `learnings/*.md` that applies to the current unit must change the output —
  cite it with file:line, pattern id/title, and the resulting decision/conclusion.
- A settled decision in `{spec_dir}/decisions.md` must not be silently re-litigated or contradicted.
- A prior correction in `{spec_dir}/learnings.md` must not be repeated.

## Rule 5 — Deterministic full-inline into a dispatched subagent (where applicable)
Some skills (`kiro-impl`, `kiro-impl-fast`) dispatch a subagent that does the actual writing/judging.
For those, loading in the parent's own context is not enough — the subagent needs it too, and needs it
without cherry-picking:
- Inline the **FULL** current contents of `{spec_dir}/decisions.md` and `{spec_dir}/learnings.md`
  verbatim into the subagent's dispatch message (they are spec-scoped and small — inlining entirely,
  not selecting "relevant" entries, is what prevents a settled decision or a known mistake from being
  dropped).
- Pass an occasional-relevance cross-spec traps file (unbounded size — e.g. the project's `patterns.md`
  under `.kiro/learnings/`) as a **fallback path** in the dispatch rather than inlining
  wholesale — tell the subagent to open it for a generalizable pattern relevant to its unit.
- **Exception: `.kiro/learnings/style-guide.md` is project-global but gets the FULL-INLINE
  treatment, not the fallback-path treatment** — because it is meant to shape *every* line of new
  code (naming, control-flow shape, layering, component structure), not just be consulted when
  something goes wrong. Inline it verbatim under its own heading, the same tier as steering and
  `code-simplification.md`, whenever it exists and is non-empty.
- Steering is inlined in full the same way (see the skill's own dispatch construction).
- **After the subagent returns**, cross-check its reported `CONTEXT_FILES`/manifest against what was
  injected: does it name every steering file, `decisions.md`, `learnings.md`, and `style-guide.md`
  (when injected) you handed it? This is
  a mechanical name-presence check — it confirms the subagent's report claims to have used what it was
  given, not that it genuinely applied it. If a name is missing, re-dispatch once with an explicit
  "you were given these files; ground on them and list them" reminder before proceeding. Treat this as
  a cross-check, never as standalone proof of correct use.

## Rule 6 — Consult before authoring or promoting project-global memory
A skill that **writes** a new steering file (`kiro-steering`, `kiro-steering-custom`) must check
`.kiro/learnings/*.md` first — a cross-spec pattern already recorded there should not be
re-authored as a new, disconnected steering rule. If the new steering content overlaps an existing
learning, fold it in or cross-reference it instead of duplicating it.

A skill that promotes a spec learning into project-global learning memory must follow
`${CLAUDE_SKILL_DIR}/rules/learning-promotion.md` when that rule is bundled: append-only update,
dedupe before adding, source-spec back pointer, and validator before claiming success.

## What this file does not cover
- **Discovery/routing decisions** (`kiro-discovery`) also consult `.kiro/learnings/*.md` before
  recommending scope, so triage does not repeat a known mistake — same glob-all rule, applied to a
  routing decision rather than to writing spec content.
- Read-only, non-authoring skills (`kiro-doctor`, `kiro-spec-status`, `kiro-spec-link`,
  `kiro-verify-completion`) do not need this file — they diagnose, point, or gate, they do not
  generate or judge spec content.
- A subagent that is handed a skill's `SKILL.md` as a file to read and follow (rather than genuinely
  invoked as that skill, e.g. `kiro-spec-batch`'s per-feature dispatch) may not have
  `${CLAUDE_SKILL_DIR}` resolved for it. It can infer the shared rule's location as a sibling `rules/`
  path next to the `SKILL.md` it was told to read, but this is a documented limitation, not a
  guarantee — treat cross-checks on such a subagent's manifest as weaker evidence than a native
  skill invocation's.
