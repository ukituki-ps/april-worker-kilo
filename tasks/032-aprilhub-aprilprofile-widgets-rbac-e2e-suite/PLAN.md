# План: AprilHub e2e — матрица ролей и виджеты AprilProfile

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-24
- **Статус плана:** согласован (после выполнения — актуален как история решений)

## Исходные допущения

- Keycloak dev-realm импортируется из `infra/keycloak/realm/april-realm.json`; учётки `april-dev` / `april-user` уже есть.
- Hub BFF требует роль `admin` для `/api/v1/admin/profile/*` — ограниченная персона получает 403, не обходим RBAC.
- AprilProfile upstream в compose по умолчанию может быть не задан — интеграционный тест без stub допускает успех **или** штатную ошибку от реального BFF.

## Порядок работ (факт)

1. Зафиксировать матрицу в `docs/guides/APRILHUB_PLAYWRIGHT_PERSONAS.md`, ссылки в `TESTING_STRATEGY` и release gate 4a.
2. Разнести спеки: `guest`, `shell-privileged`, `profile-widgets-smoke`, `rbac-matrix`, `profile-widgets-restricted`, `profile-widgets-integration`.
3. Хелпер `loginThroughKeycloak` (гость → Keycloak или сразу форма `check-sso`).
4. Настроить проекты `guest` / `chromium` в `playwright.config.ts`, npm-скрипты `e2e:integration` / `e2e:smoke`, увеличить `timeout`/`workers` под compose.
5. Прогрев Vite в `run-playwright-aprilhub.sh` (ingress + in-container); переменные в `.env.example`.
6. Прогнать проверки из `TASK.md`, оформить `REPORT.md`.

## Затрагиваемые области

| Область | Изменения |
|---------|-----------|
| Frontend / hub-shell | Playwright config, e2e спеки, `global-setup`, helpers, `package.json` |
| Документация | `docs/guides/APRILHUB_PLAYWRIGHT_PERSONAS.md`, `TESTING_STRATEGY`, runbook 4a, `TASK.md`, `.env.example` |
| Инфра | Без изменений realm (персоны уже достаточны) |
| CI | Без изменений mandatory gate; nightly по-прежнему `./scripts/run-playwright-aprilhub.sh` |

## Риски и откат

- **Flaky OIDC / Keycloak cold start** — митигация: таймауты в `globalSetup`, retries в CI (`retries: 1`).
- **Откат:** реверт ветки `feature/032-aprilhub-aprilprofile-widgets-rbac-e2e-suite`.

## Проверка

Команды из `TASK.md` + `cd hub-shell && npm run e2e:integration`.

## Примечания

- Обновления плана: 2026-04-24 — первичная фиксация по результатам реализации.
