# План: Authorized Zone Standard Shell Layout (Этап 015)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-17
- **Статус плана:** согласован

## Исходные допущения
- Навигация в рамках этапа `015` остаётся без `React Router`: текущая state-машина `App.tsx` и sidebar/anchors.
- Изменения ограничиваются `hub-shell`, smoke-проверкой и документацией по задаче в `tasks/015-aprilhub-authorized-shell-standard-layout/`.
- Реализация опирается на визуальные паттерны baseline-шаблона, но адаптируется под текущий стек и существующий auth-flow.

## Порядок работ (шаги)
1. Подготовить `PLAN.md` и зафиксировать scope/риски/проверки.
2. Обновить `hub-shell` layout-каркас (`header + sidebar + content frame`) в `app-shell`.
3. Перекомпоновать состояние `authorized/forbidden/loading/error` в `App.tsx` внутри единого shell-каркаса (без поломки login/logout flow).
4. Привести ключевые UI-тексты авторизованной зоны к русскому языку.
5. Актуализировать стили `app.css` под дизайн-системный baseline (spacing, active states, responsive).
6. Обновить unit/UI-проверки `hub-shell` для нового каркаса и состояний.
7. Дополнить `scripts/smoke-aprilhub.sh` проверкой отсутствия регрессии shell entrypoint.
8. Выполнить команды проверки из `TASK.md`.
9. Подготовить `REPORT.md` по шаблону и актуализировать статусы задачи в `task_list.md` и `TASK.md`.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | Не меняется |
| Frontend | `hub-shell`: каркас layout, русификация текстов, обработка состояний |
| БД / Atlas | Не меняется, миграции не требуются |
| Инфра / Compose | Без изменений compose-конфигурации; обновляется smoke-скрипт |
| Документация / OpenAPI | Обновляются task-артефакты `PLAN.md`/`REPORT.md` и статусы в `task_list.md`; OpenAPI без изменений |

## Риски и откат
- **Риск:** регрессия auth-flow при перекомпоновке `App.tsx`. → **Митигация:** сохранить текущую state-машину и ветки `guest/transition/forbidden/authorized`, покрыть тестами.
- **Риск:** несогласованность forbidden-состояний shell/module level. → **Митигация:** унифицировать тексты и рендер через общий каркас.
- **Риск:** визуальный регресс в responsive-layout. → **Митигация:** обновить CSS с явными breakpoints и прогнать smoke/unit.
- При необходимости отката: вернуть изменения файлов `hub-shell/src/*`, `scripts/smoke-aprilhub.sh`, task-документации в предыдущую ревизию ветки.

## Проверка после выполнения
- Команды:
  - `npm --prefix hub-shell run build`
  - `npm --prefix hub-shell run test`
  - `./scripts/smoke-aprilhub.sh`
- Ручная проверка / smoke:
  - гостевой вход отображается как раньше;
  - после авторизации отображается единый shell-каркас;
  - сценарии `loading/error/forbidden` не разрывают layout.

## Примечания
- Связанные документы: `task_list.md`, `docs/AGENT_ARCHITECTURE_CONTEXT.md`, `docs/TESTING_STRATEGY.md`.
- Обновления плана:
  - `2026-04-17` — создан и согласован baseline-план реализации этапа `015`.
# План: Authorized Zone Standard Shell Layout (Этап 015)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-16
- **Статус плана:** актуализирован

## Исходные допущения
- Работы ограничены авторизованной зоной `hub-shell` и документацией задачи `015`.
- За baseline принимается dashboard-подход из шаблона (в текущем репо доступен эквивалентный референс `DashboardPage.tsx`).
- Политика ролей и доступов остаётся в Keycloak; backend-контракты не меняются.

## Порядок работ (шаги)
1. Пересобрать `AppShell` в стиле dashboard baseline: header, sidebar, content с насыщенными секциями.
2. Сохранить единый каркас для состояний `authorized/loading/forbidden/error`.
3. Устранить redirect-loop на auth ошибках, убрав автологин из API-слоя и обрабатывая ошибки в UI.
4. Поддержать русскоязычные UI-тексты в авторизованной зоне.
5. Обновить unit-тесты и test setup под используемые Mantine-компоненты.
6. Прогнать релевантные проверки и оформить отчёт `REPORT.md`.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | Не изменяется |
| Frontend | `hub-shell` layout, auth-state UX, unit tests |
| БД / Atlas | Не изменяется |
| Инфра / Compose | Не изменяется в рамках этапа 015 |
| Документация / OpenAPI | `PLAN.md`, `REPORT.md` в задаче 015 |

## Риски и откат
- **Риск:** регрессия auth UX при переносе состояний в единый shell → **Митигация:** тесты сценариев `authorized/forbidden/error`.
- **Риск:** несовместимость Mantine-компонентов с jsdom → **Митигация:** полифилл `ResizeObserver` в test setup.
- При необходимости отката: `git restore` по изменённым файлам `hub-shell/src/*` и файлам задачи `015`.

## Проверка после выполнения
- Команды: `npm exec vitest run src/App.test.tsx src/api.test.ts` (из `hub-shell`), `./scripts/smoke-aprilhub.sh`.
- Ручная проверка: после логина отображается dashboard-like shell, состояния `loading/error/forbidden` не выбивают пользователя из каркаса.

## Примечания
- Связанные артефакты: `tasks/015-aprilhub-authorized-shell-standard-layout/TASK.md`.
- Обновления плана: 2026-04-16 — повторная реализация по уточнённому референсу.
# План: Authorized Zone Standard Shell Layout (Этап 015)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-16
- **Статус плана:** актуализирован

## Исходные допущения
- Изменения ограничены `hub-shell` и артефактами задачи `tasks/015-aprilhub-authorized-shell-standard-layout/`.
- Guest-landing остаётся отдельной зоной; единый каркас обязателен для авторизованного контура и его состояний (`loading/error/forbidden`).
- Источник прав и ролей не меняется: решения по доступу продолжают опираться на Keycloak и текущий `/v1/me`.

## Порядок работ (шаги)
1. Привести `AppShell` к визуальному baseline `DashboardPage.tsx`: структура dashboard-блоков (метрики, таблица, расписание, прогресс) в пределах стандартного `header + sidebar + content`.
2. Сохранить единый shell-каркас для `authorized/loading/error/forbidden`, включая корректный logout и role-aware поведение.
3. Исключить auth redirect-loop в runtime: убрать auto-login из API-слоя и обрабатывать ошибки сессии в UI.
4. Синхронизировать конфигурацию Keycloak issuer между ingress и `hub-bff`, чтобы `GET /api/v1/me` проходил с валидным токеном.
5. Обновить тесты (`App`, `api`) и test setup (`ResizeObserver`) под новые Mantine-компоненты.
6. Прогнать релевантные проверки и оформить `REPORT.md` с рисками/follow-up.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | Не изменяется |
| Frontend | `hub-shell` layout в стиле dashboard baseline, auth/runtime состояния, тесты |
| БД / Atlas | Не изменяется |
| Инфра / Compose | Актуализация issuer в `docker-compose.yml` для согласованности с токенами Keycloak |
| Документация / OpenAPI | Документация задачи (`PLAN.md`, `REPORT.md`) |

## Риски и откат
- **Риск:** регрессия в auth flow при визуальном усложнении layout → **Митигация:** тесты `App`/`api` + smoke через ingress.
- **Риск:** несовместимость Mantine-виджетов с jsdom в unit-тестах → **Митигация:** стабилизировать тестовое окружение (`ResizeObserver` mock).
- **Риск:** `401 invalid token` из-за несогласованного issuer → **Митигация:** выровнять `KEYCLOAK_ISSUER` на `http://localhost:8080/auth/realms/april`.
- При необходимости отката: вернуть изменения файлов `hub-shell/src/*` и артефактов `tasks/015-*` через git revert/patch rollback.

## Проверка после выполнения
- Команды: `npm --prefix hub-shell run build`, `npm --prefix hub-shell run test`, `./scripts/smoke-aprilhub.sh`.
- Ручная проверка: guest landing доступен; после авторизации отображается dashboard-like shell; `forbidden`/`error`/`loading` показываются в content frame без reload-loop.

## Примечания
- Связанные артефакты: `tasks/015-aprilhub-authorized-shell-standard-layout/TASK.md`, `tasks/003-aprilhub-shell-design-system/REPORT.md`, `tasks/014-aprilhub-keycloak-design-system-alignment/TASK.md`.
- Обновления плана: 2026-04-16 — создан первичный план реализации.
- Обновления плана: 2026-04-16 — добавлены шаги по визуальному выравниванию с `DashboardPage.tsx`, fix auth loop и выравнивание Keycloak issuer.
