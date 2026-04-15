## Описание изменений

- Что изменено и зачем?

## Проверка

- [ ] Локальные тесты проходят
- [ ] Релевантные smoke-проверки проходят

## Чеклист границ: AprilHub vs AprilWorker

Сверка с архитектурой:
- `docs/architecture/APRILHUB_C3_C4.md`
- `docs/architecture/APRILWORKER_C3_C4.md`
- `docs/architecture/C4_RUNTIME_SEQUENCES.md`
- `docs/architecture/INTEGRATION_CONTRACTS.md`
- `openapi/aprilhub-bff.yaml`

- [ ] Изменение в `AprilHub` решает UI-задачу (композиция/агрегация/адаптация DTO), а не доменную оркестрацию.
- [ ] В `Hub BFF` нет stateful бизнес-процесса с жизненным циклом, цепочками retry и компенсациями.
- [ ] Если логика нужна независимо от конкретного экрана/канала, она размещена в `AprilWorker` (или доменном сервисе), а не в `AprilHub`.
- [ ] `AprilHub` не становится owner доменных данных: только чтение/агрегация/адаптация под представление.
- [ ] `AprilWorker` не отдает UI-специфичные DTO и не содержит семантику frontend-экранов.
- [ ] Для mutation/долгих сценариев определены `scenarioId`/`correlationId`, идемпотентность и явные terminal states.
- [ ] Для fan-out вызовов в `Hub BFF` заданы timeout, ограниченный retry (только safe/idempotent), и degraded/partial response.
- [ ] Контракты синхронизированы с `openapi/aprilhub-bff.yaml` и не нарушают границы владения.
- [ ] Сквозная трассировка сохранена: `correlationId`, `requestId`, `sourceService` прокинуты по релевантным вызовам.
- [ ] Тесты покрывают корректную зону: `Hub` (aggregation/degraded/401/403), `Worker` (orchestration/retry/compensation/idempotency).
