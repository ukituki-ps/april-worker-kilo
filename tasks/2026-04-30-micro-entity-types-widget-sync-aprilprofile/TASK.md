# Micro-task: sync entity-types-widget from AprilProfile

## Мета

- **id:** `2026-04-30-micro-entity-types-widget-sync-aprilprofile`
- **ветка:** `fix/entity-types-widget-sync-aprilprofile` (рекомендуемая для PR; локально изменения выполнены в текущем рабочем дереве)
- **приоритет:** высокий
- **связанные файлы:**
  - `vendor/april-profile`
  - `hub-shell/dist/index.html`
  - `hub-shell/dist/assets/*`
  - `task_list.md`

## Цель

Актуализировать внешний `entity-types-widget` в AprilHub после обновления в `april-profile`: обновить submodule `vendor/april-profile`, проверить совместимость интеграции и подтвердить сборочный контур `hub-shell`.

## Scope

### Что входит

- Обновление указателя `vendor/april-profile` до актуального `origin/develop`.
- Прогон `hub-shell` quality gate (`lint`, `test`, `build`) после обновления.
- Обновление `hub-shell/dist` после сборки.
- Фиксация результата и проверок в `REPORT.md`.

### Что не входит

- Изменения исходников внешнего репозитория `april-profile`.
- Изменения бизнес-логики `hub-shell` вне совместимости с новым виджетом.
- Деплой на dev/prod и выполнение release-процедур.

## Зависимости и ограничения

- Архитектурные границы: DS-first и текущая host-интеграция через `vendor/april-profile`.
- Неразрушительный git-workflow: без `reset --hard`, без прямого push в `main`/`develop`.
- В рабочем дереве уже есть несвязанные изменения (`design-system/DisignApril`, `hub-shell/core.*`) — не менять их смысл.

## AGENT_MASTER_PROMPT compliance checklist

- [x] Прочитаны: `docs/AGENT_MASTER_PROMPT.md`, `README.md`, `task_list.md`, `docs/AGENT_ARCHITECTURE_CONTEXT.md`.
- [x] Учтены релевантные правила из `.cursor/rules/`.
- [x] Scope не расширен за пределы постановки.
- [x] Выполнение end-to-end: анализ -> обновление -> проверки -> отчёт.

## Acceptance criteria

- [x] `vendor/april-profile` обновлён до `76ff32a5aab810d08d8d39185eb382b83e822e82` (`origin/develop`, merge PR `#101` с фиксом `entity-types-widget`).
- [x] `hub-shell` успешно проходит `npm --prefix hub-shell run lint`, `npm --prefix hub-shell run test`, `npm --prefix hub-shell run build`.
- [x] Обновлены артефакты `hub-shell/dist` после новой сборки.
- [x] Подготовлен отчёт с изменениями, проверками, рисками и follow-up.

## Проверка

```bash
npm --prefix hub-shell run lint
npm --prefix hub-shell run test
npm --prefix hub-shell run build
```

## Ожидаемый результат в REPORT

- Новый SHA submodule `vendor/april-profile`.
- Перечень обновлённых/удалённых `hub-shell/dist` артефактов.
- Фактически выполненные команды и результат.
- Риски/ограничения и follow-up.
