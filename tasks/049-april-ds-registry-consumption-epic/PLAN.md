# План эпика: версионируемые пакеты `@april/ui` / `@april/tokens` из registry (вариант 5)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-29
- **Статус плана:** черновик для согласования между AprilHub, AprilProfile, DisignApril

---

## 1. Проблема

При потреблении дизайн-системы через **`file:`** + **submodule** + **bind-mount** на стендах возможен рассинхрон:

- исходники `hub-shell` / доменного UI уже импортируют новые named exports из `@april/ui`;
- **`packages/ui/dist/index.js`** на диске стенда устарел (skip `ds:prepare`, read-only `node_modules`, забытый `pnpm build` после `git pull`).

Симптом: **белый экран**, runtime `SyntaxError: does not provide an export named '…'`, инциденты без явного `requestId` (падение до BFF).

См. triage: [`tasks/048-aprilhub-dev-white-screen-stale-ui-dist/REPORT.md`](../048-aprilhub-dev-white-screen-stale-ui-dist/REPORT.md).

---

## 2. Суть проблемы

Источник истины для **runtime-артефакта**, который исполняет браузер, не зафиксирован как **иммутабельная версия** в lockfile потребителей: фактическая сборка DS зависит от локального/серверного состояния рабочего дерева, а не от **опубликованного артефакта + semver**.

---

## 3. Цель (решение)

- Публиковать **`@april/ui`** и **`@april/tokens`** в **единый приватный npm registry** (рекомендация по текущему стеку April: **GitHub Packages**, scope `@april`, теги версий semver).
- AprilHub и AprilProfile в CI и на стендах устанавливают зависимости **только из registry** (`npm ci` по lock), без обязательного `pnpm build` submodule на пути критического деплоя.
- Submodule **DisignApril** в AprilHub остаётся **опционально** для витрины (`april-showcase`), локальной разработки и синхронизации исходников до релиза DS — не как единственный источник runtime для shell.

---

## 4. Необходимый результат (сквозной)

| # | Результат | Где фиксируется |
|---|-----------|-----------------|
| R1 | Опубликованы пакеты `@april/ui@x.y.z`, `@april/tokens@x.y.z` с корректными `exports` в `package.json` | DisignApril + registry |
| R2 | AprilHub `hub-shell` зависит от semver из registry; CI зелёный без полного build submodule на каждом PR (или с явным opt-in) | april-worker |
| R3 | AprilProfile фронтенд (и прочие потребители) — то же | april-profile-1 |
| R4 | Документация: контракт потребления, деплой, секреты `.npmrc`, порядок bump | все три репо |
| R5 | ADR в AprilHub: граница «исходники DS vs опубликованный пакет», политика breaking | april-worker `docs/architecture/` |
| R6 | Сквозная проверка: bump одной версии → Hub + Profile собираются; dev-стенд без stale `dist` по классу 048 | задача 049-99 |

---

## 5. План верхнеуровневый

1. **Согласование:** registry (ghcr npm vs npmjs), scope, who publishes, semver policy.
2. **DisignApril:** CI publish, содержимое пакета, первая опубликованная версия.
3. **AprilHub:** ADR + смена зависимостей `hub-shell` + CI + `deploy`/compose + доки.
4. **AprilProfile:** `.npmrc`, зависимости, CI/Dockerfile, доки.
5. **Верификация:** сквозной сценарий bump + деплой dev + smoke.

Зависимости: **1 → 2 → (3 параллельно 4 после первой версии)** → 5.

---

## 6. План детальный по репозиториям

### 6.1 DisignApril (`ukituki-ps/DisignApril-kilo

- Включить **версии** в `packages/ui/package.json` и `packages/tokens/package.json` (единая политика: начать с `0.1.0` или текущего согласованного).
- `pnpm build` в CI; артефакт публикации = `dist` + типы + минимальный `package.json` (поле `files`, `exports`, `sideEffects` для CSS).
- Workflow: на **git tag** `tokens-v*` / `ui-v*` или на **release** с input version (команда выбирает один канонический способ).
- Secrets: `GITHUB_TOKEN` (packages:write) или отдельный PAT с минимальными правами.
- Документация в самом DisignApril: `README` / `docs` — как опубликовать, как deprecation/breaking.

### 6.2 AprilHub (`ukituki-ps/april-worker-kilo

- **ADR:** зафиксировать решение о registry, совместимости с submodule для showcase, политике обновления.
- **`hub-shell/package.json`:** `"@april/ui": "^x.y.z"`, `"@april/tokens": "^x.y.z"` (диапазоны по согласованию).
- **`.npmrc`** в `hub-shell` (или корень — по принятому в CI): `@april:registry=https://npm.pkg.github.com` + `always-auth` через env.
- **CI** (`.github/workflows/ci.yml`, bootstrap): перед `npm ci` экспорт `NODE_AUTH_TOKEN`; убрать или ослабить обязательность полного `ds:prepare` build submodule для gate shell (оставить `ds:check-exports` только если ещё используется `file:` на переходный период — см. подзадачи).
- **`docs/guides/DESIGN_SYSTEM.md`**, **`DEPLOYMENT_STRATEGY.md`**, при необходимости **`AGENT_ARCHITECTURE_CONTEXT.md`**: потребление через registry; чеклист сервера (токен для pull пакетов в CI runner и при необходимости на self-hosted build).
- **`docker-compose.yml` / deploy:** образы hub-shell должны получать зависимости при build из registry (не полагаться на `@fs` из хоста для продукта). Реализация CI/compose/token для установки: задача **049-04** (`NODE_AUTH_TOKEN`, `permissions.packages: read`, `GPR_READ_TOKEN`, переменная в compose и §3.1 в `DEPLOYMENT_STRATEGY.md`).
- **Submodule:** оставить для `april-showcase` и локальной разработки; описать в доке, что bump UI для shell = PR с обновлением lock, а не только submodule SHA.

### 6.3 AprilProfile (`april-profile-1`)

- Аналогично: `.npmrc`, зависимости от `@april/*`, секреты в GitHub Actions и в Docker build.
- Убрать `file:` на DS при переходе; зафиксировать в профилевой документации ссылку на ADR/гайд Hub или дублировать краткий раздел.
- Политика bump согласована с командой Hub (один PR на экосистему или независимые — зафиксировать).

---

## 7. Риски и откат

| Риск | Митигация |
|------|-----------|
| Простой CI при истечении токена | PAT с rotation, документированный secret owner |
| Расхождение версий Hub vs Profile | Совместный релиз-чеклист; при необходимости жёсткая связка минорных версий в доке |
| Публичная утечка приватного пакета | Только приватный registry + `repository` visibility |

Откат: вернуть `file:` + submodule в отдельной ветке и зафиксировать в ADR «revert pointer».

---

## 8. Связанные документы (просмотрены при подготовке плана)

- [`docs/guides/DESIGN_SYSTEM.md`](../../docs/guides/DESIGN_SYSTEM.md) — текущая модель `file:` + submodule + `ds:prepare`
- [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md) — ghcr, deploy root, secrets
- [`docs/architecture/INTEGRATION_CONTRACTS.md`](../../docs/architecture/INTEGRATION_CONTRACTS.md) — контекст межсервисных контрактов (DS — не API, но согласование версий влияет на интеграцию UI)
- [`docs/AGENT_TASK_TEMPLATE.md`](../../docs/AGENT_TASK_TEMPLATE.md), [`docs/AGENT_PLAN_TEMPLATE.md`](../../docs/AGENT_PLAN_TEMPLATE.md)

---

## 9. Подзадачи в этом репозитории (AprilHub)

См. каталог [`./`](./): `TASK-049-01` … `TASK-049-99` — отдельные файлы постановок для агентов/исполнителей.

Внешние постановки для копирования: [`EXTERNAL_DISIGNAPRIL_TASK.md`](./EXTERNAL_DISIGNAPRIL_TASK.md), [`EXTERNAL_APRILPROFILE_TASK.md`](./EXTERNAL_APRILPROFILE_TASK.md).
