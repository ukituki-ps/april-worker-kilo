# План: Hub Testing Contour Extensions (Этап 020)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-17
- **Статус плана:** выполнен

## Исходные допущения
- P0-контур из этапа `019` закрыт или близок к закрытию и остаётся release-blocking основой.
- Этап `020` реализуется без изменения архитектурных границ `hub-shell`/`hub-bff`.
- Расширения P1/P2 допускают поэтапное включение в CI (часть может стартовать как non-blocking/nightly).

## Порядок работ (шаги)
1. ✅ Подготовить Playwright-контур в `hub-shell`:
   - инфраструктура тестов,
   - 2-3 smoke-сценария критического пути,
   - артефакты падений.
2. ✅ Добавить integration-suite для `hub-bff`:
   - Testcontainers для зависимостей,
   - миграции через Atlas,
   - минимальный набор happy/negative/degraded сценариев.
3. ✅ Добавить extended k6 профиль и скрипт запуска (nightly/scheduled).
4. ✅ Определить quality-метрики тестового pipeline и зафиксировать их в документации.
5. ✅ Актуализировать CI/scheduled workflows и документацию запуска.
6. ✅ Выполнить проверки и оформить финальный `REPORT.md`.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Frontend (`hub-shell`) | Playwright smoke tests + команды запуска |
| Backend (`hub-bff`) | Integration-suite на Testcontainers/Atlas |
| CI / workflows | Добавление новых jobs и/или nightly расписаний |
| Load-testing | Extended k6 script/profile поверх baseline |
| Документация | Синхронизация `TESTING_STRATEGY`, runbook и task-артефактов |

## Риски и откат
- **Риск:** рост времени CI. → **Митигация:** разделение blocking (PR) и scheduled (nightly) контуров.
- **Риск:** нестабильность integration/E2E окружения. → **Митигация:** явные readiness checks и диагностические артефакты.
- **Риск:** сложность локального запуска. → **Митигация:** единые команды и короткий runbook.
- При откате: удалить/отключить новые jobs и тестовые suites, вернуть предыдущие workflow/доки.

## Проверка после выполнения
- `cd hub-shell && npm run lint` (ok)
- `cd hub-shell && npm run e2e -- --list` (не выполнено: локальная проблема прав на `node_modules`)
- `cd hub-bff && go test ./... -run Integration` (ok; при отсутствии `atlas` suite корректно skip)
- `cd hub-bff && go test ./...` (ok)
- `./scripts/run-k6-aprilhub-extended.sh` (fail на DNS-резолвинге `hub-bff` внутри docker run окружения, требует follow-up)

## Примечания
- Этап `020` покрывает P1/P2-улучшения и не должен блокировать выпуск, если P0 полностью закрыт.
