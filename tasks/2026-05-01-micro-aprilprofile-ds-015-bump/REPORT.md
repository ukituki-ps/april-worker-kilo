# Отчёт: `2026-05-01-micro-aprilprofile-ds-015-bump`

## Что изменено

| Область | Суть |
| -------- | ----- |
| `design-system/DisignApril` | Submodule → `ae47313` — merge **DS-008 / release 0.1.5** (`@ukituki-ps/april-ui` и `@ukituki-ps/april-tokens` **0.1.5**). |
| `vendor/april-profile` | Submodule → `267966d` (`develop`): vendored `april-*-0.1.5.tgz`, рефакторинг `profile-ui` (только нужные виджеты для Hub), правки `ProfilesWidgetCore` и др. по upstream. |
| `hub-shell/dist` | Пересобраны бандлы (`index.html`, `assets/index-*.js`, `assets/april-profile-ui-*.js`); удалены хеши предыдущей сборки. |

Исходники `hub-shell/src` не менялись: интеграция по-прежнему использует `ProfilesWidget` и `EntityTypesWidget` из `@april/profile-ui-external`.

## Проверки

| Команда | Результат |
| -------- | --------- |
| `make openapi-lint` | Успех (Redocly, три спека). |
| `cd hub-bff && go test ./...` | Успех. |
| `cd hub-shell && npm ci` | Успех. |
| `npm run lint` | Успех (`ds:prepare` → pnpm build DS 0.1.5, `assert-ui-dist-exports` ok). |
| `npm run test` | Vitest: 4 файла, 12 тестов — ok. |
| `npm run build` | Vite production — ok. |

Скрипт `npm run check:profile-ui-semver` из корневого `README.md` в `hub-shell/package.json` отсутствует — шаг пропущен с явной причиной (см. `TASK.md`).

## Риски и ограничения

- В upstream `profile-ui` удалены виджеты (конфликты, инстансы, entity profile и т.д.); если в Hub когда-либо остались скрытые импорты — они бы сломали сборку; текущая интеграция только **Profiles** + **Entity types** — совместима.
- Локальный `hub-shell/.vite/deps/*` (кроме уже отслеживаемых файлов) после `vite`/dev может появляться как мусор — в коммит не включалось.

## Follow-up

- При необходимости выровнять `README.md` mandatory gate с фактическим `package.json` (`check:profile-ui-semver`) отдельной задачей.
- По желанию команды: `hub-shell/.gitignore` или очистка политики для `hub-shell/.vite/deps` вне минимального набора.

## Дополнение: повторная верификация и dist (2026-05-01)

- Повторно выполнены проверки из `TASK.md`: `make openapi-lint`, `cd hub-bff && go test ./...`, `cd hub-shell && npm ci && npm run lint && npm run test && npm run build` — успех.
- После свежей production-сборки хеши зафиксированных JS-чанков в `hub-shell/dist` отличались от состояния в `develop` сразу после merge PR #129; синхронизация вынесена в коммит на ветке `feature/sync-hub-shell-dist-2026-05-01` (`index-D_paGuwH.js`, `april-profile-ui-Cp1lwvdI.js`, обновлённый `index.html`). Для попадания в основную линию нужен PR в `develop`.
