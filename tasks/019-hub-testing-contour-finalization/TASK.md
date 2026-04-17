# Задача: Hub Testing Contour Finalization (Этап 019)

## Мета
- **ID / ветка:** `019-hub-testing-contour-finalization`
- **Приоритет:** высокий
- **Связанные документы:** `task_list.md`, `docs/TESTING_STRATEGY.md`, `.github/workflows/ci.yml`, `README.md`, `Makefile`, `scripts/smoke-aprilhub.sh`, `scripts/run-k6-aprilhub.sh`, `tasks/008-hub-testing-completion/REPORT.md`, `docs/DEPLOYMENT_STRATEGY.md`

## Цель
Финализировать тестовый контур AprilHub до устойчивого release-ready состояния: закрепить обязательный quality gate (локально и в CI), синхронизировать стратегию тестирования с фактической реализацией и зафиксировать операбельные правила triage/runbook для smoke и k6 проверок.

## Контекст для агента
- Этап `008` закрыл baseline тестового контура (unit/smoke/k6), но часть договорённостей остаётся в виде "planned", а не формального release gate.
- В CI уже есть необходимые jobs (`hub-bff`, `hub-shell`, smoke, k6), но нужно зафиксировать правила стабильности и блокирующие критерии для релиза.
- В `docs/TESTING_STRATEGY.md` присутствует целевой контур (включая Playwright/Testcontainers), который нужно явно разделить на "уже mandatory" и "следующий этап".
- Этап `019` должен завершить именно P0-контур: без архитектурного скоуп-расширения и без выхода в production capacity planning.

## Входит в объём
- Стабилизировать и формализовать обязательный CI testing gate для AprilHub.
- Описать единый локальный pre-merge прогон всех обязательных проверок.
- Синхронизировать `docs/TESTING_STRATEGY.md` с фактическим состоянием тестового контура (mandatory vs planned).
- Зафиксировать baseline-правила pass/fail для smoke и k6, включая формат артефактов результата.
- Описать минимальный runbook/triage при падении тестовых job в CI.
- Подготовить `PLAN.md` и `REPORT.md` этапа `019` с фактическими изменениями и результатами проверок.

## Не входит в объём
- Реализация полного Playwright regression-набора.
- Добавление полноразмерного integration-suite с Testcontainers/Atlas для всех сценариев.
- Production-grade нагрузочное профилирование и capacity planning.
- Изменение архитектурных границ `hub-shell`/`hub-bff`.

## Технические ограничения
- Следовать `docs/TESTING_STRATEGY.md` и не создавать параллельный источник истины по тестированию.
- Не изменять keycloak-first auth модель и RBAC-политику в runtime-коде ради тестов.
- Не коммитить секреты/токены; использовать env-переменные и dev-учётки по принятому процессу.
- Для CI/операционных правил сохранить совместимость с `docs/DEPLOYMENT_STRATEGY.md`.

## Критерии готовности (acceptance)
- [x] Зафиксирован и документирован обязательный testing gate (локально + CI) с однозначным pass/fail.
- [x] `docs/TESTING_STRATEGY.md` синхронизирован с фактическим состоянием и отдельно помечает planned-слой.
- [x] Обновлены и согласованы команды pre-merge прогона в проектной документации.
- [x] Для smoke/k6 описаны артефакты, пороги и правила блокировки релиза.
- [x] Описан triage/runbook по типовым падениям обязательных testing job.
- [x] Обязательные проверки проходят без регрессий: openapi lint, `hub-bff` tests, `hub-shell` lint/test/build, smoke, k6 baseline.
- [x] В `REPORT.md` зафиксированы изменения, результаты, ограничения и follow-up (P1/P2).

## Проверка (команды)
```bash
make openapi-lint
cd hub-bff && go test ./...
cd hub-shell && npm ci && npm run lint && npm run test && npm run build
./scripts/smoke-aprilhub.sh
./scripts/run-k6-aprilhub.sh
```

## Результат в отчёте
После выполнения оформить `REPORT.md`: какие изменения внесены в CI/документацию/runbooks, какие проверки пройдены фактически, какой baseline принят как блокирующий для merge/release, что вынесено в follow-up (P1/P2).
