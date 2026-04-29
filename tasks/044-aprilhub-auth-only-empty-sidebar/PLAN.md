# План: AprilHub auth-only контур с пустым сайдбаром

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-29
- **Статус плана:** согласован

## Исходные допущения
- Контур авторизации (`check-sso`, login/logout, `GET /api/v1/me`) должен сохраниться без изменений API-контракта.
- Бизнес-разделы и профильные виджеты удаляются из активного runtime-пути, но полный физический purge legacy-файлов допустим как follow-up.
- Тестовый минимум для задачи: `hub-shell` lint + unit + e2e smoke.

## Порядок работ (шаги)
1. Упростить навигационный контракт shell: пустой sidebar, минимальные маршруты auth-only.
2. Перевести `AuthorizedHubContent` на placeholder/fallback без загрузки профильных виджетов.
3. Синхронизировать связанные shell-компоненты (`breadcrumbs`, host context navigation) с новым маршрутом.
4. Обновить unit/e2e smoke тесты под auth-only UX и проверить отсутствие профильных API-вызовов в штатном сценарии.
5. Прогнать проверки (`lint`, `test`, `e2e:smoke`) и оформить `REPORT.md`.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | Не меняется |
| Frontend | `hub-shell`: маршруты, authorized content, навигация, тесты |
| БД / Atlas | Не меняется |
| Инфра / Compose | Не меняется |
| Документация / OpenAPI | Отчёт по задаче (`REPORT.md`) |

## Риски и откат
- **Риск:** сломать UX fallback при произвольном hash-route. → **Митигация:** добавить/обновить e2e тест на unknown route.
- **Риск:** регрессия в меню/состоянии authorized shell из-за пустой навигации. → **Митигация:** обновить unit/e2e assertions на пустой sidebar.
- Откат: revert изменений в `hub-shell/src/shell/*`, `hub-shell/src/App.test.tsx`, `hub-shell/tests/e2e/*`.

## Проверка после выполнения
- Команды: `npm --prefix hub-shell run lint`, `npm --prefix hub-shell run test`, `npm --prefix hub-shell run e2e:smoke`.
- Ручная проверка: логин -> авторизованный shell с пустым sidebar; unknown route -> fallback без crash.

## Примечания
- Связанные задачи: `042`, `043`, `044` в `task_list.md`.
- Обновления плана: первичная версия от 2026-04-29.
