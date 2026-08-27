#!/usr/bin/env python3
# UserPromptSubmit hook. Closes the out-of-window learning-capture gap: directional corrections
# frequently arrive in the turn AFTER an autonomous skill run (e.g. /kiro:impl) has returned, when
# NO skill is in force and thus no in-skill "Record Feedback" step can fire. A harness hook is the
# only mechanism that runs in that dead window. UserPromptSubmit stdout (exit 0) is injected into
# the model's context alongside the submitted prompt, so we print a terse self-check.
#
# SMART GATE (session-scoped, fail-open): we only emit when SDD work happened THIS session — i.e.
# some file under `.kiro/` was written at or after this session's start (recorded by
# session-init.py). This stays silent in chit-chat-only sessions yet has NO time-window expiry.
#
# GOVERNING PRINCIPLE — never miss a learning. The gate may only stay SILENT when it positively
# confirms "kiro repo, but no SDD activity this session". On ANY uncertainty (no session id, no
# start marker, scan error) it FAILS OPEN and emits. Failure mode is over-fire, never silence.
#
# SAFETY: ALWAYS exit 0 (exit 2 on UserPromptSubmit erases the user's prompt). Read-only: never
# writes files. Markers it reads live OUTSIDE the repo (CLAUDE_PLUGIN_DATA / tempfile.gettempdir()).
#
# Pure stdlib (os, sys, json, tempfile) — runs on any vanilla macOS python3.
import os
import sys
import json
import tempfile


def marker_dir():
    base = os.environ.get("CLAUDE_PLUGIN_DATA") or tempfile.gettempdir()
    return os.path.join(base, "kiro-sess")


def _raise(err):
    # os.walk error handler: re-raise so the caller can FAIL OPEN on an unreadable tree.
    raise err


def has_activity_since(kiro_dir, start_sec):
    """Walk `.kiro/` (excluding `.kiro/settings/`) and return True as soon as ANY FILE's mtime is
    >= start_sec. Only file mtimes count — directory mtimes move on unrelated child add/remove and
    are set at creation, so they would over-arm; every real SDD write is a file write
    (spec.json/requirements.md/design-*.md/...), so files are the correct signal. Raises on fs
    errors so the caller can fail open. `>=` (not `>`) guards against same-second mtime granularity
    dropping a write."""
    skip = os.path.join(kiro_dir, "settings")
    for root, dirs, files in os.walk(kiro_dir, onerror=_raise):
        # Prune .kiro/settings so we neither recurse into nor inspect it.
        dirs[:] = [d for d in dirs if os.path.join(root, d) != skip]
        for name in files:
            if os.path.getmtime(os.path.join(root, name)) >= start_sec:  # raises -> caller fails open
                return True
    return False


def should_emit(project_dir, session_id):
    """True if the learning reminder should be injected."""
    if not project_dir or not isinstance(project_dir, str):
        return False  # no cwd → not a kiro session
    kiro_dir = os.path.join(project_dir, ".kiro")
    if not os.path.exists(kiro_dir):
        return False  # non-kiro repo → silent (no specs here to attach to)
    # It IS a kiro repo. From here, default to EMIT on any uncertainty (fail-open).
    if not session_id or not isinstance(session_id, str):
        return True
    try:
        start_sec = os.path.getmtime(os.path.join(marker_dir(), session_id + ".start"))
    except OSError:
        return True  # no start marker (resumed/pruned/unwritable) → fail open
    try:
        return has_activity_since(kiro_dir, start_sec)
    except OSError:
        return True  # scan error (permissions, vanished file) → fail open


def reminder_text():
    """The reminder text. Kept terse to bound per-prompt token cost."""
    return (
        "[kiro] Learning check: if your previous turn produced or changed a spec, design, or "
        "implementation AND this message is a DIRECTIONAL correction (approach / scope / architecture / "
        "technical choice — NOT a typo, rename, format, or reorder), then after acknowledging it, record "
        "it to the most-recently-written spec's learnings.md before continuing (create it if "
        "missing); also add to "
        "{{KIRO_DIR}}/learnings/patterns.md if the lesson generalizes, but only append-only with a "
        "Source spec pointer back to that learnings.md entry and a validate-patterns-append-only.py check; "
        "use decisions.md instead if the user chose between distinct alternatives. Skip silently if it is already recorded or not a "
        "directional correction."
    )


def capture_reminder(project_dir, session_id):
    """The string to inject, or None."""
    return reminder_text() if should_emit(project_dir, session_id) else None


def main():
    try:
        try:
            raw = sys.stdin.read()
            payload = json.loads(raw) if raw.strip() else {}
        except Exception:
            payload = {}
        if not isinstance(payload, dict):
            payload = {}
        project_dir = payload.get("cwd") if isinstance(payload.get("cwd"), str) and payload.get("cwd") else os.getcwd()
        session_id = payload.get("session_id") if isinstance(payload.get("session_id"), str) else ""
        out = capture_reminder(project_dir, session_id)
        if out:
            sys.stdout.write(out + "\n")
    except Exception:
        # Fail silent — never let a hook error block the user's prompt.
        pass
    sys.exit(0)  # ALWAYS 0 on UserPromptSubmit. Never block.


if __name__ == "__main__":
    main()
