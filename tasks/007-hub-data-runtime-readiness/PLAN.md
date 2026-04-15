# План: Hub Data & Runtime Dependencies Readiness (Этап 007)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-15
- **Статус плана:** согласован

## Исходные допущения
- `hub-bff` остаётся stateless BFF-агрегатором в рамках текущих C4-границ AprilHub.
- Runtime-сценарии этапов `004-006` (aggregation, degraded mode, auth/RBAC, observability) не требуют долговременного технического состояния.
- Любые БД-изменения допустимы только через Atlas, но внедряются только при подтверждённой необходимости.

## Порядок работ (шаги)
1. Провести ревизию runtime-точек `hub-bff` (fan-out, retry/timeout, degraded handling, metadata propagation) и выявить реальные потребности в persistence/queue.
2. Зафиксировать решение по readiness: нужен/не нужен persistence и queue/worker, с аргументацией по blast radius и соответствию архитектурным границам.
3. Усилить тестовое подтверждение stateless-подхода для runtime-агрегации (без shared state между вызовами).
4. Актуализировать артефакты задачи (`TASK.md`, `REPORT.md`) и общий статус в `task_list.md`.
5. Прогнать обязательные проверки (`make openapi-lint`, `cd hub-bff && go test ./...`, `./scripts/smoke-aprilhub.sh`).

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | Тестовое подтверждение stateless/idempotent runtime поведения |
| Frontend | Не меняется |
| БД / Atlas | Не меняется (решение: не требуется на этапе 007) |
| Инфра / Compose | Не меняется (новые runtime зависимости не добавляются) |
| Документация / OpenAPI | Обновление task-артефактов этапа 007 и статусов |

## Риски и откат
- **Риск:** ложно-положительное решение «без persistence» при скрытых требованиях к durable state. → **Митигация:** явно ограничить решение текущим scope `hub-bff` (read-only aggregation, без async side effects) и зафиксировать follow-up для этапов `008/009`.
- **Риск:** регрессия smoke из-за runtime/env drift. → **Митигация:** прогон обязательного smoke после изменений.
- При необходимости отката: откатить изменения документации и тестов в задаче `007`; runtime-код BFF не меняет протоколы и схему данных.

## Проверка после выполнения
- Команды (как в `TASK.md`): `make openapi-lint`, `cd hub-bff && go test ./...`, `./scripts/smoke-aprilhub.sh`.
- Ручная проверка / smoke: подтверждение, что auth/RBAC и aggregation/degraded сценарии проходят без новых runtime-зависимостей.

## Примечания
- Связанные артефакты: `tasks/006-hub-observability-operability/REPORT.md`, `docs/architecture/APRILHUB_C3_C4.md`, `docs/architecture/C4_RUNTIME_SEQUENCES.md`.
- Обновления плана: 2026-04-15 — первичная фиксация и выполнение в рамках этапа 007.
