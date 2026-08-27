# Learning Promotion

## Purpose
Move only durable, cross-spec lessons from `{spec_dir}/learnings.md` into
`{{KIRO_DIR}}/learnings/patterns.md` without breaking existing references.

## Promotion Threshold
Promote a spec learning only when all are true:
- It is directional: approach, scope, architecture, technical choice, failure mode, or review trap.
- It is reusable by another teammate on another spec.
- It is not already covered by an existing global pattern after reading every `{{KIRO_DIR}}/learnings/*.md`.

Keep one-off corrections in `{spec_dir}/learnings.md`. Use `{spec_dir}/decisions.md` for a chosen
alternative.

## Append-Only Contract
`{{KIRO_DIR}}/learnings/patterns.md` is append-only.

- Never delete, rewrite, reorder, or renumber an existing pattern heading.
- Append a new `P-N` after the last existing pattern. Pick the next unused number by scanning current headings.
- If a matching pattern already exists, append a new `**Example N**` to that pattern instead of creating a duplicate.
- If numbering has already collided, do not fix it by renumbering in the same spec run. Disambiguate citations by
  title/source and leave consolidation to a maintainer-approved cleanup.
- Before and after editing, run the validator against the PR base branch when available:

```bash
python3 "${CLAUDE_SKILL_DIR}/scripts/validate-patterns-append-only.py" "$(pwd)" --base origin/pre-prod
```

Replace `origin/pre-prod` with the actual target base ref for the repo. If a base ref is unavailable,
run without `--base`; it falls back to `HEAD~1`. A validator failure means do not claim the learning
was promoted.

## Required Back Pointer
Every new global pattern must include a source pointer to the spec learning that produced it:

```markdown
**Source spec**: `.kiro/specs/<category>/<dated-slug>/learnings.md#<entry-heading>`
```

If the exact anchor is awkward, use the file path plus the learning heading text. The point is that a future
reader can jump from global rule to the originating spec evidence.

## Citing Applied Learnings
When a loaded learning affects HLD, LLD, design Q&A, discovery, task planning, implementation, or review, show
the user the evidence:

```text
Learning applied: .kiro/learnings/patterns.md:<line> - P-N <title> -> <decision/conclusion>
```

Use real line numbers from `nl -ba` or an equivalent read with line numbers. If a learning was loaded but did
not affect the conclusion, say `none applied` in the context challenge.
