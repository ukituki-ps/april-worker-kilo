## 1) Итого
- Статус: ⚠️ частично
- Задача: Hub Testing Contour Extensions (Этап 020)
- Ветка: `feature/020-hub-testing-contour-extensions`
- Коммиты: `9b32d44`
- PR: https://github.com/ukituki-ps/april-worker/pull/23

## 2) Что сделано
- [frontend] Добавлен Playwright smoke-набор (`hub-shell/tests/e2e/smoke.spec.ts`) и конфиг (`hub-shell/playwright.config.ts`), обновлены npm-команды `e2e`/`e2e:install`.
- [backend] Добавлен integration-suite `hub-bff/integration/integration_test.go` на Testcontainers + Atlas migration flow; добавлена миграция `hub-bff/integration/testdata/atlas/202604170001_create_integration_probe.sql`.
- [infra / load] Добавлен extended k6 профиль `k6/aprilhub-extended.js` и скрипт запуска `scripts/run-k6-aprilhub-extended.sh`.
- [ci] Добавлен nightly workflow `.github/workflows/testing-extensions-nightly.yml` (Playwright smoke, integration suite, k6 extended) с артефактами и `quality-metrics.json`.
- [docs] Обновлён `docs/TESTING_STRATEGY.md`, добавлен runbook `docs/runbooks/APRILHUB_TESTING_QUALITY_METRICS.md`, синхронизирован `task_list.md`.

## 3) Изменённые файлы
- `.github/workflows/testing-extensions-nightly.yml`
- `docs/TESTING_STRATEGY.md`
- `docs/runbooks/APRILHUB_TESTING_QUALITY_METRICS.md`
- `hub-shell/package.json`
- `hub-shell/package-lock.json`
- `hub-shell/playwright.config.ts`
- `hub-shell/tests/e2e/smoke.spec.ts`
- `hub-bff/go.mod`
- `hub-bff/go.sum`
- `hub-bff/integration/integration_test.go`
- `hub-bff/integration/testdata/atlas/202604170001_create_integration_probe.sql`
- `k6/aprilhub-extended.js`
- `scripts/run-playwright-aprilhub.sh`
- `scripts/run-k6-aprilhub-extended.sh`
- `task_list.md`
- `tasks/020-hub-testing-contour-extensions/PLAN.md`
- `tasks/020-hub-testing-contour-extensions/REPORT.md`

## 4) Миграции и данные
- Миграции Atlas: добавлены (тестовая миграция integration-suite)
- Какие таблицы/индексы изменены: `integration_probe` (только внутри ephemeral PostgreSQL container integration-теста)
- Обратимость: да, в рамках тестового окружения контейнеры ephemeral; runtime schema не менялась

## 5) Проверка качества
- Линтер: `cd hub-shell && npm run lint` — ok
- Сборка: не запускалась в рамках этапа (фокус на P1/P2 test contour)
- Unit tests: `cd hub-bff && go test ./...` — ok
- Integration tests: `cd hub-bff && go test ./... -run Integration` — ok (при наличии `atlas`; без него suite корректно skip)
- E2E / smoke: `cd hub-shell && npm run e2e -- --list` — fail в текущем окружении из-за прав на существующий `hub-shell/node_modules`
- Load extended: `./scripts/run-k6-aprilhub-extended.sh` — fail в текущем окружении (DNS резолвинг `hub-bff` внутри ad-hoc curl container)

Команды (фактически выполненные):
```bash
cd hub-bff && go test ./... -run Integration
cd hub-bff && go test ./...
cd hub-shell && npm run lint
cd hub-shell && npm run e2e -- --list
./scripts/run-k6-aprilhub-extended.sh
```

## 6) Деплой
- Среда: нет
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
- Образы: не применялось
- Health / readiness: не применялось
- Rollback: не требовался

## 7) Риски и ограничения
- В локальном workspace есть root-owned `hub-shell/node_modules`, из-за чего `npm install/npm ci` завершаются ошибкой прав.
- Extended k6-скрипт требует follow-up по сетевому доступу ad-hoc `curl` контейнера к `hub-bff` в compose-сети.
- Nightly jobs добавлены как scheduled/non-blocking; в mandatory P0 слой не переводились.

## 8) Что осталось
- [x] Основные deliverables этапа `020` реализованы и переданы в PR: [#23](https://github.com/ukituki-ps/april-worker/pull/23).
- [ ] Операционный follow-up (локальное окружение): восстановить права/чистое состояние `hub-shell/node_modules`, затем выполнить `cd hub-shell && npm run e2e` и сохранить артефакты прогона.
- [ ] Операционный follow-up (network/runtime): стабилизировать DNS-доступ к `hub-bff` в `scripts/run-k6-aprilhub-extended.sh` (CI + локаль), затем подтвердить стабильный `pass` extended-профиля.
