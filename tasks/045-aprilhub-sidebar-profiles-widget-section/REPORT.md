## 1) Итого
- Статус: ✅ выполнено
- Задача: Раздел `Профили` в sidebar AprilHub + интеграция `profiles-widget`
- Ветка: `develop`
- Коммиты: `не создавались`
- PR: не создавался

## 2) Что сделано
- [frontend] Восстановлен продуктовый маршрут `Профили` в shell: `#/app/profile/entities`, redirect с `#/app` и fallback для неизвестных маршрутов.
- [frontend] В primary sidebar возвращён пункт `Профили` с корректным active-state.
- [frontend] В `AuthorizedHubContent` подключён `ProfilesListHostWidget` в `CompositionErrorBoundary` (host-context/auth/tenant/correlation callbacks сохранены в host-виджете).
- [frontend] Синхронизированы `ShellBreadcrumbs` и `HubHostContext` navigation API под новый целевой маршрут.
- [frontend/tests] Обновлены unit/e2e smoke тесты под новый контракт shell (раздел `Профили`, redirect, fallback).
- [docs] Добавлены артефакты задачи: `PLAN.md`, обновлён `task_list.md` со статусом `045`.

## 3) Изменённые файлы
- `hub-shell/src/shell/shell-paths.ts`
- `hub-shell/src/shell/shell-paths.test.ts`
- `hub-shell/src/shell/shell-nav-config.ts`
- `hub-shell/src/shell/AuthorizedHubContent.tsx`
- `hub-shell/src/shell/ShellBreadcrumbs.tsx`
- `hub-shell/src/shell/hub-host-context.tsx`
- `hub-shell/src/App.test.tsx`
- `hub-shell/tests/e2e/shell-privileged.spec.ts`
- `hub-shell/tests/e2e/profile-widgets-smoke.spec.ts`
- `tasks/045-aprilhub-sidebar-profiles-widget-section/PLAN.md`
- `task_list.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да (revert frontend/docs изменений)

## 5) Проверка качества
- Линтер: ok
- Сборка: ok
- Unit tests: ok
- Integration tests: ok (в составе `vitest run`)
- E2E / smoke: ok

Команды (фактически выполненные):
```bash
cd hub-shell && npm run lint && npm run test
cd hub-shell && npm run e2e:smoke
cd hub-shell && npm run build
```

## 6) Деплой
- Среда: нет
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md`
- Образы: не применялось
- Health / readiness: не применялось
- Rollback: нет

## 7) Риски и ограничения
- Контракт `onOpenEntity` в текущих типах `@april/profile-ui`, доступных в этом репозитории, явно не представлен; интеграция выполнена через поддерживаемые callbacks (`onAction`, `onError`) и host-navigation API.
- Полный release-gate с evidence по мониторингу/логам требует отдельной проверки на целевом стенде с реальными telemetry данными.

## 8) Что осталось
- [ ] Создать рабочую ветку `feature/*` от `develop` и оформить commit/PR по изменениям.
