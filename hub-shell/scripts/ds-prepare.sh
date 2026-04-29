#!/bin/sh
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DS_DIR="${SCRIPT_DIR}/../../design-system/DisignApril"
TOKENS_FALLBACK_FILE="${SCRIPT_DIR}/../src/styles/april-tokens-fallback.css"
TOKENS_FALLBACK_TARGET="${SCRIPT_DIR}/../node_modules/@april/tokens/css"
HUB_NODE_MODULES_DIR="${SCRIPT_DIR}/../node_modules/@april"

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

sync_design_system_package_dist() {
  package_name="$1"
  source_dir="${DS_DIR}/packages/${package_name}"
  target_dir="${HUB_NODE_MODULES_DIR}/${package_name}"

  if [ ! -d "${source_dir}/dist" ]; then
    echo "[ds:prepare] ${source_dir}/dist not found, skip ${package_name} sync"
    return
  fi

  if [ ! -d "${target_dir}" ]; then
    echo "[ds:prepare] ${target_dir} not found, skip ${package_name} sync"
    return
  fi

  if [ ! -w "${target_dir}" ]; then
    echo "[ds:prepare] ${target_dir} is read-only, skip ${package_name} sync"
    return
  fi

  source_real="$(cd "${source_dir}" && pwd -P)"
  target_real="$(cd "${target_dir}" && pwd -P)"
  if [ "${source_real}" = "${target_real}" ]; then
    echo "[ds:prepare] ${target_dir} already points to source, skip ${package_name} sync"
    return
  fi

  rm -rf "${target_dir}/dist"
  mkdir -p "${target_dir}/dist"
  cp -R "${source_dir}/dist/." "${target_dir}/dist"
  cp "${source_dir}/package.json" "${target_dir}/package.json"
  echo "[ds:prepare] synced @april/${package_name} dist"
}

ensure_ui_types_stub() {
  ui_dist_dir="${DS_DIR}/packages/ui/dist"
  ui_types_file="${ui_dist_dir}/index.d.ts"

  should_write_stub="true"
  if [ -f "${ui_types_file}" ]; then
    first_line="$(sed -n '1p' "${ui_types_file}")"
    if [ "${first_line}" != "export const AprilProviders: unknown;" ]; then
      should_write_stub="false"
    fi
  fi

  if [ ! -d "${ui_dist_dir}" ]; then
    echo "[ds:prepare] ${ui_dist_dir} not found, skip ui types fallback"
    return
  fi

  if [ "${should_write_stub}" != "true" ]; then
    return
  fi

  cat > "${ui_types_file}" <<'EOF'
import type { ComponentType, PropsWithChildren } from "react";

export const AprilProviders: ComponentType<PropsWithChildren<Record<string, unknown>>>;
export const AprilProductHeader: ComponentType<Record<string, unknown>>;
export const AprilEcosystemSimpleCards: ComponentType<Record<string, unknown>>;
export const CardListColumn: ComponentType<Record<string, unknown>>;
export const DensityProvider: ComponentType<PropsWithChildren<Record<string, unknown>>>;
export const UIKit: ComponentType<Record<string, unknown>>;
export function createAprilTheme(): unknown;
export function useDensity(): {
  density: "comfortable" | "compact";
  setDensity: (density: "comfortable" | "compact") => void;
  toggleDensity: () => void;
};
EOF
  echo "[ds:prepare] prepared fallback @april/ui dist/index.d.ts"
}

ensure_ui_runtime_exports() {
  ui_pkg_dir="${DS_DIR}/packages/ui"
  ui_dist_file="${ui_pkg_dir}/dist/index.js"

  if [ ! -f "${ui_dist_file}" ]; then
    echo "[ds:prepare] ${ui_dist_file} not found, skip ui runtime export check"
    return
  fi

  if grep -q "CardListColumn" "${ui_dist_file}"; then
    return
  fi

  echo "[ds:prepare] CardListColumn export missing in @april/ui dist, try runtime-only rebuild"
  (
    cd "${ui_pkg_dir}"
    pnpm exec tsup --dts false
  )

  if grep -q "CardListColumn" "${ui_dist_file}"; then
    echo "[ds:prepare] restored CardListColumn export in @april/ui dist"
    return
  fi

  echo "[ds:prepare] warning: CardListColumn export still missing after rebuild"
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

sync_design_system_package_dist "ui"
ensure_ui_runtime_exports
ensure_ui_types_stub
prepare_tokens_fallback

