# План: обновление внешнего `profiles-widget` (submodule + deploy)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-30
- **Статус плана:** согласован с выполнением

## Исходные допущения

- Источник виджета в Hub — git submodule `vendor/april-profile` → `frontend/packages/profile-ui`, подключение через alias в `hub-shell/vite.config.ts`.
- Целевая ветка upstream — `develop` в репозитории `april-profile` (как в `.gitmodules`).
- Полная замена submodule на npm `@april/profile-ui` вне scope задачи 050 (эпик 049).

## Порядок работ (шаги)

1. `git submodule update --remote vendor/april-profile` (или checkout согласованного SHA во внешнем репо).
2. Проверить совместимость экспорта `ProfilesWidget` и host-обвязки в `hub-shell/src/integrations/april-profile-ui.ts` / `widgets.tsx`.
3. Добавить в `deploy.sh` отслеживание git-tree пути `vendor/april-profile` для `force-recreate` сервиса `hub-shell`.
4. Прогнать quality gate `hub-shell` (`npm ci`, `ds:prepare`, `lint`, `test`, `build`) и при возможности e2e smoke.
5. Зафиксировать отчёт в `REPORT.md`, подготовить PR в `develop` с указанием SHA submodule.

## Затрагиваемые области

| Область | Что меняется (кратко) |
|--------|------------------------|
| Submodule | Указатель `vendor/april-profile` → новый коммит |
| Инфра / deploy | [`deploy.sh`](../../deploy.sh): `sync_frontend_dependencies` — второй git-tree триггер для `hub-shell` |
| Frontend (hub-shell) | Без изменений коду интеграции при сохранении контракта виджета |

## Риски и откат

- **Риск:** breaking props у `ProfilesWidget` → **Митигация:** правки adapter/types в hub-shell; CI поймает `tsc`/tests.
- **Риск:** лишний `force-recreate hub-shell` при любом изменении submodule — приемлемо для dev (короткий downtime Vite).
- Откат: revert коммита в `april-worker` или предыдущий SHA в `vendor/april-profile`.

## Проверка после выполнения

- Команды из `TASK.md`; на агентной машине при `EACCES` на `node_modules` — повторить gate в CI или после `chown` на рабочей станции.

## Примечания

- Связано с [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md), [`APRILHUB_4A_WIDGET_RELEASE_GATE.md`](../../docs/runbooks/APRILHUB_4A_WIDGET_RELEASE_GATE.md).
