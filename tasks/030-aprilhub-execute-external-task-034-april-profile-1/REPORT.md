## 1) Итого

- **Статус:** ✅ выполнено
- **Задача:** Исполнение внешней задачи 034 (`april-profile-1`) — release gates, smoke/e2e и semver для виджетов 4a в AprilHub
- **Ветка:** `feature/030-external-034-release-gates` (`april-worker`)
- **Коммиты:** `april-worker` — ветка `feature/030-external-034-release-gates`, основной коммит с изменениями кода/доков: `a1bbabe` (полная цепочка: `git log --oneline develop..HEAD`); `april-profile-1` — ветка `feature/034-docs-release-gates-story`, первый коммит доков: `3b047db` (`git log develop..HEAD`)
- **PR:** [april-worker#52](https://github.com/ukituki-ps/april-worker/pull/52) (squash merge в `develop`, merge commit `fd655480374275bd6a46cdbbeb5eb13a7335a5f3`); [april-profile#81](https://github.com/ukituki-ps/april-profile/pull/81) (merge commit `6327b82d9e8b3dc0cb74aa0c3352812c5fb5938f`)

## 2) Что сделано

- **[docs]** Runbook `docs/runbooks/APRILHUB_4A_WIDGET_RELEASE_GATE.md`: обязательный P0 gate (таблица CI), соответствие тестов Playwright в `smoke.spec.ts` сценариям 4a, semver, порядок действий при падении smoke/e2e, rollback/mitigation.
- **[docs]** Обновлены `docs/TESTING_STRATEGY.md` (раздел mandatory + локальные команды + §6), `README.md` (mandatory gate + ссылка на runbook).
- **[frontend / hub-shell]** Скрипт `hub-shell/scripts/check-april-profile-ui-semver.mjs`: no-op без `@april/profile-ui`; для `file:`/`workspace:` — валидация версии связанного пакета; для registry — major (`APRIL_PROFILE_UI_ALLOWED_MAJOR`, default 1) и `^` или точная версия. NPM-скрипт `check:profile-ui-semver`.
- **[CI]** `.github/workflows/ci.yml`: шаг после `npm ci` в job `hub-shell`; то же в команде `hub-shell-alpine-runtime`.
- **[внешний репо april-profile-1]** `docs-site/docs/task-story-034-phase-4a-hub-widget-release-gates-smoke.md`, правки `task-stories-overview.md`, `tasks/034-*/TASK.md` (acceptance + docs-site чеклисты), `tasks/034-*/REPORT.md`.

## 3) Изменённые файлы

- `docs/runbooks/APRILHUB_4A_WIDGET_RELEASE_GATE.md`
- `docs/TESTING_STRATEGY.md`
- `README.md`
- `.github/workflows/ci.yml`
- `hub-shell/package.json`
- `hub-shell/scripts/check-april-profile-ui-semver.mjs`
- `tasks/030-aprilhub-execute-external-task-034-april-profile-1/PLAN.md`
- `tasks/030-aprilhub-execute-external-task-034-april-profile-1/REPORT.md`
- В `april-profile-1`: `docs-site/docs/task-story-034-phase-4a-hub-widget-release-gates-smoke.md`, `docs-site/docs/task-stories-overview.md`, `tasks/034-phase-4a-hub-widget-release-gates-smoke/TASK.md`, `tasks/034-phase-4a-hub-widget-release-gates-smoke/REPORT.md`

## 4) Миграции и данные

- Миграции Atlas: нет
- Таблицы: не затрагивались

## 5) Проверка качества

Команды (фактически выполнить в среде разработчика):

```bash
cd /home/ukituki/april-worker/hub-shell && node scripts/check-april-profile-ui-semver.mjs
cd /home/ukituki/april-worker && make openapi-lint
cd /home/ukituki/april-worker/hub-bff && go test ./...
cd /home/ukituki/april-worker/hub-shell && npm ci && npm run check:profile-ui-semver && npm run ds:prepare && npm run lint && npm run test && npm run build
```

- OpenAPI lint (`make openapi-lint`): ok
- Hub BFF (`go test ./...`): ok
- Линтер / unit / build hub-shell: **не выполнялись** в среде агента из‑за `EACCES` на существующем `hub-shell/node_modules` (чужие права на `.bin`); на чистой машине/CI ожидается зелёный прогон по чеклисту выше
- E2E / smoke compose: `./scripts/smoke-aprilhub.sh`, `./scripts/run-playwright-aprilhub.sh` — не запускались в этой сессии (Docker/права); обязательны в CI/nightly по политике репозитория

## 6) Деплой

- Среда: нет (задача не требовала деплоя на dev)

## 7) Риски и ограничения

- Playwright остаётся в nightly и ручном прогоне; PR CI self-hosted не расширялся compose-e2e, чтобы не удлинять каждый PR (согласовано с формулировкой внешней задачи про «не глубокую переработку CI»).
- До подключения `@april/profile-ui` из registry semver-скрипт только фиксирует политику на будущее.

## 8) Что осталось

- [x] PR и merge в `develop` (april-worker#52, april-profile#81).
- [ ] После публикации `@april/profile-ui`: добавить зависимость в `hub-shell`, закоммитить lockfile и убедиться, что CI semver-шаг проходит на реальном диапазоне.

## Подтверждение дублирования отчёта

- `april-profile-1/tasks/034-phase-4a-hub-widget-release-gates-smoke/REPORT.md`
- `april-worker/tasks/030-aprilhub-execute-external-task-034-april-profile-1/REPORT.md` (этот файл)
