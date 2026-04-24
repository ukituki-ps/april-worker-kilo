# Release gate: виджеты профиля 4a в AprilHub

Назначение: зафиксировать **обязательный** набор проверок перед merge/release кандидата Hub, когда затронуты хостовые экраны профиля (карточка сущности, список профилей, экземпляры, история версий, конфликты/merge) и связанные маршруты BFF.

Источник постановки: `april-profile-1/tasks/034-phase-4a-hub-widget-release-gates-smoke/TASK.md`. Канон semver и матрица Host×Widget: `april-profile-1/docs/VERSIONING_AND_COMPATIBILITY.md`, чеклист пакета: `april-profile-1/docs/WIDGET_RELEASE_CHECKLIST.md`.

## 1. Обязательный набор (P0, блокирует merge без явного согласования)

Соответствует [`docs/TESTING_STRATEGY.md`](../TESTING_STRATEGY.md), раздел **Mandatory слой**:

| Шаг | Что проверяет | Команда / job CI |
|-----|----------------|------------------|
| 1 | Обратная совместимость OpenAPI | `scripts/check-openapi-compat.sh` → job `openapi-compatibility` |
| 2 | Линт OpenAPI и сборка docs | `make openapi-lint`, `make docs-build` → job `quality` |
| 3 | Hub BFF | `cd hub-bff && go test ./...` → job `hub-bff` |
| 4 | Hub Shell: lint, unit, production build | `cd hub-shell && npm ci && npm run ds:prepare && npm run lint && npm run test && npm run build` → job `hub-shell` |
| 4a | Политика semver для `@april/profile-ui` (когда зависимость объявлена) | `cd hub-shell && node scripts/check-april-profile-ui-semver.mjs` → шаг в job `hub-shell` |
| 5 | Runtime smoke (ingress, Keycloak, RBAC, агрегация) | `./scripts/smoke-aprilhub.sh` → job `aprilhub-smoke` |
| 6 | Нагрузочный baseline k6 | `./scripts/run-k6-aprilhub.sh` → job `aprilhub-k6-baseline` |

**Правило:** любой красный шаг из таблицы выше — не выпускать кандидат в `develop`/релиз без письменного согласования ответственного за платформу (исключения фиксируются в PR и в `REPORT.md` задачи).

## 2. Минимальный набор Playwright (критичный путь виджетов 4a)

Сценарии в `hub-shell/tests/e2e/smoke.spec.ts` (запуск через `./scripts/run-playwright-aprilhub.sh` или `cd hub-shell && npm run e2e` при уже поднятом контуре):

| Сценарий | Покрытие 4a |
|----------|-------------|
| Гость → Keycloak → авторизованная зона | Вход и shell |
| «Профиль — карточка», сохранение, `onSaveSuccess` | Карточка сущности / виджетный слот |
| Deep-link на карточку | Навигация после входа |
| «Профиль — список», create | Список профилей |
| «Профиль — экземпляры» + update + «история экземпляра» | Экземпляры и история версий |
| «Профиль — конфликты и merge» (stubs) | Админ-конфликты |
| Вход без `admin` на `#/app/profile/admin/conflicts` | RBAC shell |

На PR в `main`/`develop` эти сценарии **не** входят в обязательный self-hosted CI (тяжёлый compose); они включены в nightly (`.github/workflows/testing-extensions-nightly.yml`, job `hub-shell-playwright-smoke`). Перед **релизом** или крупным изменением виджетов 4a рекомендуется локально прогнать `./scripts/run-playwright-aprilhub.sh` и приложить лог/отчёт к PR.

## 3. Semver `@april/profile-ui`

- Hub фиксирует версии в `hub-shell/package-lock.json`; обновление **major** виджета — отдельный PR с миграцией по документации профиля и обновлённым e2e.
- После `npm ci` в CI выполняется `node scripts/check-april-profile-ui-semver.mjs`: при отсутствии зависимости в `package.json` шаг no-op (хостовая реализация в `hub-shell`); при объявлении пакета — проверка lockfile и допустимого major (`APRIL_PROFILE_UI_ALLOWED_MAJOR`, по умолчанию `1`) и диапазона `^…` при наличии.

## 4. Если упали smoke / e2e / k6

1. Зафиксировать failing job и ссылку на run; для smoke/k6 — артефакты `aprilhub-smoke-artifacts`, `aprilhub-k6-artifacts` (см. [`APRILHUB_TESTING_TRIAGE.md`](./APRILHUB_TESTING_TRIAGE.md)).
2. Воспроизвести локально той же командой; сузить слой (только shell / только compose).
3. **Не мержить** в защищённые ветки до зелёного прогона или явного согласования.
4. Для инцидента на уже выкатанном dev: откат по [`docs/DEPLOYMENT_STRATEGY.md`](../DEPLOYMENT_STRATEGY.md) (образы по предыдущему SHA, порядок compose).

## 5. Rollback / mitigation при несовместимости semver или peer

1. Откатить PR с bump `@april/profile-ui` / lockfile к предыдущему зелёному коммиту.
2. Если конфликт peer (`react`, `@mantine/core`, `@april/ui`): выровнять версии по peer виджета или отложить bump DS до согласованной задачи.
3. Если нужен срочный hotfix без обновления виджета: cherry-pick только исправлений Hub, не трогая lockfile виджета.

## 6. Эксплуатационный чеклист перед релизом Hub (кратко)

- [ ] Все P0 jobs зелёные на последнем коммите PR.
- [ ] Прогнан Playwright smoke локально или подтверждён зелёный nightly после последних изменений в ветке.
- [ ] Обновление `@april/profile-ui` (если было) отражено в описании PR с ссылкой на changelog/major-migration.
- [ ] Нет незакоммиченных секретов; `images.env` / деплой — по [`DEPLOYMENT_STRATEGY.md`](../DEPLOYMENT_STRATEGY.md).
