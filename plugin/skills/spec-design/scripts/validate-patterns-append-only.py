#!/usr/bin/env python3
"""Validate .kiro/learnings/patterns.md as an append-only global learning log."""
import argparse
import os
import re
import subprocess
import sys


PATTERN_PATH = ".kiro/learnings/patterns.md"
HEADING_RE = re.compile(r"^##+\s+(P-\d+)\s*:\s*(.+?)\s*$")
SPEC_REF_RE = re.compile(r"\.kiro/specs/[^)\s]+/learnings\.md")


def run_git(repo, args, check=True):
    proc = subprocess.run(
        ["git", "-C", repo, *args],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if check and proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or "git command failed")
    return proc.stdout


def resolve_base(repo, base):
    if base:
        return run_git(repo, ["merge-base", "HEAD", base]).strip()
    return run_git(repo, ["rev-parse", "HEAD~1"]).strip()


def read_at(repo, rev):
    proc = subprocess.run(
        ["git", "-C", repo, "show", f"{rev}:{PATTERN_PATH}"],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    return proc.stdout if proc.returncode == 0 else ""


def read_worktree(repo):
    path = os.path.join(repo, PATTERN_PATH)
    if not os.path.exists(path):
        return ""
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def headings(text):
    return [m.group(0).strip() for m in (HEADING_RE.match(line) for line in text.splitlines()) if m]


def added_blocks(diff):
    blocks = []
    current = []
    in_added_pattern = False
    for raw in diff.splitlines():
        if raw.startswith("+++") or raw.startswith("---"):
            continue
        if not raw.startswith("+"):
            if in_added_pattern and current:
                blocks.append("\n".join(current))
            current = []
            in_added_pattern = False
            continue
        line = raw[1:]
        if HEADING_RE.match(line):
            if in_added_pattern and current:
                blocks.append("\n".join(current))
            current = [line]
            in_added_pattern = True
        elif in_added_pattern:
            current.append(line)
    if in_added_pattern and current:
        blocks.append("\n".join(current))
    return blocks


def validate(repo, base_ref):
    findings = []
    try:
        base = resolve_base(repo, base_ref)
    except Exception as e:
        return [f"could not resolve base revision: {e}"]

    base_text = read_at(repo, base)
    head_text = read_worktree(repo)
    if not head_text:
        return []

    diff = run_git(repo, ["diff", "--unified=0", base, "--", PATTERN_PATH], check=False)
    deleted = [
        line for line in diff.splitlines()
        if line.startswith("-") and not line.startswith("--- ")
    ]
    if deleted:
        findings.append(
            f"{PATTERN_PATH} must be append-only from merge-base {base[:12]}; "
            f"found {len(deleted)} deleted/modified line(s)"
        )

    base_heads = headings(base_text)
    head_heads = headings(head_text)
    pos = 0
    for h in base_heads:
        try:
            found = head_heads.index(h, pos)
        except ValueError:
            findings.append(f"existing pattern heading missing or reordered: {h}")
            break
        pos = found + 1

    for block in added_blocks(diff):
        if not SPEC_REF_RE.search(block):
            first = block.splitlines()[0]
            findings.append(
                f"new global pattern lacks source spec pointer: {first} "
                f"(add `**Source spec**: .kiro/specs/.../learnings.md#...`)"
            )

    return findings


def main(argv):
    parser = argparse.ArgumentParser()
    parser.add_argument("repo", nargs="?", default=".")
    parser.add_argument("--base", help="base branch/ref; validator uses git merge-base HEAD <base>")
    args = parser.parse_args(argv)
    findings = validate(os.path.abspath(args.repo), args.base)
    if findings:
        sys.stderr.write("patterns.md append-only validation failed:\n")
        sys.stderr.write("\n".join(f"  - {f}" for f in findings) + "\n")
        return 2
    print("patterns.md append-only validation passed")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
