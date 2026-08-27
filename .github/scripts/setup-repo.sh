#!/usr/bin/env bash
# One-time repository setup: branch protection, labels, and settings.
# Requires: gh (GitHub CLI) authenticated with admin access.
#
# Usage:
#   .github/scripts/setup-repo.sh              # dry run
#   .github/scripts/setup-repo.sh --apply      # apply settings

set -euo pipefail

REPO="scapia/compass"
APPLY=false

if [[ "${1:-}" == "--apply" ]]; then
  APPLY=true
fi

run_or_dry() {
  if $APPLY; then
    echo "Running: $*"
    "$@"
  else
    echo "[dry run] $*"
  fi
}

echo "=== Branch Protection ==="

# Protect main: require PR, require status checks, no force push, no deletion
echo ""
echo "--- main branch ---"
if $APPLY; then
  gh api -X PUT "repos/$REPO/branches/main/protection" \
    --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["validate"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_linear_history": false
}
EOF
  echo "main branch protection applied."
else
  echo "[dry run] Protect main: require PR with 1 approval, require 'validate' status check, enforce for admins, no force push, no deletion."
fi

# Protect release: restrict pushes to github-actions bot only
echo ""
echo "--- release branch ---"
if $APPLY; then
  gh api -X PUT "repos/$REPO/branches/release/protection" \
    --input - <<'EOF'
{
  "required_status_checks": null,
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": {
    "users": [],
    "teams": [],
    "apps": ["github-actions"]
  },
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
  echo "release branch protection applied (CI-only push)."
else
  echo "[dry run] Protect release: restrict pushes to github-actions[bot] only, no force push, no deletion."
fi

# Protect gh-pages: restrict to maintainers
echo ""
echo "--- gh-pages branch ---"
if $APPLY; then
  gh api -X PUT "repos/$REPO/branches/gh-pages/protection" \
    --input - <<'EOF'
{
  "required_status_checks": null,
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
  echo "gh-pages branch protection applied."
else
  echo "[dry run] Protect gh-pages: no force push, no deletion."
fi

echo ""
echo "=== Repository Settings ==="

if $APPLY; then
  gh api -X PATCH "repos/$REPO" \
    --input - <<'EOF'
{
  "has_issues": true,
  "has_projects": false,
  "has_wiki": false,
  "allow_squash_merge": true,
  "allow_merge_commit": false,
  "allow_rebase_merge": true,
  "delete_branch_on_merge": true,
  "squash_merge_commit_title": "PR_TITLE",
  "squash_merge_commit_message": "PR_BODY"
}
EOF
  echo "Repository settings applied."
else
  echo "[dry run] Disable wiki + projects. Enable squash + rebase merge. Disable merge commits. Auto-delete branches on merge. Squash title = PR title."
fi

echo ""
echo "=== Labels ==="
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if $APPLY; then
  "$SCRIPT_DIR/sync-labels.sh" --apply
else
  "$SCRIPT_DIR/sync-labels.sh"
fi

if ! $APPLY; then
  echo ""
  echo "==========================================="
  echo "Dry run complete. Pass --apply to execute."
  echo "==========================================="
fi
