# Задача: Hub Testing Completion (Этап 008)

## Мета
- **ID / ветка:** `008-hub-testing-completion`
- **Приоритет:** высокий
- **Связанные документы:** `task_list.md`, `tasks/000-aprilhub-full-service-roadmap/TASK.md`, `tasks/005-hub-contracts-openapi-hardening/REPORT.md`, `tasks/006-hub-observability-operability/REPORT.md`, `tasks/007-hub-data-runtime-readiness/REPORT.md`, `docs/TESTING_STRATEGY.md`, `docs/DEPLOYMENT_STRATEGY.md`, `docs/architecture/APRILHUB_C3_C4.md`, `docs/architecture/C4_RUNTIME_SEQUENCES.md`, `docs/auth-jwt-keycloak-adapted.md`

## Цель
Закрыть тестовый контур AprilHub до release-ready уровня: довести покрытие по уровням unit/integration/smoke, формализовать воспроизводимый baseline для E2E и k6, а также закрепить это в CI/документации без выхода за архитектурные границы `hub-shell` + `hub-bff`.

## Контекст для агента
- Этапы `001-007` закрыли bootstrap/auth/runtime/contracts/observability и зафиксировали stateless-подход `hub-bff`.
- В репозитории уже есть обязательные проверки `make openapi-lint`, `cd hub-bff && go test ./...`, `./scripts/smoke-aprilhub.sh` и CI jobs для `hub-bff`, `hub-shell`, smoke.
- По `docs/TESTING_STRATEGY.md` этап `008` должен зафиксировать полноценную тестовую пирамиду и нагрузочный baseline (k6) для критических путей.
- IAM-модель не меняется: Keycloak-first auth, RBAC берётся из токена/claims.
- Этап `008` подготавливает почву для `009` (deploy hardening): тестовые артефакты и smoke-after-deploy должны быть воспроизводимыми.

## Входит в объём
- Провести ревизию текущего тестового покрытия AprilHub и зафиксировать gap list:
  - backend unit/integration (`hub-bff` runtime/auth/degraded/metadata corner cases),
  - frontend unit/component (`hub-shell`: auth transitions, guarded UI states),
  - smoke/E2E сценарий `login -> hub -> aggregation widgets`.
- Реализовать и/или усилить тесты по критическим потокам этапов `002-007`:
  - auth/RBAC (`401/403`, role gates, `/me` path),
  - aggregation/degraded/runtime stability,
  - observability-related metadata propagation.
- Зафиксировать воспроизводимый E2E/smoke baseline:
  - минимальный сценарий end-to-end (через существующий compose/runtime профиль),
  - критерии pass/fail и артефакты прогона (логи/отчёты).
- Добавить baseline нагрузочного тестирования (k6) для `hub-bff`:
  - 1-2 сценария на критические endpoint-ы aggregation/API,
  - базовые thresholds (успешность, latency p95/p99) и формат отчёта.
- Синхронизировать CI и task-документацию под новые тестовые артефакты:
  - команды запуска в локальном/CI режиме,
  - `PLAN.md` и `REPORT.md` этапа `008`.

## Не входит в объём
- Полноценный performance tuning и capacity planning production-уровня.
- Масштабный UI/API рефакторинг ради тестов, если не нужен для воспроизводимости.
- Изменение архитектурных границ AprilHub (BFF не становится доменным оркестратором).
- Infra hardening PostgreSQL/Redis (это отдельный этап `011`).
- Dev-deploy pipeline hardening (основной scope этапа `009`).

## Технические ограничения
- Следовать `docs/TESTING_STRATEGY.md`: тестовая пирамида, интеграции, smoke, k6 baseline.
- Не обходить Keycloak-first auth-модель и не дублировать RBAC-политику в коде.
- Если в integration-тестах понадобятся БД-миграции, использовать только Atlas.
- Не коммитить секреты/токены; тестовые креды и env — только через шаблоны/переменные.
- Сохранить совместимость с текущими OpenAPI-контрактами и runtime smoke.

## Критерии готовности (acceptance)
- [x] Подготовлен и согласован `PLAN.md` этапа `008` с декомпозицией unit/integration/smoke/k6.
- [x] Усилено покрытие backend/frontend тестами для критических сценариев auth/RBAC/aggregation/degraded.
- [x] Зафиксирован воспроизводимый E2E/smoke baseline для AprilHub с явными pass/fail критериями.
- [x] Добавлен baseline k6-профиль и формат фиксации результатов нагрузки.
- [x] CI и локальные команды тестирования отражают новые проверки без деградации существующих job.
- [x] Не зафиксировано регрессий в контрактах OpenAPI, auth path и runtime aggregation.
- [x] Проверки `make openapi-lint`, `cd hub-bff && go test ./...`, `./scripts/smoke-aprilhub.sh` и команды этапа `008` проходят.
- [x] В `REPORT.md` отражены фактически добавленные тесты, результаты прогонов, ограничения и follow-up на этапы `009/010`.

## Проверка (команды)
```bash
# обязательный baseline
make openapi-lint
cd hub-bff && go test ./...
./scripts/smoke-aprilhub.sh

# команды этапа 008 (уточнить после реализации):
# frontend unit/component
# cd hub-shell && npm run test
#
# integration/e2e (если добавляются отдельные suites)
# <команда запуска integration/e2e>
#
# k6 baseline
./scripts/run-k6-aprilhub.sh
# или
make aprilhub-k6-baseline
```

## Результат в отчёте
После выполнения оформить `REPORT.md` в этой задаче: какие тестовые уровни закрыты, какие новые сценарии/артефакты добавлены (unit/integration/smoke/k6), какие команды и CI-проверки подтверждены, какие риски и follow-up остаются для этапов `009/010`.
