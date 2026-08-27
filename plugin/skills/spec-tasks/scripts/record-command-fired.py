#!/usr/bin/env python3
# Append a skill/command firing event to <spec_dir>/spec.json.
#
# Usage:
#   python3 record-command-fired.py <spec_dir> <command> <phase>
#   python3 record-command-fired.py <spec_dir> --reconcile-only
#
# Safety contract:
# - fail open and silent
# - never create spec.json
# - never touch phase/approvals
# - atomic replace after valid JSON parse
import json
import os
import sys
import tempfile
import time
from datetime import datetime, timezone

COMMAND_ORDER = {
    "kiro-discovery": 10,
    "kiro-spec-init": 20,
    "kiro-spec-quick": 20,
    "kiro-spec-requirements": 30,
    "kiro-validate-gap": 40,
    "kiro-spec-design-hld": 50,
    "kiro-spec-design": 55,
    "kiro-spec-design-lld": 60,
    "kiro-validate-design": 70,
    "kiro-spec-tasks": 80,
    "kiro-impl": 90,
    "kiro-impl-fast": 90,
    "kiro-validate-impl": 100,
    "kiro-retrospective": 110,
}

ARTIFACT_FILES = {
    "brief.md": "brief",
    "requirements.md": "requirements",
    "bugfix.md": "bugfix_analysis",
    "design.md": "design",
    "design-hld.md": "design_hld",
    "design-lld.md": "design_lld",
    "research.md": "research",
    "gap-analysis.md": "gap_analysis",
    "design-review.md": "design_review",
    "tasks.md": "tasks",
    "impl-validation.md": "impl_validation",
    "decisions.md": "decisions",
    "learnings.md": "learnings",
    "design-qa-log.md": "qa_log",
}

ARTIFACT_COMMANDS = {
    "brief.md": ("kiro-discovery", "discovery"),
    "requirements.md": ("kiro-spec-requirements", "requirements"),
    "bugfix.md": ("kiro-spec-requirements", "requirements"),
    "gap-analysis.md": ("kiro-validate-gap", "validate-gap"),
    "design.md": ("kiro-spec-design", "design"),
    "design-hld.md": ("kiro-spec-design-hld", "design-hld"),
    "design-lld.md": ("kiro-spec-design-lld", "design-lld"),
    "design-review.md": ("kiro-validate-design", "validate-design"),
    "tasks.md": ("kiro-spec-tasks", "tasks"),
    "impl-validation.md": ("kiro-validate-impl", "validate-impl"),
}


def clean(value):
    if not isinstance(value, str):
        return ""
    return value.strip()


def acquire_lock(path):
    lock_path = path + ".lock"
    deadline = time.time() + 3
    while True:
        try:
            fd = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.write(fd, str(os.getpid()).encode("ascii", errors="ignore"))
            os.close(fd)
            return lock_path
        except FileExistsError:
            try:
                if time.time() - os.path.getmtime(lock_path) > 30:
                    os.remove(lock_path)
                    continue
            except Exception:
                pass
            if time.time() >= deadline:
                return None
            time.sleep(0.05)
        except Exception:
            return None


def now_iso():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def event_for(command, phase, timestamp=None, reconstructed=False, source=None):
    event = {
        "sequence": 0,
        "command": command,
        "skill": command,
        "phase": phase or "unknown",
        "timestamp": timestamp or now_iso(),
    }
    if reconstructed:
        event["reconstructed"] = True
    if source:
        event["source"] = source
    return event


def command_rank(event):
    command = event.get("command") if isinstance(event, dict) else ""
    sequence = event.get("sequence") if isinstance(event, dict) else 0
    if not isinstance(sequence, int):
        sequence = 0
    return (COMMAND_ORDER.get(command, 1000), sequence)


def resequence(events):
    ordered = sorted(events, key=command_rank)
    for index, event in enumerate(ordered, start=1):
        event["sequence"] = index
    return ordered


def reconcile_artifacts(spec_dir, data):
    artifacts = data.get("artifacts")
    if artifacts is None:
        artifacts = {}
    if not isinstance(artifacts, dict):
        return

    for filename, key in ARTIFACT_FILES.items():
        if os.path.isfile(os.path.join(spec_dir, filename)):
            artifacts[key] = True

    data["artifacts"] = artifacts


def reconcile_command_history(spec_dir, data, events):
    existing_commands = {
        event.get("command")
        for event in events
        if isinstance(event, dict) and isinstance(event.get("command"), str)
    }

    for filename, (command, phase) in ARTIFACT_COMMANDS.items():
        if command in existing_commands:
            continue
        if not os.path.isfile(os.path.join(spec_dir, filename)):
            continue
        events.append(event_for(command, phase, reconstructed=True, source=filename))
        existing_commands.add(command)


def write_json(path, data):
    directory = os.path.dirname(path)
    fd = None
    tmp = None
    try:
        fd, tmp = tempfile.mkstemp(prefix=".spec.", suffix=".json", dir=directory)
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            fd = None
            json.dump(data, fh, indent=2, ensure_ascii=False)
            fh.write("\n")
        os.replace(tmp, path)
    except Exception:
        if fd is not None:
            try:
                os.close(fd)
            except Exception:
                pass
        if tmp:
            try:
                os.remove(tmp)
            except Exception:
                pass


def append_event(spec_dir, command, phase):
    spec_dir = clean(spec_dir)
    command = clean(command)
    phase = clean(phase)
    reconcile_only = command == "--reconcile-only"
    if not spec_dir or (not command and not reconcile_only):
        return

    path = os.path.join(os.path.abspath(spec_dir), "spec.json")
    if not os.path.isfile(path):
        return

    lock_path = acquire_lock(path)
    if not lock_path:
        return

    try:
        try:
            with open(path, encoding="utf-8") as fh:
                data = json.load(fh)
        except Exception:
            return
        if not isinstance(data, dict):
            return

        events = data.get("commands_fired")
        if events is None:
            events = []
        elif not isinstance(events, list):
            return

        reconcile_artifacts(spec_dir, data)
        reconcile_command_history(spec_dir, data, events)

        if not reconcile_only:
            events.append(event_for(command, phase))

        data["commands_fired"] = resequence(events)
        write_json(path, data)
    finally:
        try:
            os.remove(lock_path)
        except Exception:
            pass


def main():
    try:
        append_event(
            sys.argv[1] if len(sys.argv) > 1 else "",
            sys.argv[2] if len(sys.argv) > 2 else "",
            sys.argv[3] if len(sys.argv) > 3 else "",
        )
    except Exception:
        pass
    sys.exit(0)


if __name__ == "__main__":
    main()
