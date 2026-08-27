#!/usr/bin/env python3
# Retro session gate. Answers ONE question deterministically: is /kiro:retrospective running in the
# session that did the work, or in a fresh one?
#
# WHY: a retro run in a clean session has no transcript to read. It still produces a legal file
# (evidence_basis.transcript: reconstructed) but a much weaker one — no verbatim engineer quotes, no
# record of the corrections made during the work, every finding `inferred`. That degradation is silent
# today, so people do it without knowing what they gave up. This prints a warning and teaches
# `claude -r`.
#
# HOW: session-init.py (SessionStart) writes {"source", "cwd"} into <marker_dir>/<session_id>.start.
# We take the newest marker whose `cwd` matches this repo — that is this session's — and then:
#   source in (resume, compact)  -> a continued conversation. Never warn: `claude -r` lands here.
#   source in (startup, clear)   -> a new conversation. Warn IF no spec artifact was written since the
#                                   marker, i.e. all the work predates this session.
# Anything ambiguous -> exit quiet. A false "you're in the wrong session" sends someone chasing a
# session that does not need chasing, so silence is the safe failure direction. This is guidance, not
# a block.
#
# NOTE the signal is *when a spec artifact was last written*, never whether one exists. In the case this
# gate exists for — same directory, fresh session, retro as one of the first commands — every spec file
# is present and every one of them predates the marker. Presence proves nothing.
#
# TWO KNOWN BLIND SPOTS, both handled by the skill cross-checking this verdict against whether it
# actually holds the session's turns (see the skill's step 0 table):
#   1. Concurrent sessions in one repo -> the newest cwd-matching marker may belong to the OTHER
#      session, so the one that did the work can read `fresh`. A skill's Bash has no session_id, so
#      the marker cannot be matched to this conversation from here.
#   2. `git checkout` / `git pull` at session start rewrites spec mtimes, which looks like work and
#      yields `same` for a session that witnessed nothing.
# Both are wrong-but-recoverable because the skill asks the human before acting on `fresh`.
#
# CONTRACT: always exit 0. stdout's first line is a machine-readable verdict the skill reads:
#   RETRO_SESSION: fresh | same | unknown
# Pure stdlib — runs on any vanilla macOS python3.
import json
import os
import sys
import tempfile

MARKER_DIR_NAME = "kiro-sess"
CONTINUED = ("resume", "compact")
NEW = ("startup", "clear")
# Directories whose writes are not "the work": settings are seeded by the SessionStart cp, and
# feedback/retrospective are written by this very skill on a previous run.
SKIP_DIRS = ("settings", "feedback", "retrospective")


def marker_dir():
    base = os.environ.get("CLAUDE_PLUGIN_DATA") or tempfile.gettempdir()
    return os.path.join(base, MARKER_DIR_NAME)


def session_marker(repo):
    """Newest marker for THIS repo as (mtime, source), or None when undeterminable.

    Filtering by cwd matters: markers are global, so a concurrent session in another repo would
    otherwise look like this session's and invert the verdict.
    """
    d = marker_dir()
    try:
        names = [n for n in os.listdir(d) if n.endswith(".start")]
    except OSError:
        return None
    best = None
    for name in names:
        path = os.path.join(d, name)
        try:
            with open(path) as fh:
                meta = json.load(fh)
            if not isinstance(meta, dict):
                continue
            if os.path.realpath(meta.get("cwd") or "") != os.path.realpath(repo):
                continue
            mtime = os.path.getmtime(path)
        except (OSError, ValueError):
            continue  # legacy empty marker, unreadable, or vanished -> not usable
        if best is None or mtime > best[0]:
            best = (mtime, meta.get("source") or "")
    return best


def worked_since(kiro_dir, start_sec):
    """True if any spec artifact was written at/after `start_sec`. Raises OSError on scan failure so
    the caller can stay quiet rather than guess."""
    specs = os.path.join(kiro_dir, "specs")
    if not os.path.isdir(specs):
        return False
    for root, dirs, files in os.walk(specs):
        for name in files:
            if os.path.getmtime(os.path.join(root, name)) >= start_sec:
                return True
    return False


def verdict(repo):
    kiro = os.path.join(repo, ".kiro")
    if not os.path.isdir(kiro):
        return "unknown"
    marker = session_marker(repo)
    if marker is None:
        return "unknown"  # no marker, legacy empty marker, or pruned
    start_sec, source = marker
    if source in CONTINUED:
        return "same"  # resumed or compacted — the transcript is still here
    if source not in NEW:
        return "unknown"  # unrecognised/absent source: do not guess
    try:
        return "same" if worked_since(kiro, start_sec) else "fresh"
    except OSError:
        return "unknown"


WARNING = """\
WARNING — this looks like a FRESH session, not the one that did the work.

  Nothing under .kiro/specs/ has been written since this session started, so this retro has no
  transcript to read. It can still run, but the result is reconstructed from artifacts: no verbatim
  engineer quotes, no record of the corrections made during the work, and every finding marked
  `inferred` instead of `witnessed`.

  For a full-strength retro, resume the session that did the work:

    1. Leave this session            (/exit, or Ctrl-D)
    2. claude -r                     # in this repo — pick the session from the list
    3. /kiro:retrospective           # run it there

  `claude -r` with no argument opens a picker of recent sessions for this directory.
  `claude -r <session-id>` jumps straight to one.

  To proceed here anyway, say so — the retro will continue and record
  evidence_basis.transcript: reconstructed, which is honest but weaker."""


def main():
    try:
        repo = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
        v = verdict(repo)
        print("RETRO_SESSION: " + v)
        if v == "fresh":
            print()
            print(WARNING)
    except Exception:
        # Guidance must never break the skill it advises.
        print("RETRO_SESSION: unknown")
    sys.exit(0)


if __name__ == "__main__":
    main()
