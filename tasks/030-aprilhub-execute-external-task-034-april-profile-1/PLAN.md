# План: исполнение внешней задачи 034 (release gates виджетов 4a в AprilHub)

- **Задача:** [`TASK.md`](./TASK.md)
- **Внешняя постановка:** `april-profile-1/tasks/034-phase-4a-hub-widget-release-gates-smoke/TASK.md`
- **Дата плана:** 2026-04-24
- **Статус плана:** согласован с выполнением

## Исходные допущения

- Исполнение кода и CI — в `april-worker`; постановка и docs-site история — в `april-profile-1`.
- `@april/profile-ui` в `hub-shell` пока не подключён как npm-зависимость; semver-гейт должен работать как no-op и активироваться при появлении зависимости.

## Порядок работ

1. Прочитать критерии 034 и `VERSIONING_AND_COMPATIBILITY.md` в профиле.
2. Добавить runbook release gate + скрипт semver + шаги CI/README/TESTING_STRATEGY.
3. Оформить docs-site и `REPORT.md` в обоих репозиториях.
4. Прогнать локальные команды quality gate (без полного compose при ограничениях среды).

## Затрагиваемые области

| Область | Изменения |
|--------|-----------|
| CI | Шаг semver в `hub-shell` и alpine preflight |
| Документация AprilHub | Runbook, README, TESTING_STRATEGY |
| hub-shell | Скрипт `check-april-profile-ui-semver.mjs`, npm script |
| april-profile-1 | task-story-034, overview, TASK/REPORT задачи 034 |

## Риски

- Playwright не добавлен в обязательный PR CI (нагрузка); митигация — nightly + ручной прогон перед релизом, зафиксировано в runbook.
