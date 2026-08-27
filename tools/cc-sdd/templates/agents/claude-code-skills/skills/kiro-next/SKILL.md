---
name: kiro-next
description: Show where the user is in the Kiro workflow and the exact next command. Use when the user asks "kiro next", "kiro what next", "what next", "what's next", "kiro help", "where am I?", "how much is pending?", or "what should I run next?"
allowed-tools: Bash, Read, Glob
argument-hint: [feature-name]
metadata:
  shared-scripts: "kiro-status.mjs, common.mjs"
---

# kiro-next Skill

## Purpose

Give a compact, evidence-backed answer when an engineer feels lost in the spec workflow.

This skill is read-only. It must not edit `spec.json`, tasks, artifacts, or steering.

## Execution

Run the deterministic status script and print its output verbatim:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/kiro-status.mjs" next "$ARGUMENTS"
```

If `$ARGUMENTS` is empty, omit it:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/kiro-status.mjs" next
```

The script auto-detects the most recent unfinished spec when no feature is provided. If there are
multiple active candidates, keep the script's candidate list visible and tell the user to run:

```text
/kiro:next <feature>
```

Do not invent a next command from memory. The script output is the source of truth.
