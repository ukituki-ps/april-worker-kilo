# Задача: Hub Observability & Operability Baseline (Этап 006)

## Мета
- **ID / ветка:** `006-hub-observability-operability`
- **Приоритет:** высокий
- **Связанные документы:** `task_list.md`, `tasks/000-aprilhub-full-service-roadmap/TASK.md`, `tasks/005-hub-contracts-openapi-hardening/REPORT.md`, `docs/architecture/APRILHUB_C3_C4.md`, `docs/architecture/C4_RUNTIME_SEQUENCES.md`, `docs/architecture/INTEGRATION_CONTRACTS.md`, `docs/TESTING_STRATEGY.md`, `docs/DEPLOYMENT_STRATEGY.md`, `docs/auth-jwt-keycloak-adapted.md`

## Цель
Реализовать baseline observability и operability для `AprilHub` (Shell + BFF) после этапа `005`: обеспечить сквозную трассировку запросов (`correlationId/requestId/sourceService`) через runtime-цепочку, добавить прикладные технические логи и базовые метрики для мониторинга latency/error/degraded, а также зафиксировать минимальные эксплуатационные runbooks для инцидентов auth/downstream/degraded-mode.

## Контекст для агента
- Этап `004` реализовал aggregation runtime и degraded responses в `hub-bff`.
- Этап `005` зафиксировал BFF-контракты и OpenAPI `v1` baseline, включая metadata propagation policy.
- По `docs/architecture/APRILHUB_C3_C4.md` `AprilHub` остаётся UI/BFF-слоем, не становясь доменным оркестратором.
- По `docs/TESTING_STRATEGY.md` smoke/integration проверки и метрики должны быть воспроизводимы в CI/dev.
- Auth-модель не меняется: Keycloak-first, без локальных `/auth/login` и `/auth/refresh`.

## Входит в объём
- Уточнить и реализовать сквозную observability-модель для `Hub Shell -> Hub BFF -> downstream`:
  - единые правила передачи и логирования `correlationId/requestId/sourceService`,
  - устойчивое поведение при отсутствии входящих заголовков (генерация/нормализация).
- Добавить/доработать структурированные технические логи в `hub-bff`:
  - входящий запрос (method/path/status/latency),
  - downstream fan-out вызовы (service/path/status/latency/retry count),
  - события degraded mode (какой источник деградировал и почему),
  - auth ошибки (`401`/`403`) с безопасным набором metadata (без утечки токенов/PII).
- Добавить baseline метрики для runtime `hub-bff`:
  - request count/latency/error rate по endpoint-ам,
  - downstream latency/error/degraded counters по source service,
  - метрики retry/timeout budget.
- Подготовить базовый observability runbook для этапа:
  - как диагностировать частые 401/403 (issuer/audience/token),
  - как диагностировать degraded mode по downstream-сервисам,
  - как действовать при росте latency/error-rate.
- Добавить/обновить тесты и проверки observability-контуров:
  - metadata propagation tests,
  - degraded logging/metrics assertions (в unit/integration объёме),
  - smoke-сценарий с проверкой наличия корреляционных идентификаторов в ответах/логах.
- Синхронизировать документацию архитектуры и эксплуатации:
  - `docs/architecture/*` (по необходимости уточнения trace-flow),
  - task-артефакты этапа (`PLAN.md`, `REPORT.md`).

## Не входит в объём
- Полноценная observability-платформа уровня production SLO/SLA и расширенный alerting catalog.
- Внедрение distributed tracing backend (например Jaeger/Tempo) как отдельного инфраструктурного проекта.
- Перепроектирование API/контрактов этапа `005` или добавление новых бизнес endpoint-ов.
- Изменение auth-модели Keycloak-first.
- Деплой в dev/prod, если не запрошен отдельно в рамках задачи.

## Технические ограничения
- Архитектурные границы AprilHub не меняются: только UI-агрегация и адаптация DTO.
- Не коммитить секреты/токены и не логировать чувствительные данные.
- Совместимость с существующим OpenAPI и runtime-контрактами этапов `004-005` обязательна.
- Любые изменения БД вне scope; при необходимости схемных изменений использовать только Atlas.
- Проверки должны быть воспроизводимы локально и в CI.

## Критерии готовности (acceptance)
- [x] Сквозная трассировка `correlationId/requestId/sourceService` подтверждена для сценариев `Hub Shell -> Hub BFF -> downstream`.
- [x] В `hub-bff` есть структурированные техлоги по входящим, downstream и degraded/auth событиям без утечки секретов.
- [x] Добавлены baseline метрики latency/error/degraded/retry для BFF endpoint-ов и downstream-адаптеров.
- [x] Описан и согласован минимальный runbook диагностики auth/downstream/degraded инцидентов.
- [x] Добавлены/обновлены тесты на metadata propagation и observability corner-cases, проверки проходят.
- [x] Не зафиксировано регрессий по auth/RBAC и контрактам OpenAPI `v1`.
- [x] Проверки `make openapi-lint`, `cd hub-bff && go test ./...` и smoke-сценарии этапа проходят.
- [x] В `REPORT.md` перечислены добавленные сигналы observability, подтверждённые проверки и follow-up на этапы `008/009/010`.

## Проверка (команды)
```bash
# OpenAPI/contract checks
make openapi-lint

# backend tests
cd hub-bff && go test ./...

# runtime smoke (в т.ч. проверка trace metadata/degraded paths)
./scripts/smoke-aprilhub.sh

# при наличии:
# проверка метрик/logging hooks в integration профиле
```

## Результат в отчёте
После выполнения оформить `REPORT.md` в этой задаче: какие сигналы observability добавлены (логи/метрики/trace metadata), какие runbooks зафиксированы, какие проверки выполнены и какие follow-up остаются для этапов `008/009/010`.
