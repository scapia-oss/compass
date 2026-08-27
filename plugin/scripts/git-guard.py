#!/usr/bin/env python3
# PreToolUse(Bash) guard. Makes the impl loop's destructive-git prohibitions PHYSICALLY
# impossible instead of prose the model must remember: a denied call never runs.
#
# Wired by build-plugin.mjs into the kiro plugin's hooks.json as a PreToolUse/Bash hook.
# Reads the hook payload on stdin; exit 2 + stderr blocks the tool call and feeds the
# reason back to the model.
#
# Deny set is intentionally NARROW — only the irreversible, whole-tree operations the
# impl skill forbids. Scoped, explicit-path git commands (git add src/x, git reset HEAD~1,
# git checkout <branch>) are NOT blocked.
#
# Pure stdlib (sys, json, re) — runs on any vanilla macOS python3.
import sys
import json
import re

# (compiled pattern, reason) pairs. First match wins.
_CHECKS = [
    # Whole-tree staging.
    (re.compile(r"\bgit\s+add\s+(?:[^\n&|;]*\s)?(?:-A|--all)\b"),
     "git add -A / --all stages the whole tree; stage explicit paths instead."),
    (re.compile(r"\bgit\s+add\s+(?:[^\n&|;]*\s)?(?:\.|\*)(?:\s|$)"),
     "git add . / * stages the whole tree; stage explicit paths instead."),
    # Hard reset wipes uncommitted work.
    (re.compile(r"\bgit\s+reset\s+(?:[^\n&|;]*\s)?--hard\b"),
     "git reset --hard discards uncommitted work; not allowed inside the impl loop."),
    # Whole-tree discard.
    (re.compile(r"\bgit\s+checkout\s+(?:--\s+)?\.(?:\s|$)"),
     "git checkout . discards working-tree changes; not allowed inside the impl loop."),
    (re.compile(r"\bgit\s+restore\s+(?:--\w+\s+)*\.(?:\s|$)"),
     "git restore . discards working-tree changes; not allowed inside the impl loop."),
    # Forced clean deletes untracked files.
    (re.compile(r"\bgit\s+clean\s+(?:[^\n&|;]*\s)?-\w*f"),
     "git clean -f deletes untracked files; not allowed inside the impl loop."),
]


def is_dangerous(cmd):
    """Reason string if the command is forbidden, else None."""
    if not cmd or not isinstance(cmd, str):
        return None
    for pattern, reason in _CHECKS:
        if pattern.search(cmd):
            return reason
    return None


def main():
    try:
        raw = sys.stdin.read()
        payload = json.loads(raw) if raw.strip() else {}
    except Exception:
        # Unparseable payload: do not block (fail open — guard must never break normal work).
        sys.exit(0)

    if not isinstance(payload, dict):
        sys.exit(0)
    if payload.get("tool_name") and payload.get("tool_name") != "Bash":
        sys.exit(0)
    cmd = ((payload.get("tool_input") or {}).get("command")) or ""
    reason = is_dangerous(cmd)
    if reason:
        sys.stderr.write(
            "Blocked by kiro git-guard: {}\n".format(reason)
            + "The kiro impl loop requires selective staging and forbids destructive resets. "
            + "Stage explicit paths (git add <file> ...) or use a non-destructive alternative.\n"
        )
        sys.exit(2)  # PreToolUse: exit 2 denies the call and returns stderr to the model.
    sys.exit(0)


if __name__ == "__main__":
    main()
