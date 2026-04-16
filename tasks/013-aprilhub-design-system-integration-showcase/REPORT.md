## 1) Итого
- Статус: ✅ выполнено
- Задача: Design system integration + separate showcase deployment (`DisignApril`)
- Ветка: `feature/aprilhub-implementation`
- Коммиты: `не создавались в рамках отчёта`
- PR: не создавался

## 2) Что сделано
- [frontend] Подключён `DisignApril` через `git submodule` (`design-system/DisignApril`) и настроен `hub-shell` на `file:` зависимости `@april/tokens` / `@april/ui`.
- [frontend] В `hub-shell` добавлена автоматическая подготовка дизайн-системы перед `dev/build/test` (`ds:prepare`), внедрены токены `@april/tokens/css` и опорные UI-элементы на Mantine (`Button`, `Card`, `Badge`).
- [infra / compose / nginx] Добавлен отдельный runtime `april-showcase` (из `DisignApril/apps/showcase`) и ingress-маршрут `/showcase/` в `infra/nginx/default.conf`.
- [testing/smoke] Расширен `scripts/smoke-aprilhub.sh`: проверка доступности `/showcase/` и учёт прогрева ingress (retry-циклы для shell/showcase).
- [docs] Обновлён `docs/guides/DESIGN_SYSTEM.md` с воспроизводимыми шагами submodule-интеграции и запуска showcase.
- [tasks] Добавлен `PLAN.md`, обновлён `task_list.md` (этап `013` переведён в выполненные).

## 3) Изменённые файлы
- `.gitmodules`
- `design-system/DisignApril` (git submodule)
- `hub-shell/package.json`
- `hub-shell/package-lock.json`
- `hub-shell/src/main.tsx`
- `hub-shell/src/App.tsx`
- `hub-shell/src/app.css`
- `hub-shell/src/App.test.tsx`
- `hub-shell/src/test/setup.ts`
- `docker-compose.yml`
- `infra/nginx/default.conf`
- `scripts/smoke-aprilhub.sh`
- `docs/guides/DESIGN_SYSTEM.md`
- `task_list.md`
- `tasks/013-aprilhub-design-system-integration-showcase/PLAN.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да; откат — удалить submodule и связанные изменения в `hub-shell`/compose/nginx/docs

## 5) Проверка качества
- Линтер: ok
- Сборка: ok
- Unit tests: ok
- Integration tests: не запускались (вне scope шага)
- E2E / smoke: ok

Команды (фактически выполненные):
```bash
npm --prefix hub-shell run build
npm --prefix hub-shell run test
./scripts/smoke-aprilhub.sh
```

## 6) Деплой
- Среда: нет (локальная проверка)
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
- Образы: не применялось
- Health / readiness: smoke проверяет ingress `/healthz`, shell `/`, showcase `/showcase/`, auth-путь и role-gated API
- Rollback: не применялся

## 7) Риски и ограничения
- `april-showcase` и `hub-shell` на dev-профиле требуют `pnpm` через `corepack` внутри контейнеров; первый старт может быть медленным.
- На старте smoke возможны кратковременные `502` до готовности Vite runtime; это компенсируется retry-логикой.
- `@april/ui` и `@april/tokens` берутся из submodule, поэтому для чистого checkout нужен `git submodule update --init --recursive`.

## 8) Что осталось
- [ ] Создать отдельный PR с изменениями этапа `013` (с test plan и рисками).
- [ ] При необходимости вынести подготовку дизайн-системы в отдельный кэшируемый CI-слой для ускорения smoke/deploy.
