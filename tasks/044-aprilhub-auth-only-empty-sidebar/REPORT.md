## 1) Итого
- Статус: ✅ выполнено
- Задача: AprilHub auth-only контур с пустым сайдбаром
- Ветка: `feature/044-auth-only-empty-sidebar`
- Коммиты: не создавались
- PR: не создавался

## 2) Что сделано
- [frontend] Упрощён runtime-маршрутизатор shell до auth-only контракта: `redirect -> /app`, `home`, `not-found`.
- [frontend] Primary sidebar переведён в пустой режим (без продуктовых пунктов навигации).
- [frontend] Удалён активный рендер профильного контента из `AuthorizedHubContent`; добавлен auth-only placeholder.
- [frontend] Убрана навигационная привязка к `profile-list` из host-контекста и breadcrumbs.
- [tests] Обновлены unit/e2e проверки под новый UX-контракт, включая smoke-проверку отсутствия вызовов `/api/v1/admin/profile/api/**`.
- [docs] Добавлены `PLAN.md` и этот `REPORT.md` для задачи `044`.

## 3) Изменённые файлы
- `hub-shell/src/App.tsx`
- `hub-shell/src/App.test.tsx`
- `hub-shell/src/shell/AuthorizedHubContent.tsx`
- `hub-shell/src/shell/ShellBreadcrumbs.tsx`
- `hub-shell/src/shell/hub-host-context.tsx`
- `hub-shell/src/shell/shell-nav-config.ts`
- `hub-shell/src/shell/shell-paths.ts`
- `hub-shell/src/shell/shell-paths.test.ts`
- `hub-shell/tests/e2e/shell-privileged.spec.ts`
- `hub-shell/tests/e2e/profile-widgets-smoke.spec.ts`
- `tasks/044-aprilhub-auth-only-empty-sidebar/PLAN.md`
- `tasks/044-aprilhub-auth-only-empty-sidebar/REPORT.md`
- `task_list.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да, через revert frontend-изменений auth-only контура

## 5) Проверка качества
- Линтер: ok
- Сборка: не запускалась отдельно
- Unit tests: ok
- Integration tests: не применялось отдельно
- E2E / smoke: ok

Команды (фактически выполненные):
```bash
npm --prefix hub-shell run lint
npm --prefix hub-shell run test
npm --prefix hub-shell run e2e:smoke
```

## 6) Деплой
- Среда: нет
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
- Образы: не применялось
- Health / readiness: не применялось
- Rollback: не применялся

## 7) Риски и ограничения
- В репозитории остаются legacy-файлы профильного домена (`widgets.tsx`, `vendor/april-profile-ui.tsx` и пр.), но они выведены из активного runtime-пути auth-only shell.
- Smoke-набор использует прежнее имя файла `profile-widgets-smoke.spec.ts`; сценарий внутри адаптирован под auth-only поведение.

## 8) Что осталось
- [ ] При следующем cleanup-цикле выполнить физическое удаление legacy профильных host-компонентов, не участвующих в runtime.
- [ ] При необходимости переименовать smoke-спеку `profile-widgets-smoke.spec.ts` в более релевантное имя auth-only контура.
