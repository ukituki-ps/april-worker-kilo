## 1) Итого
- Статус: ⚠️ частично
- Задача: Новый раздел `Профили` в sidebar + интеграция внешнего `profiles-widget`
- Ветка: `feature/045-profiles-sidebar-external-widget`
- Коммиты: `не создавались`
- PR: не создавался

## 2) Что сделано
- [frontend] Возвращён раздел `Профили` в sidebar (`#/app/profile/entities`) и активный state навигации.
- [frontend] Обновлён роутинг shell: redirect c `#/app` на `#/app/profile/entities` и fallback для неизвестных маршрутов.
- [frontend] В `AuthorizedHubContent` подключён `ProfilesListHostWidget` для рендера внешнего `ProfilesWidget`.
- [frontend] Интеграция выполнена строго через внешний runtime-артефакт `april-profile-1/frontend/packages/profile-ui/dist` (без локального vendor/shim с логикой виджета).
- [frontend] В host передаются только контрактные параметры (`hostContext`, `apiBaseUrl`, `accessToken`, `onObservability`); бизнес-логика списка/CRUD остаётся во внешнем виджете.
- [frontend/tests] Обновлены unit/e2e тесты под новый UX-контракт, добавлен smoke-спек `profile-widgets-smoke.spec.ts`.
- [docs] Добавлен `PLAN.md`, отчёт оформлен по шаблону.

## 3) Изменённые файлы
- `hub-shell/package.json`
- `hub-shell/package-lock.json`
- `hub-shell/src/App.test.tsx`
- `hub-shell/src/integrations/april-profile-ui.ts`
- `hub-shell/src/shell/AuthorizedHubContent.tsx`
- `hub-shell/src/shell/ShellBreadcrumbs.tsx`
- `hub-shell/src/shell/hub-host-context.tsx`
- `hub-shell/src/shell/shell-nav-config.ts`
- `hub-shell/src/shell/shell-paths.ts`
- `hub-shell/src/shell/shell-paths.test.ts`
- `hub-shell/src/widgets.tsx`
- `hub-shell/tests/e2e/shell-privileged.spec.ts`
- `hub-shell/tests/e2e/profile-widgets-smoke.spec.ts`
- `tasks/045-aprilhub-sidebar-profiles-widget-section/PLAN.md`
- `tasks/045-aprilhub-sidebar-profiles-widget-section/REPORT.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да (revert frontend/docs изменений)

## 5) Проверка качества
- Линтер: ok
- Сборка: ok
- Unit tests: ok
- Integration tests: ok (в составе `vitest run`)
- E2E / smoke: fail (таймауты стенда в Playwright-прогоне)

Команды (фактически выполненные):
```bash
npm --prefix hub-shell install --package-lock-only
npm --prefix hub-shell run lint
npm --prefix hub-shell run test
npm --prefix hub-shell run build
npm --prefix hub-shell run e2e:smoke
```

## 6) Деплой
- Среда: нет
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
- Образы: не применялось
- Health / readiness: не применялось
- Rollback: нет

## 7) Риски и ограничения
- В текущем окружении `npm --prefix hub-shell install` падает с `EACCES`, поэтому прямое подключение `@april/profile-ui` через `node_modules` не использовано.
- Использован внешний runtime-артефакт (`dist/index.js`) из соседнего репозитория `april-profile-1`; это соответствует требованию "строго внешний виджет", но требует наличия этого артефакта на рабочей машине/CI.
- `e2e:smoke` не завершён успешно из-за стендовых таймаутов; перед merge нужен зелёный прогон smoke.

## 8) Что осталось
- [ ] Повторно прогнать `npm --prefix hub-shell run e2e:smoke` на стабильном dev-стенде и зафиксировать успешный результат.
- [ ] Создать PR с test plan и рисками после успешного smoke.
