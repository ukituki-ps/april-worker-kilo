# Задача: Hub BFF Aggregation Runtime (Этап 004)

## Мета
- **ID / ветка:** `004-hub-bff-aggregation-runtime`
- **Приоритет:** высокий
- **Связанные документы:** `task_list.md`, `tasks/000-aprilhub-full-service-roadmap/TASK.md`, `tasks/000-aprilhub-full-service-roadmap/PLAN.md`, `tasks/003-aprilhub-shell-design-system/REPORT.md`, `docs/architecture/APRILHUB_C3_C4.md`, `docs/architecture/C4_RUNTIME_SEQUENCES.md`, `docs/architecture/INTEGRATION_CONTRACTS.md`, `docs/auth-jwt-keycloak-adapted.md`, `openapi/aprilhub-bff.yaml`

## Цель
Реализовать этап `004` roadmap: рабочий runtime-слой **Hub BFF Aggregation** (Entry Controller, Use-case Orchestrator, Service Adapters, Response Composer) с 3-5 агрегированными endpoint-ами для ключевых экранов `hub-shell`, включая fan-out, timeout/retry policy, partial response (degraded mode), единый error-format и сквозную прокидку correlation metadata.

## Контекст для агента
- Этапы `001` и `002` сформировали базовый runtime и auth-контур (`OIDC`, `JWT`, `/me`, role guards).
- Этап `003` готовит composition runtime в `hub-shell`; `004` даёт backend-агрегацию под ключевые экраны и виджеты.
- По `docs/architecture/APRILHUB_C3_C4.md` BFF выполняет только UI-агрегацию и адаптацию DTO, не доменную orchestration-логику.
- По `docs/architecture/C4_RUNTIME_SEQUENCES.md` при частичных отказах downstream `Hub Shell` должен получать пригодный для рендера degraded response.
- Контракты downstream пока в `draft` (см. `docs/architecture/INTEGRATION_CONTRACTS.md`) и должны быть применены в безопасном MVP-объёме без расширения доменных обязанностей BFF.

## Входит в объём
- Реализовать в `hub-bff` архитектурные компоненты aggregation runtime:
  - **BFF Entry Controller** для агрегированных API,
  - **Use-case Orchestrator** для fan-out сценариев,
  - **Service Adapters** к целевым downstream-сервисам,
  - **Response Composer** для frontend-friendly DTO.
- Реализовать минимум **3-5 агрегированных endpoint-ов** для ключевых экранов `hub-shell` (dashboard/home/summary и эквиваленты по фактической структуре shell).
- Ввести и применить единые политики:
  - timeout для каждого downstream-вызова,
  - retry только для идемпотентных/безопасных запросов,
  - partial response при отказе части источников.
- Реализовать единый error-contract для агрегированных endpoint-ов:
  - machine-readable код ошибки,
  - человеко-читаемое сообщение,
  - технические метаданные (`correlationId`, `requestId`, источник сбоя где применимо).
- Реализовать сквозную прокидку metadata (`correlationId`, `requestId`, `sourceService`) из входящего запроса BFF в downstream-вызовы и обратно в ответ/логи.
- Обновить `openapi/aprilhub-bff.yaml` для новых aggregated endpoint-ов, degraded-response и error-format.
- Добавить backend unit/integration тесты:
  - happy path aggregation,
  - timeout/retry path,
  - partial response/degraded mode,
  - 401/403 на защищённых сценариях (без регресса этапа `002`).
- Обновить документацию запуска и smoke-проверок aggregation runtime.

## Не входит в объём
- Перенос доменной orchestration-логики из `AprilWorker` и доменных сервисов в `hub-bff`.
- Перепроектирование и финальная стабилизация всех interservice контрактов (этап `005`).
- Полный observability hardening (метрики/алерты/runbooks) beyond минимально необходимого runtime-контекста (этап `006`).
- Persistence, миграции и фоновые очереди для BFF, если они не требуются текущему aggregation MVP (этап `007`).
- Полный e2e/k6 финальный baseline beyond релевантных проверок этапа (этап `008`).

## Технические ограничения
- Стек строго по `docs/AGENT_ARCHITECTURE_CONTEXT.md` (Go REST для `hub-bff`).
- Keycloak-first auth остаётся неизменной: не добавлять backend-flow `/auth/login` и `/auth/refresh`.
- BFF не становится интеграционной шиной: только UI-агрегация и адаптация данных.
- Retry применять только к идемпотентным операциям с ограниченным числом повторов и без бесконтрольного шторминга downstream.
- API-изменения обязательно синхронизировать с `openapi/aprilhub-bff.yaml` в том же изменении.
- Секреты/ключи не коммитить; только env-шаблоны и dev-safe конфигурация.

## Критерии готовности (acceptance)
- [ ] В `hub-bff` реализованы Entry Controller, Use-case Orchestrator, Service Adapters и Response Composer для aggregation MVP.
- [ ] Реализовано минимум 3 агрегированных endpoint-а, используемых ключевыми экранными сценариями `hub-shell`.
- [ ] Для downstream fan-out вызовов действуют и проверены timeout/retry политики.
- [ ] При отказе части downstream источников BFF возвращает partial response в согласованном degraded формате.
- [ ] Ошибки агрегированных endpoint-ов возвращаются в едином формате с техническими metadata.
- [ ] Сквозная прокидка `correlationId/requestId/sourceService` реализована и подтверждена smoke-проверкой.
- [ ] `openapi/aprilhub-bff.yaml` отражает фактические aggregation endpoint-ы, error-format и degraded responses.
- [ ] Добавлены и проходят unit/integration тесты по happy path + degraded/failure сценариям.
- [ ] Локальные проверки (`go test`, линтеры/сборка, smoke runtime) проходят без регрессий auth-контуров этапа `002`.
- [ ] В `REPORT.md` зафиксированы ограничения aggregation MVP, список покрытых endpoint-ов и follow-up к этапам `005/006/008`.

## Проверка (команды)
```bash
# backend quality gates
cd hub-bff && go test ./...

# при наличии линтера в модуле
cd hub-bff && golangci-lint run

# API contract checks
make openapi-lint

# runtime
docker compose --profile aprilhub up -d

# smoke aggregation:
# 1) получить токен через Keycloak login flow
# 2) вызвать агрегированные endpoint-ы с валидным Bearer token
# 3) проверить 200 и структуру aggregated DTO
# 4) симулировать timeout/ошибку одного downstream и проверить partial/degraded response
# 5) проверить единый error-format и наличие correlation/request metadata
# 6) проверить 401/403 на защищённых endpoint-ах без регресса auth/RBAC
```

## Результат в отчёте
После выполнения оформить `REPORT.md` в этой задаче: перечислить реализованные aggregation endpoint-ы, задействованные адаптеры и политики resiliency, фактические команды/результаты проверки, ограничения MVP и обязательные follow-up для этапов `005`, `006`, `008`.
