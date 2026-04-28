## 1) Итого
- Статус: ✅ выполнено
- Задача: Минималистичный сайдбар AprilHub — только `Профиль — список`
- Ветка: `feature/aprilhub-implementation`
- Коммиты: не создавались
- PR: не создавался

## 2) Что сделано
- [frontend] Сайдбар сокращён до одного пункта `Профиль — список` (`/app/profile/entities`) без остальных разделов.
- [frontend] Минимализирован роутинг авторизованной зоны: удалены runtime-ветки `overview/roles/card/instances/history/conflicts/admin`; неизвестные маршруты переводятся в fallback-state.
- [frontend] `AuthorizedHubContent` переведён на единственный рабочий рендер `ProfilesListHostWidget` с сохранением host-обвязки и `CompositionErrorBoundary`.
- [frontend] `hub-host-context` и breadcrumbs синхронизированы с новым минимальным контрактом навигации.
- [frontend/e2e] Smoke-набор обновлён под новый IA-контур (гость, privileged shell, профильный список + негатив unknown route); из обязательного smoke исключены restricted/RBAC-спеки, завязанные на отдельные restricted-персоны.
- [docs] Для задачи 043 добавлены `PLAN.md` и этот `REPORT.md`.

## 3) Изменённые файлы
- `hub-shell/package.json`
- `hub-shell/src/App.tsx`
- `hub-shell/src/App.test.tsx`
- `hub-shell/src/shell/AuthorizedHubContent.tsx`
- `hub-shell/src/shell/ProfileEntityFrame.tsx`
- `hub-shell/src/shell/ShellBreadcrumbs.tsx`
- `hub-shell/src/shell/hub-host-context.tsx`
- `hub-shell/src/shell/shell-nav-config.ts`
- `hub-shell/src/shell/shell-paths.ts`
- `hub-shell/src/shell/shell-paths.test.ts`
- `hub-shell/tests/e2e/profile-widgets-smoke.spec.ts`
- `hub-shell/tests/e2e/profile-widgets-restricted.spec.ts`
- `hub-shell/tests/e2e/rbac-matrix.spec.ts`
- `hub-shell/tests/e2e/shell-privileged.spec.ts`
- `tasks/043-aprilhub-sidebar-minimal-profile-list-only/TASK.md`
- `tasks/043-aprilhub-sidebar-minimal-profile-list-only/PLAN.md`
- `tasks/043-aprilhub-sidebar-minimal-profile-list-only/REPORT.md`
- `task_list.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да, откат через revert изменений `hub-shell` и e2e smoke-конфигурации

## 5) Проверка качества
- Линтер: ok
- Сборка: не запускалась отдельно
- Unit tests: ok
- Integration tests: не применялось отдельно
- E2E / smoke: ok (обновлённый набор)

Команды (фактически выполненные):
```bash
npm --prefix hub-shell run lint
npm --prefix hub-shell run test -- --runInBand
npm --prefix hub-shell run test
npm --prefix hub-shell run e2e:smoke
```

## 6) Деплой
- Среда: нет
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md`
- Образы: не применялось
- Health / readiness: не применялось
- Rollback: не применялся

## 7) Риски и ограничения
- Команда `npm --prefix hub-shell run test -- --runInBand` в текущем Vitest-контуре невалидна (`Unknown option --runInBand`), поэтому финальная проверка выполнена через `npm --prefix hub-shell run test`.
- Файлы `profile-widgets-restricted.spec.ts` и `rbac-matrix.spec.ts` сохранены в репозитории, но выведены из обязательного smoke-скрипта из-за зависимости от restricted-персон/стендовых логинов.
- В `widgets.tsx` остаются legacy host-компоненты, но они выведены из активного runtime-пути после упрощения роутинга.

## 8) Что осталось
- [ ] При необходимости отдельной CI-политики restricted/RBAC добавить выделенный job/персоны вместо включения в обязательный smoke.
- [ ] При следующем cleanup-цикле удалить неиспользуемые legacy host-компоненты из `widgets.tsx` и связанных тестов полностью.
