# Micro-task: DS 0.1.1 + profiles-widget sync

## Мета

- **id / ветка:** `2026-04-30-micro-ds-0-1-1-profiles-widget` / `develop` (рабочая ветка не менялась в рамках микро-задачи)
- **приоритет:** высокий
- **связанные файлы:**
  - `design-system/DisignApril` (git submodule pointer)
  - `vendor/april-profile` (git submodule pointer)
  - `hub-shell/dist/index.html`
  - `hub-shell/dist/assets/*`

## Цель

Актуализировать AprilHub после внешнего обновления: подтянуть дизайн-систему до состояния с `@april/ui` `0.1.1` и обновить интегрированный `profiles-widget` до текущего коммита `april-profile`.

## Scope

### Что входит

- Обновление указателя submodule `design-system/DisignApril` до коммита с `@april/ui` `0.1.1`.
- Обновление указателя submodule `vendor/april-profile` до коммита с обновленным `profiles-widget`.
- Пересборка `hub-shell` и фиксация актуальных `dist`-артефактов.
- Проверка качества (lint/test/build) в воспроизводимом окружении.
- Оформление `REPORT.md`.

### Что не входит

- Изменения кода во внешних репозиториях `DisignApril` и `april-profile`.
- Деплой на dev/prod.
- Расширение host-контракта `profiles-widget` сверх текущей постановки.

## Зависимости и ограничения

- `hub-shell/node_modules/@april/*` локально имеет права `root`, из-за чего локальный `npm ci` и `ds:prepare` могут падать по `EACCES`.
- Для валидации использовать чистое контейнерное окружение `node:20`.

## AGENT_MASTER_PROMPT compliance checklist

- [x] Прочитаны и учтены `README.md`, `task_list.md`, `docs/AGENT_ARCHITECTURE_CONTEXT.md`, `docs/AGENT_MASTER_PROMPT.md`.
- [x] Scope не расширялся.
- [x] Выполнение end-to-end: анализ -> изменения -> проверки -> отчет.
- [x] Destructive git-команды не использовались.

## Acceptance criteria

- [ ] `design-system/DisignApril` обновлен до коммита с `@april/ui` `0.1.1`.
- [ ] `vendor/april-profile` обновлен до коммита с актуальным `profiles-widget`.
- [ ] `hub-shell` успешно проходит `lint`, `test`, `build` в воспроизводимом окружении.
- [ ] `REPORT.md` содержит список изменений, проверки, риски и follow-up.

## Проверка

```bash
docker run --rm -v /home/ukituki/april-worker:/workspace -w /workspace/hub-shell node:20 bash -lc "npm ci && npm run lint && npm run test && npm run build"
```

## Ожидаемый результат в REPORT

- Зафиксированные новые SHA submodule для `DisignApril` и `vendor/april-profile`.
- Перечень обновленных `hub-shell/dist` файлов.
- Результат quality gate.
- Описание ограничения с правами `node_modules` и follow-up.
