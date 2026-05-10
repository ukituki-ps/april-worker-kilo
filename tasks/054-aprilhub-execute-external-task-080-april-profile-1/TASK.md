# Задача 054: исполнение внешней задачи 080 из april-profile-1 (mobile Hub chrome + vendor bump + e2e)

## Мета
- **ID / ветка:** `054-aprilhub-execute-external-task-080-april-profile-1`
- **Приоритет:** высокий (входит в эпик **074**, волна **B**, шаг 3 во внешнем репозитории)
- **Тип:** [внешний репозиторий — исполнение в `april-worker`]
- **Каноническая постановка:** `april-profile-1/tasks/080-external-april-worker-hub-mobile-chrome-e2e/TASK.md`
- **Связанные документы (внешние):**
  - `april-profile-1/task_list.md` (строка про **080**, зависимость от **079**)
  - `april-profile-1/docs/adr/0006-mobile-chrome-layers-widget-host.md` (ADR-0006, стратегия A)
  - `april-profile-1/docs/WIDGET_INTEGRATION_CHECKLIST.md` (согласование глобального dock Hub с панелью виджета)
  - `april-profile-1/tasks/074-phase-8-ds-gpr-and-mobile-shell-unification/` (эпик-контекст)
  - `april-profile-1/tasks/079-april-profile-profile-ui-mobile-shell-strategy-a/` (**зависимость:** merge стратегии A в profile-ui; параллель — только при явном согласовании, если меняется исключительно host-dock)
- **Связанные документы (этот репозиторий):**
  - `task_list.md`
  - `docs/WIDGET_CONTRACTS.md`, `docs/TESTING_STRATEGY.md`, `docs/AGENT_ERROR_TRIAGE_PROMPT.md` (при регрессах UI на mobile)

## Цель
Реализовать во **AprilHub** (`april-worker`) требования внешней задачи **080**: согласовать **глобальный dock / нижнюю панель Hub** с mobile chrome виджетов по ADR-0006 и чеклисту интеграции (без конфликта со **стратегией A**), обновить **`vendor/april-profile`** после готовности **079**, и обеспечить прохождение **Playwright** smoke для profile-widgets на **узком viewport** на связке актуального submodule и версии DS из GPR.

## Контекст для агента
- Объём работ в `april-worker` определяется **только** внешним `TASK.md` задачи **080** и ADR-0006 / чеклистом; расширять scope без согласования нельзя.
- Логика и правки **`profile-ui`** и публикация DS — **не здесь** (соответственно **079** и **078** в `april-profile-1`).
- В vendored-снимке `vendor/april-profile` может не хватать коммитов из **079** до bump; перед merge убедиться, что submodule указывает на согласованный коммит/тег.
- Итог фиксируется **двумя отчётами** (см. ниже), как в задачах `023`–`053`.

## Входит в объём
- Анализ `april-profile-1/tasks/080-external-april-worker-hub-mobile-chrome-e2e/TASK.md` и релевантных разделов ADR-0006 / `WIDGET_INTEGRATION_CHECKLIST.md`.
- Подтверждение зависимости от **079** (или зафиксированное исключение в `REPORT.md`).
- Правки layout / global mobile chrome в **`hub-shell`** (или согласованные модули worker).
- Bump **`vendor/april-profile`** после merge **079** (отдельный коммит/PR или часть того же PR — явно описать в отчёте).
- E2E: минимум существующий smoke profile-widgets на mobile viewport; при необходимости — новые шаги сценария.
- Релевантные проверки по `docs/TESTING_STRATEGY.md` и CI.
- **Двойной отчёт:**
  1. `april-profile-1/tasks/080-external-april-worker-hub-mobile-chrome-e2e/REPORT.md` (создать/обновить по факту выполнения),
  2. `tasks/054-aprilhub-execute-external-task-080-april-profile-1/REPORT.md` в этом репозитории.

## Не входит в объём
- Реализация mobile shell / стратегии A в **`profile-ui`** — задача **079** (`april-profile-1`).
- Публикация дизайн-системы — задача **078** (`april-profile-1` / DisignApril).
- Рефакторинг несвязанных частей `hub-bff` или виджетов вне постановки **080**.

## Технические ограничения
- Не коммитить секреты; для GPR/`NODE_AUTH_TOKEN` — только локально/CI по `docs/DEPLOYMENT_STRATEGY.md`.
- Не ломать контракты Hub ↔ Profile без явной фиксации в отчёте и синхронизации OpenAPI, если затронуты API.
- Соблюдать ADR-0006: одна видимая нижняя капсула на ветку контекста, корректный порядок «Назад» (sheet/overlay до intent host); избегать «двойного низа» при сочетании host-dock и виджета.

## Критерии готовности (acceptance)
- [ ] Постановка **080** и зависимости (**079**) разобраны; границы scope подтверждены.
- [ ] Layout / global mobile chrome в `hub-shell` согласован с ADR-0006 и чеклистом (нет конфликта со стратегией A на целевых сценариях).
- [ ] `vendor/april-profile` обновлён на версию после **079** (или зафиксировано отклонение и причина в `REPORT.md`).
- [ ] PR в `april-worker` зелёный по CI; e2e smoke (или согласованный gate) зелёный на mobile viewport для profile-widgets.
- [ ] В обоих `REPORT.md`: ссылка на PR, версия submodule `april-profile`, версия/источник DS (GPR), команды проверки, ограничения и follow-up.
- [ ] Опционально по внешней постановке: ссылка из `april-profile-1` docs-site (`task-story-074`), если команда ведёт эту связь.

## Проверка (команды)
```bash
# Точный набор — по затронутым пакетам и docs/TESTING_STRATEGY.md; ориентиры:
# - quality gate / build hub-shell (например npm scripts в hub-shell)
# - Playwright smoke с mobile viewport (существующие или новые теги сценариев)
# - при bump submodule: согласованный прогон CI репозитория
```

## Результат в отчёте
- Какие пункты внешней задачи **080** закрыты в `april-worker`.
- Изменённые файлы/модули и ссылка на ADR/чеклист, которыми руководствовались.
- Версия `vendor/april-profile` (commit) и DS из GPR.
- Команды и результаты проверок.
- Ссылки на PR/коммиты; остаточные риски и follow-up.
