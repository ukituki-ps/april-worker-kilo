#!/usr/bin/env bash
set -euo pipefail

# Fix ownership/leftovers in self-hosted CI workspaces.
# Intended for periodic/manual execution with root privileges.

TARGET_PATTERN="${1:-/home/ukituki/actions-runner-april-worker-ci-*/_work/april-worker/april-worker}"
OWNER_USER="${2:-ukituki}"
OWNER_GROUP="${3:-ukituki}"

shopt -s nullglob
targets=($TARGET_PATTERN)
shopt -u nullglob

if [ ${#targets[@]} -eq 0 ]; then
  echo "No matching workspaces for pattern: $TARGET_PATTERN"
  exit 0
fi

for workspace in "${targets[@]}"; do
  [ -d "$workspace" ] || continue
  echo "==> sanitize $workspace"
  chown -R "${OWNER_USER}:${OWNER_GROUP}" "$workspace"
  rm -rf \
    "$workspace/.pnpm-store" \
    "$workspace/hub-shell/node_modules" \
    "$workspace/hub-shell/dist"
done

echo "Workspace sanitization complete."
