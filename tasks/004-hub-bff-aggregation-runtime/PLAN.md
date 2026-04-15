# План: Hub BFF Aggregation Runtime (Этап 004)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-14
- **Статус плана:** актуализирован

## Исходные допущения
- Этапы `001` и `002` завершены: базовая платформа и Keycloak-first auth/RBAC в `hub-bff` уже реализованы.
- Этап `003` формирует `hub-shell` composition runtime; `004` должен дать backend-агрегацию для ключевых UI-сценариев.
- `Hub BFF` остаётся в границах UI-агрегации и не берёт на себя доменную orchestration-логику.
- Контракты downstream зафиксированы как `draft` в `docs/architecture/INTEGRATION_CONTRACTS.md`; в `004` используется MVP-уровень с контролем таймаутов и деградации.
- API-изменения в рамках `004` синхронно отражаются в `openapi/aprilhub-bff.yaml`.

## Порядок работ (шаги)
1. **Определить агрегированные use-case сценарии**
   Согласовать 3-5 приоритетных endpoint-ов под ключевые экраны `hub-shell` и входные/выходные DTO.
2. **Собрать runtime-каркас aggregation**
   Реализовать Entry Controller, Use-case Orchestrator, Service Adapters, Response Composer в `hub-bff`.
3. **Внедрить политики resiliency**
   Настроить timeout/retry для fan-out вызовов, включая ограничения повторов только для идемпотентных операций.
4. **Реализовать degraded mode**
   Добавить partial response contract и единый механизм возврата частичных данных при отказе части downstream.
5. **Унифицировать ошибки и metadata**
   Привести error-format к единому контракту, обеспечить propagation `correlationId/requestId/sourceService`.
6. **Синхронизировать OpenAPI и документацию**
   Обновить `openapi/aprilhub-bff.yaml` и инструкцию по smoke-проверкам aggregation runtime.
7. **Покрыть тестами и провести проверки**
   Добавить unit/integration тесты для happy path, timeout/retry, degraded, auth-ошибок и выполнить quality gates.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (`hub-bff`) | aggregation runtime слои: controller/orchestrator/adapters/composer |
| Downstream integration | fan-out вызовы, timeout/retry policy, metadata propagation |
| Error handling | единый error-format и degraded response contract |
| Документация / OpenAPI | `openapi/aprilhub-bff.yaml`, runbook/smoke инструкции для этапа `004` |
| Тестирование | unit/integration сценарии aggregation и отказоустойчивости |

## Риски и откат
- **Риск:** BFF начнёт поглощать доменную orchestration-логику.  
  **Митигация:** жёсткая граница use-case только для UI-агрегации, без бизнес-команд в домены.
- **Риск:** агрессивные retry создадут нагрузочные пики на downstream.  
  **Митигация:** ограниченный retry-budget, только идемпотентные операции, явные timeout.
- **Риск:** partial response будет неоднородным между endpoint-ами.  
  **Митигация:** единый response envelope и централизованный composer/degraded mapper.
- **Риск:** рассинхрон API и OpenAPI.  
  **Митигация:** обновлять `openapi/aprilhub-bff.yaml` в том же изменении и проверять `make openapi-lint`.
- **Откат:** вернуть предыдущие endpoint-обработчики BFF и отключить aggregation endpoints через rollback коммита/ветки.

## Проверка после выполнения
- `cd hub-bff && go test ./...`
- `cd hub-bff && golangci-lint run` (если линтер подключён)
- `make openapi-lint`
- `docker compose --profile aprilhub up -d`
- Ручной smoke:
  - получить токен через Keycloak flow,
  - проверить 200 для агрегированных endpoint-ов,
  - симулировать отказ одного downstream и проверить degraded/partial response,
  - подтвердить единый error-format,
  - подтвердить propagation `correlationId/requestId/sourceService`,
  - проверить 401/403 без регресса auth-контуров `002`.

## Примечания
- Этап `004` должен завершаться в связке с подготовкой `005` (контрактное выравнивание и OpenAPI hardening).
- При изменении состава endpoint-ов обновлять `TASK.md` и этот `PLAN.md` синхронно.
- Отчёт по факту выполнения вести в `REPORT.md` этой задачи.
- Обновления плана:
  - 2026-04-15 — реализованы endpoint-ы `/api/v1/aggregation/dashboard|home|summary`, runtime timeout/retry/degraded и OpenAPI синхронизация.
