#!/usr/bin/env bash
set -euo pipefail

DS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../design-system/DisignApril" && pwd)"

if [[ ! -d "${DS_DIR}" ]]; then
  echo "[ds:prepare] design system directory not found, skip"
  exit 0
fi

# In local/docker mixed workflows node_modules/dist may be root-owned.
# In that case we keep current installed artifacts and avoid failing hub-shell checks.
if [[ -d "${DS_DIR}/node_modules" && ! -w "${DS_DIR}/node_modules" ]]; then
  echo "[ds:prepare] ${DS_DIR}/node_modules is read-only, skip install/build"
  exit 0
fi

if [[ -d "${DS_DIR}/packages/tokens/dist" && ! -w "${DS_DIR}/packages/tokens/dist" ]]; then
  echo "[ds:prepare] ${DS_DIR}/packages/tokens/dist is read-only, skip install/build"
  exit 0
fi

corepack enable
CI=true pnpm --dir "${DS_DIR}" install --frozen-lockfile
pnpm --dir "${DS_DIR}" build
