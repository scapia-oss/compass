# Codebase Grounding (Local-First)

## Objective
Ground every spec in what already exists before describing what to change.

Use local repository evidence first: Read, Grep, Glob, tests, build files, and project steering. If a change touches an outward-facing surface, use any cross-repo search or code-index tools the user has explicitly configured. If no such tool is available, mark cross-repo behavior and blast radius as unverified instead of guessing.

## Rules

- Never use external or organization-specific tools as a required dependency.
- Read the local code body behind every load-bearing assumption.
- Record verified findings in `research.md` when grounding materially informs the design.
- Keep design documents focused on the proposed change; do not duplicate a long current-state narrative.
- For unknown cross-repo impact, write: "cross-repo impact unverified in this environment."

## Output

Write concise evidence with code anchors:

`**Plain-language capability** — what happens and why it matters.`
`Source: path:line, confidence: high|medium|low`
