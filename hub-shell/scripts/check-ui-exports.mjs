#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const uiDistPath = resolve(process.cwd(), "../design-system/DisignApril/packages/ui/dist/index.js");
const source = readFileSync(uiDistPath, "utf8");

const exportBlocks = source.matchAll(/export\s*\{([^}]*)\}/g);
const hasCardListColumnExport = Array.from(exportBlocks).some((match) => {
  const parts = match[1].split(",").map((part) => part.trim());
  return parts.some(
    (part) =>
      part === "CardListColumn" ||
      part.startsWith("CardListColumn as ") ||
      part.endsWith(" as CardListColumn"),
  );
});

if (!hasCardListColumnExport) {
  console.error("[ds:check-exports] missing named export CardListColumn in @april/ui dist/index.js");
  process.exit(1);
}

console.log("[ds:check-exports] ok: CardListColumn named export is present");
