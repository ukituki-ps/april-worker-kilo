# Micro-task: sync profiles-widget from AprilProfile

## Мета

- **id:** `2026-04-30-micro-profiles-widget-sync-aprilprofile`
- **ветка:** `fix/profiles-widget-sync-aprilprofile` (рекомендуемая для PR; локально изменения выполнены в текущем рабочем дереве)
- **приоритет:** высокий
- **связанные файлы:**
  - `vendor/april-profile`
  - `hub-shell/dist/index.html`
  - `hub-shell/dist/assets/*`
  - `task_list.md`

## Цель

Актуализировать внешний `profiles-widget` в AprilHub после следующего обновления в `april-profile`: обновить submodule `vendor/april-profile`, убедиться в совместимости интеграции и подтвердить сборочный контур `hub-shell`.

## Scope

### Что входит

- Обновление указателя `vendor/april-profile` до актуального `origin/develop`.
- Проверка `hub-shell` quality gate (`lint`, `test`, `build`) после обновления.
- Обновление `dist`-артефактов `hub-shell` после сборки.
- Фиксация результата и проверок в `REPORT.md`.

### Что не входит

- Изменения исходников внешнего репозитория `april-profile`.
- Изменения бизнес-логики `hub-shell` вне совместимости с новым виджетом.
- Деплой на dev/prod и выполнение release-процедур.

## Зависимости и ограничения

- Архитектурные границы: DS-first и текущая host-интеграция через `vendor/april-profile`.
- Неразрушительный git-workflow: без `reset --hard`, без прямого push в `main/develop`.
- В рабочем дереве уже есть несвязанные изменения (`task_list.md`, `design-system/DisignApril`, предыдущий micro-report) — не менять их смысл.

## AGENT_MASTER_PROMPT compliance checklist

- [x] Прочитаны: `docs/AGENT_MASTER_PROMPT.md`, `README.md`, `task_list.md`, `docs/AGENT_ARCHITECTURE_CONTEXT.md`.
- [x] Учтены релевантные правила из `.cursor/rules/`.
- [x] Scope не расширен за пределы постановки.
- [x] Выполнение end-to-end: анализ -> обновление -> проверки -> отчёт.

## Acceptance criteria

- [x] `vendor/april-profile` указывает на актуальный коммит `develop` из `april-profile` (`ba0b1536d061ed6a7743a298043ee8083aa6de8c`).
- [x] `hub-shell` успешно проходит `npm run lint`, `npm run test`, `npm run build`.
- [x] Обновлены артефакты `hub-shell/dist`, соответствующие новой сборке.
- [x] Подготовлен отчёт с изменениями, проверками, рисками и follow-up.

## Проверка

```bash
cd hub-shell && npm ci && npm run lint && npm run test && npm run build
```

## Ожидаемый результат в REPORT

- Новый SHA submodule `vendor/april-profile`.
- Перечень обновлённых/удалённых `hub-shell/dist` артефактов.
- Фактически выполненные команды и результат.
- Риски/ограничения и follow-up.
