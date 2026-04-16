# План: Design system integration + showcase (этап 013)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-16
- **Статус плана:** согласован

## Исходные допущения
- Репозиторий `DisignApril` доступен по git, но пакеты `@april/tokens` и `@april/ui` не опубликованы в публичном npm registry.
- Для этапа 013 допустима интеграция через `git dependency` (submodule) без дублирования исходников дизайн-системы.
- В dev-контуре витрина должна быть отдельным runtime и открываться через единый ingress.

## Порядок работ (шаги)
1. Подключить `DisignApril` как submodule в `design-system/DisignApril`.
2. Настроить `hub-shell` на использование `@april/tokens` и `@april/ui` из submodule (file dependency) и автоматическую подготовку дизайн-системы перед build/test.
3. Интегрировать токены/компоненты в `hub-shell` (опорные UI-элементы, провайдеры).
4. Поднять отдельный showcase runtime из `DisignApril` в `docker-compose` и опубликовать через `/showcase/` в Nginx ingress.
5. Расширить smoke-проверку проверкой доступности showcase.
6. Обновить документацию и заполнить `REPORT.md` по шаблону.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | Без изменений |
| Frontend | `hub-shell`: зависимости дизайн-системы, обёртка `AprilProviders`, токены в стилях |
| БД / Atlas | Без изменений |
| Инфра / Compose | Новый сервис showcase runtime, ingress-маршрут `/showcase/` |
| Документация / OpenAPI | Обновление гайда по DS и task-отчёта |

## Риски и откат
- **Риск:** dev-runtime становится тяжелее из-за сборки submodule. -> **Митигация:** запуск только в профиле `aprilhub`, чёткие команды в документации.
- **Риск:** отсутствие `pnpm` в окружении. -> **Митигация:** `corepack enable` в runtime-командах compose и явное требование в документации.
- При необходимости отката: удалить submodule, вернуть `hub-shell` зависимости/скрипты, убрать маршрут и сервис showcase из compose/nginx.

## Проверка после выполнения
- Команды:
  - `npm --prefix hub-shell run build`
  - `npm --prefix hub-shell run test`
  - `./scripts/smoke-aprilhub.sh`
- Ручная проверка:
  - `http://localhost:${DOCS_HTTP_PORT:-8080}/showcase/` отдаёт HTML витрины.

## Примечания
- Связанные материалы: `docs/guides/DESIGN_SYSTEM.md`, `docs/DEPLOYMENT_STRATEGY.md`.
