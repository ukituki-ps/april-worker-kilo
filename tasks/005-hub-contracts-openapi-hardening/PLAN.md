# План: Integration Contracts & OpenAPI Hardening (Этап 005)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-15
- **Статус плана:** согласован

## Исходные допущения
- Этап `004` реализовал aggregation runtime (`dashboard/home/summary`) и базовый degraded response.
- `docs/architecture/INTEGRATION_CONTRACTS.md` содержит draft-данные с `TBD` и должен быть доведён до рабочего baseline для BFF.
- `openapi/aprilhub-bff.yaml` уже существует и используется как API-контракт BFF.
- Архитектурные границы (`Hub BFF` как UI-агрегатор, Keycloak-first auth) не пересматриваются.

## Порядок работ (шаги)
1. **Инвентаризация фактических контрактов BFF**
   Сопоставить текущие endpoint-ы/адаптеры `hub-bff` с документами `INTEGRATION_CONTRACTS.md` и `INTERSERVICE_LINKS.md`.
2. **Уточнение sync-контрактов для BFF**
   Зафиксировать producer/consumer, contract IDs, timeout/retry/idempotency и propagation metadata.
3. **Формализация деградации и ошибок**
   Описать contract-level policy для partial/degraded response и единый error-format.
4. **Hardening OpenAPI**
   Обновить `openapi/aprilhub-bff.yaml` под согласованные контракты, security и versioning policy.
5. **Контрактные тесты и corner cases**
   Добавить/актуализировать тесты для timeout/retry/degraded/invalid payload/auth edge-cases/metadata propagation и базовую backward compatibility проверку.
6. **Кросс-документная синхронизация**
   Проверить консистентность между `INTEGRATION_CONTRACTS.md`, `INTERSERVICE_LINKS.md`, `APRILHUB_C3_C4.md` и OpenAPI.
7. **Проверка и фиксация статуса**
   Выполнить проверки (`openapi-lint`, `go test`, smoke) и оформить `REPORT.md`.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| `docs/architecture/INTEGRATION_CONTRACTS.md` | Финализация контрактов BFF и снятие критичных `TBD` |
| `docs/architecture/INTERSERVICE_LINKS.md` | Уточнение матрицы связей при необходимости |
| `openapi/aprilhub-bff.yaml` | Контрактное выравнивание endpoint-ов, ошибок, degraded и security |
| `hub-bff` | Точечная синхронизация с контрактами (если найдены расхождения) |
| Тесты (`hub-bff`, smoke) | Контрактные тесты + покрытие corner cases и compatibility-check |
| `tasks/005-.../REPORT.md` | Артефакты проверки и список финализированных контрактов |

## Риски и откат
- **Риск:** Документы будут расходиться с runtime-реализацией.
  **Митигация:** сверка по каждому endpoint/адаптеру перед изменениями в OpenAPI.
- **Риск:** Чрезмерный scope (попытка закрыть все экосистемные контракты, а не BFF-область).
  **Митигация:** ограничить этап `005` контрактами `Hub BFF -> downstream` и связанными API BFF.
- **Риск:** Непоследовательная compatibility policy.
  **Митигация:** добавить явные правила non-breaking/breaking изменений и deprecation.
- **Риск:** Контракты формально описаны, но не подтверждены тестами на краевые сценарии.
  **Митигация:** обязательный набор contract/corner-case тестов и их прогон в рамках acceptance.
- **Откат:** вернуть предыдущие версии docs/OpenAPI и ограничить изменения контрактным baseline `v1`.

## Проверка после выполнения
- `make openapi-lint`
- `cd hub-bff && go test ./...`
- `./scripts/smoke-aprilhub.sh`
- (опционально при наличии tooling) contract compatibility check для OpenAPI baseline
- Ручная сверка:
  - endpoint-ы и схемы OpenAPI соответствуют фактическим ответам BFF,
  - metadata propagation (`correlationId/requestId/sourceService`) не деградировала,
  - auth/RBAC поведение не изменилось вне согласованного контракта.

## Примечания
- Этот этап закрывает контрактные follow-up из `004` и снижает риски для `006` и `008`.
- При существенных архитектурных развилках зафиксировать ADR по правилам проекта.
