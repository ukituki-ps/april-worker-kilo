# Playwright: персоны Keycloak и матрица e2e AprilHub

Источник учёток для локального и CI-контура: импорт realm [`infra/keycloak/realm/april-realm.json`](../../infra/keycloak/realm/april-realm.json) (пароли в JSON — **только для dev**; на реальных стендах задавайте через Keycloak Admin API / secrets).

## Персоны (dev realm `april`)

| Персона | Пользователь (по умолчанию) | Realm-роли | Назначение в тестах |
|--------|-----------------------------|------------|---------------------|
| Гость | — | — | `guest.spec.ts`: лендинг, OIDC redirect |
| Привилегированный (admin) | `PLAYWRIGHT_USER` → `april-dev` | `user`, `admin` | Виджеты admin API, конфликты/merge, shell |
| Ограниченный (без admin) | `PLAYWRIGHT_RESTRICTED_USER` → `april-user` | `user` | RBAC shell, 403 на `/api/v1/admin/profile/*` |

В realm также объявлена роль `manager` (без отдельной учётки в импорте): при необходимости расширения матрицы добавьте пользователя через Keycloak и зафиксируйте переменные окружения в CI secrets.

## Ожидаемое поведение UI / BFF

| Маршрут / API | Гость | user (без admin) | user + admin |
|---------------|-------|------------------|--------------|
| Гостевой лендинг `/` | ✅ | n/a | n/a |
| Авторизованная зона | редирект на login | ✅ | ✅ |
| Сайдбар: пункты без `requiresRole` | скрыт | ✅ | ✅ |
| «Профиль — конфликты и merge», «Админ-контур» | скрыт | скрыты | ✅ |
| Прямой `#/app/profile/admin/conflicts` | — | `Доступ запрещен` | ✅ виджет |
| Прямой `#/app/admin-control` | — | `Доступ запрещен` | экран (BrokenWidget в админе — отдельная история) |
| `GET/POST /api/v1/admin/profile/...` через BFF | 401 | **403** `insufficient role` | ✅ при наличии upstream (`APRIL_PROFILE_ADMIN_URL`) |

## Переменные окружения

| Переменная | Назначение |
|------------|------------|
| `PLAYWRIGHT_BASE_URL` | Базовый URL ingress (по умолчанию `http://localhost:8080`) |
| `PLAYWRIGHT_USER` / `PLAYWRIGHT_PASSWORD` | Учётка с ролью `admin` для privileged-сценариев |
| `PLAYWRIGHT_RESTRICTED_USER` / `PLAYWRIGHT_RESTRICTED_PASSWORD` | Учётка только с `user` |

Скрипт [`scripts/run-playwright-aprilhub.sh`](../../scripts/run-playwright-aprilhub.sh) экспортирует значения по умолчанию, совместимые с dev-realm.

**Примечание:** в `hub-shell` используется `keycloak.init({ onLoad: "check-sso" })`. Первый заход на `/` иногда сразу открывает форму Keycloak (без гостевого лендинга). Хелпер [`tests/e2e/helpers/login.ts`](../../hub-shell/tests/e2e/helpers/login.ts) (`loginThroughKeycloak`) учитывает оба варианта.

## Команды Playwright

```bash
cd hub-shell && npm ci && npm run e2e:install
./scripts/run-playwright-aprilhub.sh
# только интеграционный файл (реальный BFF, без page.route):
cd hub-shell && npm run e2e:integration
# без integration (чуть быстрее локально):
cd hub-shell && npm run e2e:smoke
```

Артефакты при падениях: `trace` / screenshot / video (`retain-on-failure`), HTML-отчёт в `hub-shell/playwright-report/`.

## Проекты Playwright

| Проект | Спеки |
|--------|--------|
| `guest` | `guest.spec.ts` (без авторизации) |
| `chromium` | все остальные `*.spec.ts` |

## Файлы спеков и хелперов

| Файл | Содержание |
|------|------------|
| `tests/e2e/guest.spec.ts` | Гость, редирект на Keycloak |
| `tests/e2e/shell-privileged.spec.ts` | Shell, админ-навигация, выход |
| `tests/e2e/profile-widgets-smoke.spec.ts` | Виджеты 4a со `page.route` |
| `tests/e2e/rbac-matrix.spec.ts` | RBAC restricted |
| `tests/e2e/profile-widgets-restricted.spec.ts` | 403 без stubs |
| `tests/e2e/profile-widgets-integration.spec.ts` | Реальный BFF |
| `tests/e2e/helpers/login.ts` | `loginThroughKeycloak`, гостевой CTA |

**Follow-up:** при стабильном прогреве Vite в CI можно снова ввести `globalSetup` + `storageState` по персонам, чтобы не дублировать OIDC в каждом тесте.
