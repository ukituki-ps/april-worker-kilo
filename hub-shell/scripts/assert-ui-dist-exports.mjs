#!/usr/bin/env node
/**
 * Verifies named exports in @april/ui dist/index.js (ESM bundle).
 * Used by ds-prepare (rebuild if stale) and ds:check-exports (CI gate).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const REQUIRED = ["CardListColumn", "ProductHeaderToolbar", "ProductSidebarNavigation"];

const installedUiDist = resolve(__dirname, "../node_modules/@april/ui/dist/index.js");
const submoduleUiDist = resolve(__dirname, "../../design-system/DisignApril/packages/ui/dist/index.js");
const defaultDist = existsSync(installedUiDist)
  ? installedUiDist
  : submoduleUiDist;
const distPath = process.argv[2] ?? defaultDist;

function hasNamedExport(source, name) {
  const exportBlocks = source.matchAll(/export\s*\{([^}]*)\}/g);
  return Array.from(exportBlocks).some((match) => {
    const parts = match[1].split(",").map((part) => part.trim());
    return parts.some(
      (part) =>
        part === name ||
        part.startsWith(`${name} as `) ||
        part.endsWith(` as ${name}`),
    );
  });
}

let source;
try {
  source = readFileSync(distPath, "utf8");
} catch {
  console.error(`[assert-ui-dist-exports] cannot read: ${distPath}`);
  process.exit(1);
}

const missing = REQUIRED.filter((n) => !hasNamedExport(source, n));
if (missing.length > 0) {
  console.error(`[assert-ui-dist-exports] missing named exports in ${distPath}: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`[assert-ui-dist-exports] ok: ${REQUIRED.join(", ")}`);
process.exit(0);
