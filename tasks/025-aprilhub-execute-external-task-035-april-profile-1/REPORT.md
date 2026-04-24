## 1) Итого

- Статус: ✅ выполнено
- Задача: Исполнение внешней задачи 035 (shell IA, HostContext, smoke deep-link)
- Ветка: `feature/025-aprilhub-shell-ia-035`
- Коммиты: см. `git log feature/025-aprilhub-shell-ia-035` (основной функционал: `488ea51`)
- PR: создать вручную в [`april-worker`](https://github.com/ukituki-ps/april-worker) (ветка указана выше); после merge обновить ссылки здесь и в `april-profile-1`

### Дублирование отчёта

- [x] Копия с тем же содержанием: `april-profile-1/tasks/035-phase-4a-hub-ui-shell-information-architecture/REPORT.md` (ветка `feature/035-hub-shell-report`, коммит `0d2a35e` — после push)

## 2) Что сделано

- [frontend] Зафиксирована IA профиля в sidebar: обзор, роли, карточка сущности (deeplink на дефолтный `entityId`), заглушка экземпляра (`instanceId`), админ-раздел по роли `admin`.
- [frontend] Политика **вкладка = подпуть** (`/card`, `/meta`) vs **отдельный маршрут** для экземпляра и будущих списков; канонические пути в `hub-shell/src/shell/shell-paths.ts`.
- [frontend] `HubHostContextProvider` — расширение host-контекста навигацией и срезом маршрута; `ShellToastProvider` — success/error toasts; breadcrumbs, «Назад» / «К обзору»; демо подтверждения опасного действия (`Modal`) на вкладке «Связи».
- [frontend/tests] Vitest: разбор маршрутов. Playwright: навигация с обзора на карточку + сохранение; отдельный кейс deep-link на `/#/app/profile/entities/.../card`.
- [docs] Обновлены `docs/WIDGET_CONTRACTS.md` (§8), `docs/FRONTEND_STRATEGY.md` (§7); docs-site: `task-story-035-...md`, индекс `task-stories-overview.md`.

## 3) Изменённые файлы (основные)

- `hub-shell/src/App.tsx`
- `hub-shell/src/app-shell.tsx`
- `hub-shell/src/widgets.tsx`
- `hub-shell/src/app.css`
- `hub-shell/src/shell/*.tsx`, `hub-shell/src/shell/shell-paths.ts`, `hub-shell/src/shell/shell-nav-config.ts`
- `hub-shell/src/shell/shell-paths.test.ts`
- `hub-shell/tests/e2e/smoke.spec.ts`
- `docs/WIDGET_CONTRACTS.md`, `docs/FRONTEND_STRATEGY.md`
- `docs-site/docs/task-story-035-phase-4a-hub-ui-shell-information-architecture.md`
- `docs-site/docs/task-stories-overview.md`
- `tasks/025-aprilhub-execute-external-task-035-april-profile-1/PLAN.md`, `REPORT.md`

## 4) Миграции и данные

- Миграции Atlas: нет
- Обратимость: да (revert изменений фронта и документации)

## 5) Проверка качества

- Линтер (`hub-shell` / `tsc --noEmit`): ok
- Unit tests (`hub-shell` / vitest): ok
- E2E: не запускались в этой сессии (требуют compose/Keycloak); команда: `./scripts/run-playwright-aprilhub.sh`

Команды (фактически выполненные):

```bash
cd hub-shell && npx tsc --noEmit
cd hub-shell && npm run test
```

## 6) Деплой

- Среда: не выполнялся (в постановке не требовался явный деплой на dev)
- Образы: не применялись

## 7) Риски и ограничения

- `npm install` в `hub-shell` в среде агента завершился `EACCES` из‑за root-owned `node_modules`; зависимости не добавлялись, маршрутизация реализована на hash без `react-router-dom`.
- Полноценный список профилей / экземпляров и продуктовые e2e — в задачах 026/028/030/032/034.

## 8) Что осталось

- [ ] Создать PR из `feature/025-aprilhub-shell-ia-035`, прогнать обязательный контур CI и e2e на стенде.
- [ ] При необходимости выровнять root path SPA (History API) с единым ingress — отдельное решение.
