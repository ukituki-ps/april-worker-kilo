# Micro-task: AprilProfile виджеты + DS 0.1.5

## Мета

- **id:** `2026-05-01-micro-aprilprofile-ds-015-bump`
- **ветка:** `feature/2026-05-01-micro-aprilprofile-ds-015-bump` (PR в `develop`, без прямого push в защищённые ветки)
- **приоритет:** высокий
- **связанные файлы:**
  - `vendor/april-profile` (submodule)
  - `design-system/DisignApril` (submodule)
  - `hub-shell/dist/*`
  - `task_list.md`

## Цель

Синхронизировать AprilHub с обновлением дизайн-системы **0.1.5** и актуальным `april-profile` (`profile-ui` на vendored `april-tokens` / `april-ui` **0.1.5**), чтобы host-интеграция `ProfilesWidget` / `EntityTypesWidget` и сборка `hub-shell` соответствовали внешнему репозиторию.

## Scope

### Что входит

- Указатель `design-system/DisignApril` → коммит с **`@ukituki-ps/april-ui` / `@ukituki-ps/april-tokens` 0.1.5** (`ae47313`).
- Указатель `vendor/april-profile` → актуальный `origin/develop` с tarball DS 0.1.5 и упрощённым набором виджетов (`267966d`).
- Quality gate `hub-shell`: `npm ci`, `npm run lint`, `npm run test`, `npm run build`.
- Обновление зафиксированных артефактов `hub-shell/dist` после сборки.
- `REPORT.md` в папке задачи.

### Что не входит

- Правки исходников во внешних репозиториях `april-profile` / `DisignApril`.
- Переход `hub-shell` на npm registry вместо `file:` (эпик `049`).
- Деплой на dev и smoke/k6 (не запрашивались в постановке).

## Зависимости и ограничения

- DS-first: `hub-shell` по-прежнему тянет `@april/*` из submodule `DisignApril`; `ds:prepare` собирает пакеты через pnpm.
- Без destructive git-операций; merge через PR.

## AGENT_MASTER_PROMPT compliance checklist

- [x] Прочитаны: `docs/AGENT_MASTER_PROMPT.md`, `README.md`, `task_list.md`, `docs/AGENT_ARCHITECTURE_CONTEXT.md`.
- [x] Учтены правила из `.cursor/rules/` (релевантные для фронта/задач).
- [x] Scope не расширен.
- [x] End-to-end: анализ → обновление указателей и dist → проверки → отчёт.

## Acceptance criteria

- [x] `design-system/DisignApril` на `ae47313` (релиз DS **0.1.5**).
- [x] `vendor/april-profile` на `267966d` (develop с DS **0.1.5** в `frontend/vendor/ds-packs`).
- [x] `hub-shell`: `lint`, `test`, `build` успешно; `make openapi-lint`; `cd hub-bff && go test ./...`.
- [x] `hub-shell/dist` соответствует новой сборке.
- [x] Заполнен `REPORT.md`.

## Проверка

```bash
make openapi-lint
cd hub-bff && go test ./...
cd hub-shell && npm ci && npm run lint && npm run test && npm run build
```

Примечание: в `README.md` указан шаг `npm run check:profile-ui-semver` — в текущем `hub-shell/package.json` этого скрипта нет; при появлении зависимости `@april/profile-ui` в lockfile скрипт из задачи `030` можно вернуть в манифест.

## Ожидаемый результат в `REPORT.md`

Зафиксированы коммиты submodule, перечень изменённых файлов `dist`, результаты команд и краткие риски/follow-up.
