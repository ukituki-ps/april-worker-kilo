#!/bin/sh
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DS_DIR="${SCRIPT_DIR}/../../design-system/DisignApril"
TOKENS_FALLBACK_FILE="${SCRIPT_DIR}/../src/styles/april-tokens-fallback.css"
TOKENS_FALLBACK_TARGET="${SCRIPT_DIR}/../node_modules/@april/tokens/css"

prepare_tokens_fallback() {
  if [ ! -f "${TOKENS_FALLBACK_FILE}" ]; then
    echo "[ds:prepare] fallback tokens file not found, skip"
    return
  fi

  tokens_dir=""
  tokens_dir="$(dirname "${TOKENS_FALLBACK_TARGET}")"

  if { [ -e "${tokens_dir}" ] || [ -L "${tokens_dir}" ]; } && [ ! -d "${tokens_dir}" ]; then
    rm -f "${tokens_dir}"
  fi

  mkdir -p "${tokens_dir}"
  cp "${TOKENS_FALLBACK_FILE}" "${TOKENS_FALLBACK_TARGET}"
  echo "[ds:prepare] prepared fallback @april/tokens/css"
}

if [ ! -d "${DS_DIR}" ]; then
  echo "[ds:prepare] design system directory not found, skip"
  prepare_tokens_fallback
  exit 0
fi

if [ ! -f "${DS_DIR}/package.json" ]; then
  echo "[ds:prepare] package.json not found in design system directory, skip"
  prepare_tokens_fallback
  exit 0
fi

# In local/docker mixed workflows node_modules/dist may be root-owned.
# In that case we keep current installed artifacts and avoid failing hub-shell checks.
if [ -d "${DS_DIR}/node_modules" ] && [ ! -w "${DS_DIR}/node_modules" ]; then
  echo "[ds:prepare] ${DS_DIR}/node_modules is read-only, skip design-system install/build"
elif [ -d "${DS_DIR}/packages/tokens/dist" ] && [ ! -w "${DS_DIR}/packages/tokens/dist" ]; then
  echo "[ds:prepare] ${DS_DIR}/packages/tokens/dist is read-only, skip design-system install/build"
else
  # Expose pnpm shim in PATH so nested package scripts can invoke `pnpm`.
  # Version remains synchronized via packageManager in DisignApril/package.json.
  COREPACK_INSTALL_DIR="${COREPACK_INSTALL_DIR:-/tmp/.local/bin}"
  mkdir -p "${COREPACK_INSTALL_DIR}"
  export PATH="${COREPACK_INSTALL_DIR}:$PATH"
  corepack enable --install-directory "${COREPACK_INSTALL_DIR}"

  (
    cd "${DS_DIR}"
    CI=true pnpm install --frozen-lockfile
    pnpm build
  )
fi

