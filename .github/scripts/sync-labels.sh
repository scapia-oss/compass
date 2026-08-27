#!/usr/bin/env bash
# Sync repository labels from .github/labels.yml.
# Requires: gh (GitHub CLI), yq (https://github.com/mikefarah/yq)
#
# Usage:
#   .github/scripts/sync-labels.sh              # dry run (print commands)
#   .github/scripts/sync-labels.sh --apply      # create/update labels

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LABELS_FILE="$SCRIPT_DIR/../labels.yml"
APPLY=false

if [[ "${1:-}" == "--apply" ]]; then
  APPLY=true
fi

if ! command -v yq &>/dev/null; then
  echo "Error: yq is required. Install with: brew install yq" >&2
  exit 1
fi

if ! command -v gh &>/dev/null; then
  echo "Error: gh (GitHub CLI) is required." >&2
  exit 1
fi

COUNT=$(yq 'length' "$LABELS_FILE")

for i in $(seq 0 $((COUNT - 1))); do
  NAME=$(yq -r ".[$i].name" "$LABELS_FILE")
  COLOR=$(yq -r ".[$i].color" "$LABELS_FILE")
  DESC=$(yq -r ".[$i].description" "$LABELS_FILE")

  CMD="gh label create \"$NAME\" --color \"$COLOR\" --description \"$DESC\" --force"

  if $APPLY; then
    echo "Syncing: $NAME"
    eval "$CMD" || echo "  Warning: failed to sync $NAME"
  else
    echo "[dry run] $CMD"
  fi
done

if ! $APPLY; then
  echo ""
  echo "Dry run complete. Pass --apply to create/update labels."
fi
