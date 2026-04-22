# Межсервисные связи April

Документ фиксирует межсервисные интеграции backend-to-backend без участия `AprilHub` как интеграционной шины.

## Принцип

- `AprilHub` используется как UI/BFF точка входа.
- Бизнес-сервисы обмениваются данными напрямую:
  - синхронно через `REST` (`Sync`);
  - асинхронно через `Event/API` (`Async`).
- `AprilNFlow` может запрашивать контекст у `AprilWorkFlow` и `AprilOrgFlow` для эскалационных уведомлений (например, сообщение инициатору или руководителю).
- Почти любой доменный сервис может инициировать интеграционную задачу в `AprilEDC`; результаты возвращаются обратно через асинхронные события.

## BFF runtime links (AprilHub)

`AprilHub` не участвует в backend-to-backend обмене как шина, но `Hub BFF` выполняет ограниченные sync read-вызовы для UI-агрегации:

- `Hub BFF` -> `AprilWorkFlow`
- `Hub BFF` -> `AprilNFlow`
- `Hub BFF` -> `AprilOrgFlow`
- `Hub BFF` -> `AprilProfile`
- `Hub BFF` -> `AprilReport`

Эти связи являются только адаптацией данных под UI и не переносят ownership доменных данных в `AprilHub`.

## Матрица интеграций (сервис x сервис)

Обозначения типа интеграции:
- <span style="color:#2e7d32;"><strong>Sync</strong></span> — синхронный вызов (REST)
- <span style="color:#ef6c00;"><strong>Async</strong></span> — асинхронная интеграция (Event/API)

| Из \ В | AprilWorker | AprilWorkFlow | AprilNFlow | AprilOrgFlow | AprilProfile | AprilEDC | AprilReport |
|---|---|---|---|---|---|---|---|
| **AprilWorker** | — | <span style="color:#2e7d32;"><strong>Sync:</strong></span> Запуск и координация workflow-сценариев | <span style="color:#2e7d32;"><strong>Sync:</strong></span> Инициация коммуникаций по бизнес-правилам | <span style="color:#2e7d32;"><strong>Sync:</strong></span> Получение оргконтекста для маршрутов и правил | <span style="color:#2e7d32;"><strong>Sync:</strong></span> Получение профильных атрибутов участников | <span style="color:#2e7d32;"><strong>Sync:</strong></span> Запуск интеграционных задач по бизнес-логике | <span style="color:#2e7d32;"><strong>Sync:</strong></span> Запуск обновления отчётных срезов |
| **AprilWorkFlow** | — | — | <span style="color:#2e7d32;"><strong>Sync:</strong></span> Инициация уведомлений по этапам | <span style="color:#2e7d32;"><strong>Sync:</strong></span> Чтение оргконтекста и ролей согласования | <span style="color:#2e7d32;"><strong>Sync:</strong></span> Чтение профилей участников процесса | <span style="color:#2e7d32;"><strong>Sync:</strong></span> Запуск интеграционной задачи по бизнес-логике | — |
| **AprilNFlow** | — | <span style="color:#2e7d32;"><strong>Sync:</strong></span> Получение инициатора процесса для уведомлений | — | <span style="color:#2e7d32;"><strong>Sync:</strong></span> Получение руководителя по оргструктуре для эскалаций | <span style="color:#2e7d32;"><strong>Sync:</strong></span> Получение контактных и ролевых данных получателей | <span style="color:#2e7d32;"><strong>Sync:</strong></span> Запуск интеграционной задачи по бизнес-логике | — |
| **AprilOrgFlow** | — | — | — | — | — | <span style="color:#2e7d32;"><strong>Sync:</strong></span> Запуск интеграционной задачи по бизнес-логике | — |
| **AprilProfile** | — | — | — | — | — | <span style="color:#2e7d32;"><strong>Sync:</strong></span> Запуск интеграционной задачи по бизнес-логике | — |
| **AprilEDC** | — | <span style="color:#ef6c00;"><strong>Async:</strong></span> Возврат результата интеграционной обработки | <span style="color:#ef6c00;"><strong>Async:</strong></span> Возврат результата интеграционной обработки | <span style="color:#ef6c00;"><strong>Async:</strong></span> Публикация нормализованных обновлений оргданных | <span style="color:#ef6c00;"><strong>Async:</strong></span> Публикация нормализованных обновлений профилей | — | <span style="color:#ef6c00;"><strong>Async:</strong></span> Возврат результата интеграционной обработки |
| **AprilReport** | — | <span style="color:#2e7d32;"><strong>Sync:</strong></span> Метрики исполнения процессов | <span style="color:#2e7d32;"><strong>Sync:</strong></span> Статусы коммуникаций | <span style="color:#2e7d32;"><strong>Sync:</strong></span> Оргиерархия для агрегирования | <span style="color:#2e7d32;"><strong>Sync:</strong></span> Кадровые справочники для отчётных срезов | <span style="color:#2e7d32;"><strong>Sync:</strong></span> Запуск интеграционной задачи по бизнес-логике | — |

## Где смотреть в модели

- Актуальные связи зафиксированы в `structurizr/workspace.dsl`.
- На диаграммах Structurizr:
  - `Sync` связи отображаются сплошными зелёными линиями;
  - `Async` связи отображаются пунктирными оранжевыми линиями.
