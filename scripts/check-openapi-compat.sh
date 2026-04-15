#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BASE_REF="${BASE_REF:-origin/develop}"
SPEC_PATH="${SPEC_PATH:-openapi/aprilhub-bff.yaml}"
BASE_SPEC="/tmp/base-aprilhub-bff.yaml"

if ! command -v oasdiff >/dev/null 2>&1; then
  echo "[openapi-compat] oasdiff is required but not installed"
  exit 1
fi

echo "[openapi-compat] fetch base reference"
git fetch --no-tags origin develop

if ! git cat-file -e "${BASE_REF}:${SPEC_PATH}" 2>/dev/null; then
  echo "[openapi-compat] ${SPEC_PATH} is absent in ${BASE_REF}; skipping breaking-change check"
  exit 0
fi

git show "${BASE_REF}:${SPEC_PATH}" > "$BASE_SPEC"

echo "[openapi-compat] running breaking-change check against ${BASE_REF}"
oasdiff breaking --fail-on ERR "$BASE_SPEC" "$SPEC_PATH"

echo "[openapi-compat] no breaking changes detected"
