#!/usr/bin/env node
/**
 * Проверка политики semver для @april/profile-ui в hub-shell.
 * При отсутствии зависимости — успешный no-op (виджеты могут быть встроены в репозиторий).
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const shellRoot = join(__dirname, "..");
const pkgPath = join(shellRoot, "package.json");
const lockPath = join(shellRoot, "package-lock.json");

const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const allDeps = {
  ...pkg.dependencies,
  ...pkg.devDependencies,
  ...pkg.optionalDependencies,
};
const spec = allDeps["@april/profile-ui"];

if (!spec) {
  console.log(
    "[check-april-profile-ui-semver] OK: @april/profile-ui не объявлен — хостовые виджеты 4a встроены в hub-shell. При подключении npm-пакета добавьте зависимость и диапазон по VERSIONING_AND_COMPATIBILITY (april-profile-1).",
  );
  process.exit(0);
}

function parseSemver(v) {
  const m = String(v).trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3] };
}

/** Для major >= 1: ^X.Y.Z означает >= X.Y.Z и major X. */
function satisfiesCaret(minVersion, resolved) {
  const min = parseSemver(minVersion);
  const res = parseSemver(resolved);
  if (!min || !res) return false;
  if (res.major !== min.major) return false;
  if (min.major > 0) {
    if (res.minor > min.minor) return true;
    if (res.minor < min.minor) return false;
    return res.patch >= min.patch;
  }
  // 0.x: ^0.a.b — та же minor, patch >= b (упрощённо достаточно для наших диапазонов).
  if (res.minor !== min.minor) return false;
  return res.patch >= min.patch;
}

if (spec.startsWith("file:") || spec.startsWith("workspace:")) {
  const rel = spec.replace(/^file:/, "").trim();
  const target = resolve(shellRoot, rel);
  const inner = join(target, "package.json");
  if (!existsSync(inner)) {
    console.error("[check-april-profile-ui-semver] FAIL: не найден package.json по пути", inner);
    process.exit(1);
  }
  const innerPkg = JSON.parse(readFileSync(inner, "utf8"));
  const v = innerPkg.version;
  if (!parseSemver(v)) {
    console.error("[check-april-profile-ui-semver] FAIL: невалидная версия в связанном пакете:", v);
    process.exit(1);
  }
  console.log(`[check-april-profile-ui-semver] OK: локальная связь ${spec} → версия ${v} (${target})`);
  process.exit(0);
}

const lockRaw = readFileSync(lockPath, "utf8");
const lock = JSON.parse(lockRaw);
const nodeKey = "node_modules/@april/profile-ui";
const entry = lock.packages?.[nodeKey];
const resolved = entry?.version;
if (!resolved) {
  console.error(
    "[check-april-profile-ui-semver] FAIL: в package-lock нет",
    nodeKey,
    "— выполните npm install и закоммитьте lockfile.",
  );
  process.exit(1);
}

const expectedMajor = +process.env.APRIL_PROFILE_UI_ALLOWED_MAJOR || 1;
const rv = parseSemver(resolved);
if (!rv || rv.major !== expectedMajor) {
  console.error(
    `[check-april-profile-ui-semver] FAIL: установлена версия ${resolved}, ожидается major=${expectedMajor} (переменная APRIL_PROFILE_UI_ALLOWED_MAJOR после согласованного bump).`,
  );
  process.exit(1);
}

if (spec.startsWith("^")) {
  const minVer = spec.slice(1).trim();
  if (!satisfiesCaret(minVer, resolved)) {
    console.error(`[check-april-profile-ui-semver] FAIL: ${resolved} не удовлетворяет диапазону ${spec}`);
    process.exit(1);
  }
} else if (/^\d+\.\d+\.\d+/.test(spec)) {
  const want = spec.match(/^(\d+\.\d+\.\d+)/)?.[1];
  const got = parseSemver(resolved);
  const w = parseSemver(want ?? "");
  if (!want || !got || !w || got.major !== w.major || got.minor !== w.minor || got.patch !== w.patch) {
    console.error(`[check-april-profile-ui-semver] FAIL: ожидается точная версия ${want}, lock даёт ${resolved}`);
    process.exit(1);
  }
} else {
  console.error("[check-april-profile-ui-semver] FAIL: неподдерживаемая спецификация версии:", spec);
  process.exit(1);
}

console.log(`[check-april-profile-ui-semver] OK: @april/profile-ui@${resolved} (spec: ${spec})`);
process.exit(0);
