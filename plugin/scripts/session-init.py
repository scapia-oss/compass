#!/usr/bin/env python3
# SessionStart hook helper. Records this session's start time as a marker file, which
# feedback-capture.py (UserPromptSubmit) compares against `.kiro/` file mtimes to decide whether
# any SDD work happened THIS session before arming the learning-capture reminder.
#
# Wired by build-plugin.mjs as a SessionStart command, run AFTER the settings cp so the marker's
# mtime is newer than anything the cp wrote (the cp is no-clobber, but on a first-ever session it
# writes .kiro/settings — feedback-capture excludes that dir anyway, and ordering keeps the marker
# the newest reference point regardless).
#
# SAFETY: always exit 0 (SessionStart cannot block, but keep parity). Markers live OUTSIDE the repo
# (CLAUDE_PLUGIN_DATA, fallback tempfile.gettempdir()) — NEVER under .kiro/, or they would both
# dirty `git status` and corrupt the very mtime scan feedback-capture depends on. Read/write only
# the marker dir; never touch the repo.
#
# Pure stdlib (os, sys, json, time, tempfile) — runs on any vanilla macOS python3.
import os
import sys
import json
import time
import tempfile

PRUNE_AGE_SEC = 7 * 24 * 60 * 60  # 7 days


def marker_dir():
    base = os.environ.get("CLAUDE_PLUGIN_DATA") or tempfile.gettempdir()
    return os.path.join(base, "kiro-sess")


def prune_markers(dir_path, now):
    """Delete .start markers older than PRUNE_AGE_SEC. `now` in seconds, for testability."""
    removed = 0
    try:
        entries = os.listdir(dir_path)
    except OSError:
        return 0  # dir doesn't exist yet — nothing to prune
    for name in entries:
        if not name.endswith(".start"):
            continue
        f = os.path.join(dir_path, name)
        try:
            if now - os.path.getmtime(f) > PRUNE_AGE_SEC:
                os.remove(f)
                removed += 1
        except OSError:
            # racing prune / vanished file — ignore
            pass
    return removed


def main():
    try:
        try:
            raw = sys.stdin.read()
            payload = json.loads(raw) if raw.strip() else {}
        except Exception:
            payload = {}
        if not isinstance(payload, dict):
            payload = {}
        cwd = payload.get("cwd") if isinstance(payload.get("cwd"), str) and payload.get("cwd") else os.getcwd()
        session_id = payload.get("session_id") if isinstance(payload.get("session_id"), str) else ""
        # SessionStart fires for "startup" | "resume" | "clear" | "compact". Recording which one, plus
        # the repo, lets check-retro-session.py tell a genuinely new conversation from a resumed one —
        # without it, `claude -r` would look identical to a fresh start (new marker, current mtime) and
        # the retro gate would warn the very person who resumed correctly.
        source = payload.get("source") if isinstance(payload.get("source"), str) else ""
        # Only act in a kiro repo with an identifiable session (matches the SessionStart cp guard).
        if session_id and os.path.isdir(os.path.join(cwd, ".kiro")):
            d = marker_dir()
            os.makedirs(d, exist_ok=True)
            # Content is additive: feedback-capture.py reads only the mtime and is unaffected. A legacy
            # empty marker simply reads back as unknown, which the retro gate treats as "stay silent".
            with open(os.path.join(d, session_id + ".start"), "w") as fh:
                json.dump({"source": source, "cwd": cwd}, fh)
            prune_markers(d, time.time())
    except Exception:
        # Fail silent — a SessionStart helper must never disrupt session startup.
        pass
    sys.exit(0)


if __name__ == "__main__":
    main()
