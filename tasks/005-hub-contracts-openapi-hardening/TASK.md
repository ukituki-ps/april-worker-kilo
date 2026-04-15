# Задача: Integration Contracts & OpenAPI Hardening (Этап 005)

## Мета
- **ID / ветка:** `005-hub-contracts-openapi-hardening`
- **Приоритет:** высокий
- **Связанные документы:** `task_list.md`, `tasks/000-aprilhub-full-service-roadmap/TASK.md`, `tasks/000-aprilhub-full-service-roadmap/PLAN.md`, `tasks/004-hub-bff-aggregation-runtime/REPORT.md`, `docs/architecture/INTEGRATION_CONTRACTS.md`, `docs/architecture/INTERSERVICE_LINKS.md`, `docs/architecture/APRILHUB_C3_C4.md`, `docs/architecture/C4_RUNTIME_SEQUENCES.md`, `docs/auth-jwt-keycloak-adapted.md`, `openapi/aprilhub-bff.yaml`

## Цель
Довести интеграционные контракты уровня `Hub BFF -> downstream` и OpenAPI `aprilhub-bff` до согласованного и исполняемого состояния: убрать `TBD` в критичных местах, зафиксировать SLA/timeout/retry/degraded policy, формализовать версионирование и обратную совместимость, синхронизировать документацию с фактической реализацией этапа `004`.

## Контекст для агента
- Этап `004` внедрил aggregation runtime и базовые resiliency-policy, но контрактный слой в `docs/architecture/INTEGRATION_CONTRACTS.md` остаётся draft.
- По `docs/architecture/INTERSERVICE_LINKS.md` `AprilHub` не является интеграционной шиной: это BFF/UI точка входа.
- По `docs/architecture/APRILHUB_C3_C4.md` BFF должен выполнять только UI-агрегацию и адаптацию DTO.
- JWT/Auth требования неизменны и строго следуют `docs/auth-jwt-keycloak-adapted.md`.
- `openapi/aprilhub-bff.yaml` должен быть source-of-truth для публичного REST-контракта BFF на текущем этапе.

## Входит в объём
- Выделить и описать отдельный раздел контрактов `Hub BFF -> downstream` в `docs/architecture/INTEGRATION_CONTRACTS.md`:
  - producer/consumer для BFF-сценариев,
  - contract IDs,
  - timeout/retry/idempotency,
  - degraded/partial response policy.
- Уточнить и зафиксировать обязательные технические метаданные для sync-вызовов BFF:
  - `correlationId`, `requestId`, `sourceService`, `timestamp` (по применимости).
- Зафиксировать правила обратной совместимости и версионирования:
  - версия OpenAPI (`v1` baseline),
  - policy non-breaking/breaking изменений,
  - депрекация полей/endpoint-ов.
- Синхронизировать `openapi/aprilhub-bff.yaml` с реализацией и согласованными контрактами:
  - актуальные aggregation endpoint-ы,
  - единый error-format,
  - degraded response schema,
  - security scheme в соответствии с Keycloak-first.
- Добавить/обновить тесты контрактного уровня и corner cases:
  - happy path для ключевых aggregation endpoint-ов,
  - timeout и retry budget поведение,
  - partial/degraded response при недоступности части downstream,
  - invalid downstream payload (невалидный JSON/несоответствие схемы),
  - auth edge-cases (`401`/`403`, invalid token),
  - проверка metadata propagation (`correlationId/requestId/sourceService`),
  - базовая backward-compatibility проверка для не-breaking изменений схем.
- Проверить консистентность между:
  - `docs/architecture/INTEGRATION_CONTRACTS.md`,
  - `docs/architecture/INTERSERVICE_LINKS.md`,
  - `openapi/aprilhub-bff.yaml`,
  - текущим runtime в `hub-bff`.
- Обновить task-артефакты статуса (`REPORT.md`) с явным списком контрактов, доведённых до `agreed/baseline`.

## Не входит в объём
- Перепроектирование C4-модели и системных границ сервисов (этап `010`).
- Внедрение полноценной observability платформы и runbooks (этап `006`).
- Новые бизнес-фичи/endpoint-ы вне объёма финализации контрактов этапа `004`.
- Изменение auth-подхода (никаких `/auth/login`, `/auth/refresh` в BFF).

## Технические ограничения
- `Hub BFF` не становится доменным оркестратором; только UI-агрегация.
- Retry допустим только для идемпотентных запросов с ограниченным budget.
- Контракты и OpenAPI обновляются в одном изменении без временного рассинхрона.
- Все auth/security формулировки и схемы соответствуют `docs/auth-jwt-keycloak-adapted.md`.
- Не коммитить секреты; только dev-safe конфигурация и шаблоны.

## Критерии готовности (acceptance)
- [x] В `docs/architecture/INTEGRATION_CONTRACTS.md` есть явный и актуальный блок контрактов `Hub BFF -> downstream` без критичных `TBD`.
- [x] Для контрактов BFF определены timeout/retry/idempotency и зафиксирована policy degraded mode.
- [x] `openapi/aprilhub-bff.yaml` соответствует реализации `hub-bff` и покрывает aggregation/error/security-контракты.
- [x] Формализована policy версионирования и обратной совместимости контрактов BFF (`v1` baseline).
- [x] Подтверждена согласованность `INTEGRATION_CONTRACTS.md` и `INTERSERVICE_LINKS.md` для задействованных BFF-связей.
- [x] Добавлены и проходят тесты контрактов, включая corner cases (timeout/retry/degraded/invalid payload/auth/metadata).
- [x] Подтверждена базовая backward compatibility для non-breaking изменений OpenAPI.
- [x] Проверки проходят: `make openapi-lint`, backend tests/smoke без регрессов.
- [x] В `REPORT.md` зафиксирован список финализированных контрактов и оставшихся follow-up.

## Проверка (команды)
```bash
# OpenAPI checks
make openapi-lint

# backend checks
cd hub-bff && go test ./...

# runtime smoke
./scripts/smoke-aprilhub.sh

# при наличии соответствующего tooling:
# контрактные проверки backward compatibility для openapi/aprilhub-bff.yaml
```

## Результат в отчёте
После выполнения оформить `REPORT.md` в этой задаче: какие контракты BFF финализированы, какие policy зафиксированы (timeout/retry/degraded/versioning), какие изменения внесены в OpenAPI и какие follow-up остаются для этапов `006/008/010`.
