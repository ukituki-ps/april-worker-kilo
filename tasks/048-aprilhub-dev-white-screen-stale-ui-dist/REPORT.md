# Отчёт: 048 — белый экран dev.april (stale `@april/ui` dist)

## 1) Итого

- Статус: ✅ выполнено (кодовый guard + RCA; деплой на dev — операционный follow-up)
- Задача: Incident triage: белый экран `https://dev.april.ukituki.tech/`
- Ветка: `fix/disignapril-submodule-ci` (текущая рабочая ветка; при необходимости перенести коммит в `fix/*` только для этого фикса)
- Коммиты: см. `git log -1 --oneline` на ветке фикса
- PR: не создавался

## 2) Инцидент (формат triage)

1. **Инцидент:** белый экран на корне `https://dev.april.ukituki.tech/`, окружение **dev**, окно triage **2026-04-29** (UTC).
2. **Корреляция:**
   - **route:** `/` (до отрисовки shell).
   - **requestId / correlationId / tenant / roleSet:** не применимы — падение на этапе ESM-import до прикладных API и до генерации корреляции в BFF.
   - **Sentry:** прямой доступ к issue в контуре агента не использовался; эквивалент — воспроизведение через Playwright (см. ниже).
3. **Наблюдения по слоям:**
   - **Sentry (эквивалент):** headless Chromium зафиксировал `PAGEERROR`: модуль `/@fs/.../design-system/DisignApril/packages/ui/dist/index.js` **does not provide an export named `ProductHeaderToolbar`**; `#root` пустой.
   - **Дополнительно (Vite dev):** ошибки WebSocket HMR (`wss://dev.april.ukituki.tech/...` → 200, попытка `localhost:4173`) — следствие режима Vite dev за reverse proxy; не первопричина белого экрана относительно import-error.
   - **Loki** (`stand=stand-192-168-1-42`): логи `april-worker-hub-shell-1` содержат успешный старт `VITE v5.4.21 ready`; записей об ошибке импорта нет (ошибка только в браузерном runtime). По строке `ProductHeaderToolbar` видны лишь следы пре-трансформации исходников.
   - **Prometheus:** `up{job="aprilhub_dynamic_targets", stand="stand-192-168-1-42", instance="192.168.1.42:8081", service="hub-bff"} = 0` — **hub-bff target down** на стенде dev; паттерн известен по предыдущим triage, с **import-failure** первопричинно не связан (приложение падает до сетевых вызовов BFF).
4. **Классификация:** **UI / runtime integration defect (AprilHub host + артефакт `@april/ui` dist)**. Owner: AprilHub frontend + pipeline сборки DisignApril на стенде.
5. **Root cause:** после задачи **047** (`ProductHeaderToolbar`, `ProductSidebarNavigation`) код `hub-shell` импортирует новые символы из `@april/ui`, а **устаревший** `packages/ui/dist/index.js` на стенде (или до полного `pnpm build` в `DisignApril`) не содержит named exports → **SyntaxError** при загрузке модуля → белый экран. Ранее guard проверял только `CardListColumn`, поэтому «частично актуальный» dist проходил проверку.

## 3) Что сделано

- [frontend / tooling] Добавлен `hub-shell/scripts/assert-ui-dist-exports.mjs`: обязательные named exports в `dist/index.js` — `CardListColumn`, `ProductHeaderToolbar`, `ProductSidebarNavigation`.
- [frontend] `check-ui-exports.mjs` делегирует проверку этому скрипту (gate для `lint` / `build`).
- [frontend] `ds-prepare.sh`: `ensure_ui_runtime_exports` вызывает assert; при провале — прежний runtime-only rebuild (`pnpm exec tsup --dts false` в `packages/ui`), затем повторная проверка.

## 4) Изменённые файлы

- `hub-shell/scripts/assert-ui-dist-exports.mjs` (новый)
- `hub-shell/scripts/check-ui-exports.mjs`
- `hub-shell/scripts/ds-prepare.sh`

## 5) Миграции и данные

- Миграции Atlas: нет.

## 6) Проверка качества

- Линтер: ok (`npm --prefix hub-shell run lint`)
- Сборка: ok (`npm --prefix hub-shell run build`)
- Unit tests: не запускались (не затронуты)
- E2E / smoke: не запускались

Команды:

```bash
node hub-shell/scripts/assert-ui-dist-exports.mjs
npm --prefix hub-shell run lint
npm --prefix hub-shell run build
```

Клиентская верификация симптома (до фикса на сервере):

```bash
cd hub-shell && node -e "/* playwright goto dev.april — PAGEERROR ProductHeaderToolbar */"
```

## 7) Деплой

- Среда: dev — **требуется** после merge: на хосте стенда убедиться, что выполнен полный `pnpm build` в `design-system/DisignApril` (или образ/compose подтягивает свежий dist), затем `ds:prepare` и перезапуск контейнера `hub-shell` по `DEPLOYMENT_STRATEGY.md`.
- Образы: не менялись в этом коммите.
- Rollback: откат guard-скриптов при необходимости; для стенда — повтор деплоя предыдущего известного good-образа.

## 8) Риски и ограничения

- Список обязательных exports захардкожен; при добавлении новых публичных компонентов из `@april/ui` в `hub-shell` нужно расширить `REQUIRED` в `assert-ui-dist-exports.mjs`.
- **hub-bff** на `192.168.1.42:8081` остаётся `down` в Prometheus — отдельный infra follow-up.

## 9) Что осталось

- [ ] Задеплоить на dev и повторить Playwright/ручной smoke `https://dev.april.ukituki.tech/`.
- [ ] При появлении доступа к Sentry — завести/сопоставить issue с тем же stack и тегами `route`, `module`, `release`.
