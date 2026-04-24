# План: анализ frontend/DS-подхода AprilProfile и синхронизация документации AprilHub

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-24
- **Статус плана:** согласован

## Исходные допущения
- Синхронизация выполняется в документации `april-worker` без изменения runtime-кода `hub-shell`/`hub-bff`.
- Канонические термины для сравнения берутся из `april-profile-1/docs/FRONTEND_STRATEGY.md`, `april-profile-1/docs/guides/DESIGN_SYSTEM.md`, `april-profile-1/docs/WIDGET_CONTRACTS.md`.
- Требуется сохранить локальный контекст AprilHub и не дублировать неактуальные для `april-worker` детали.

## Порядок работ (шаги)
1. Сравнить текущие docs `april-worker` с эталонными frontend/DS-документами `april-profile-1`, зафиксировать расхождения.
2. Добавить в `april-worker` недостающие source-of-truth документы по frontend strategy и widget contracts в hub-centric формулировках.
3. Актуализировать entrypoints (`docs/README.md`, при необходимости `docs-site/docs/intro.md` и doc map), чтобы новые документы были discoverable.
4. Проверить согласованность ссылок и структуру артефактов задачи (`TASK.md`, `PLAN.md`).
5. Подготовить итоговый `REPORT.md` по шаблону `docs/AGENT_REPORT_TEMPLATE.md`.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | Нет изменений |
| Frontend | Нет изменений runtime-кода |
| БД / Atlas | Нет изменений |
| Инфра / Compose | Нет изменений |
| Документация / OpenAPI | Новые/обновлённые docs по frontend strategy, widget contracts, entrypoints, отчёт задачи |

## Риски и откат
- **Риск:** перегрузка `april-worker` деталями AprilProfile, не относящимися к AprilHub. → **Митигация:** фиксировать только host-level договорённости и общие правила интеграции.
- **Риск:** расхождение терминов между `docs/` и `docs-site/`. → **Митигация:** обновить ссылки и описания entrypoints в одном изменении.
- При необходимости отката: удалить/откатить только документационные изменения текущей задачи.

## Проверка после выполнения
- Команды (документальные проверки):
  - проверить ссылки и кросс-ссылки между обновлёнными markdown-файлами;
  - убедиться, что `docs/` и `docs-site/` используют согласованные термины (`Host-driven`, `Widget-driven`, `API/BFF-first`, `HostContext`).
- Ручная проверка / smoke:
  - перечитать новые документы как отдельный reader flow: `docs/README.md` -> frontend/DS документы -> связанный контракт виджетов.

## Примечания
- Связанные материалы: `april-profile-1/docs/FRONTEND_STRATEGY.md`, `april-profile-1/docs/guides/DESIGN_SYSTEM.md`, `april-profile-1/docs/WIDGET_CONTRACTS.md`.
- Обновления плана: 2026-04-24 — первичная версия плана создана перед реализацией.
