#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const assertScript = resolve(__dirname, "assert-ui-dist-exports.mjs");

const r = spawnSync(process.execPath, [assertScript], { stdio: "inherit" });
process.exit(typeof r.status === "number" ? r.status : 1);
