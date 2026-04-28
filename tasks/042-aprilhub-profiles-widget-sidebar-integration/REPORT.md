## 1) Итого
- Статус: ⚠️ частично
- Задача: Интеграция внешнего `profiles-widget` в сайдбар AprilHub
- Ветка: `feature/aprilhub-implementation`
- Коммиты: не создавались
- PR: не создавался

## 2) Что сделано
- [frontend] Подключён внешний пакет `@april/profile-ui` в `hub-shell` (через `file:`-зависимость на `april-profile-1`).
- [frontend] Для runtime-подключения добавлен локальный adapter-модуль `hub-shell/src/vendor/april-profile-ui.tsx` и alias `@april/profile-ui` -> этот модуль (совместимая точка интеграции для текущего контейнерного контура).
- [frontend] `ProfilesListHostWidget` в `hub-shell/src/widgets.tsx` переведён на внешний `ProfilesWidget` c host-обвязкой:
  - `hostContext` (`tenant/auth/telemetry`),
  - `accessToken` из Keycloak,
  - `apiBaseUrl=/api/v1/admin/profile/api`,
  - host callbacks `onAction` / `onError`, toast + error-state.
- [frontend] Legacy runtime-реализация списка профилей (локальная CRUD-логика в `ProfilesListHostWidget`) удалена.
- [frontend/e2e] Обновлены Playwright-сценарии для раздела `Профиль — список` под внешний виджет и сайдбарный smoke-путь.
- [frontend/e2e] Обязательный smoke по сайдбару (`Профиль — список`) прогнан в целевом виде: маршрут + ожидаемый рендер + error-state.
- [docs] Созданы `PLAN.md` и текущий `REPORT.md` для задачи `042`.

## 3) Изменённые файлы
- `hub-shell/package.json`
- `hub-shell/package-lock.json`
- `hub-shell/vite.config.ts`
- `hub-shell/tsconfig.json`
- `hub-shell/src/widgets.tsx`
- `hub-shell/src/vendor/april-profile-ui.tsx`
- `hub-shell/tests/e2e/profile-widgets-smoke.spec.ts`
- `hub-shell/tests/e2e/profile-widgets-crud-and-errors.spec.ts`
- `hub-shell/tests/e2e/profile-widgets-integration.spec.ts`
- `hub-shell/tests/e2e/profile-widgets-restricted.spec.ts`
- `tasks/042-aprilhub-profiles-widget-sidebar-integration/TASK.md`
- `tasks/042-aprilhub-profiles-widget-sidebar-integration/PLAN.md`
- `tasks/042-aprilhub-profiles-widget-sidebar-integration/REPORT.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да, revert изменений `hub-shell` и e2e-спеков

## 5) Проверка качества
- Линтер: ok
- Сборка: не запускалась отдельно (проверка типов пройдена через `lint`)
- Unit tests: ok
- Integration tests: частично (`profile-widgets-integration` точечный тест пройден; полный набор не прогонялся зелёно целиком)
- E2E / smoke: частично (обязательный сайдбарный smoke пройден; полный `e2e:smoke` в текущем окружении остаётся нестабильным)

Команды (фактически выполненные):
```bash
npm --prefix /home/ukituki/april-worker/hub-shell install
npm --prefix /home/ukituki/april-worker/hub-shell install --package-lock-only
npm --prefix /home/ukituki/april-worker/hub-shell run lint
npm --prefix /home/ukituki/april-worker/hub-shell run test
npm --prefix /home/ukituki/april-worker/hub-shell run e2e:smoke
npm --prefix /home/ukituki/april-worker/hub-shell run e2e -- tests/e2e/profile-widgets-smoke.spec.ts tests/e2e/profile-widgets-crud-and-errors.spec.ts tests/e2e/profile-widgets-integration.spec.ts tests/e2e/profile-widgets-restricted.spec.ts
npm --prefix /home/ukituki/april-worker/hub-shell run e2e -- tests/e2e/profile-widgets-crud-and-errors.spec.ts -g "список профилей: загрузка через внешний profiles-widget" --workers=1 --reporter=line
npm --prefix /home/ukituki/april-worker/hub-shell run e2e -- tests/e2e/profile-widgets-integration.spec.ts -g "карточка профиля: сохранение идёт в реальный BFF" --workers=1 --reporter=line
npm --prefix /home/ukituki/april-worker/hub-shell run e2e -- tests/e2e/profile-widgets-smoke.spec.ts -g "сайдбар: Профиль — список" --workers=1 --reporter=line
```

## 6) Деплой
- Среда: нет
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md`
- Образы: не применялось
- Health / readiness: не применялось
- Rollback: не применялся

## 7) Риски и ограничения
- `npm install` в `hub-shell` падает по правам файловой системы (`EACCES` в `node_modules`), поэтому использовался режим `--package-lock-only`.
- В контейнерном контуре `/workspace` не виден путь до sibling-репозитория `april-profile-1`, поэтому прямой alias на внешние исходники ломал Vite-resolve; применён локальный adapter-модуль как временная совместимая мера.
- Полный `e2e:smoke` и restricted-сценарии могут быть нестабильны из-за зависимостей окружения (OIDC/персоны/стенд).

## 8) Что осталось
- [ ] Допрогнать полный обязательный `npm --prefix hub-shell run e2e:smoke` в стабильном контуре (включая restricted-персону) и зафиксировать общий зелёный результат.
- [ ] Перейти с локального adapter-модуля на прямую поставку внешнего `@april/profile-ui` (registry/доступный dist) без fallback-слоя.
