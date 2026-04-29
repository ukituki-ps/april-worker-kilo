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
- `hub-shell/scripts/ds-prepare.sh`
- `hub-shell/tests/e2e/shell-privileged.spec.ts`
- `hub-shell/tests/e2e/profile-widgets-smoke.spec.ts`
- `tasks/045-aprilhub-sidebar-profiles-widget-section/PLAN.md`
- `tasks/045-aprilhub-sidebar-profiles-widget-section/REPORT.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да (revert frontend/docs изменений)

## 5) Проверка качества
- Линтер: ok (`npm --prefix hub-shell run lint`)
- Сборка: ok (`npm --prefix hub-shell run build`)
- Unit tests: ok (исторический прогон в рамках задачи)
- Integration tests: ok (исторический прогон в составе `vitest run`)
- E2E / smoke: fail (многочисленные таймауты Playwright, прогон прерван после серии падений)

Команды (фактически выполненные):
```bash
npm --prefix hub-shell install --package-lock-only
npm --prefix hub-shell run lint
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
- `e2e:smoke` не завершён успешно из-за стендовых таймаутов (упали guest/privileged/profile-widgets smoke); перед merge нужен зелёный прогон smoke.

## 8) Что осталось
- [ ] Повторно прогнать `npm --prefix hub-shell run e2e:smoke` на стабильном dev-стенде и зафиксировать успешный результат.
- [ ] Добавить в incident артефакты из Sentry (issue URL + теги корреляции), как только будет доступ к проекту.
- [ ] Создать PR с test plan и рисками после успешного smoke.

## 9) Incident triage (белый экран `dev.april.ukituki.tech`)
- Инцидент: белый экран на `https://dev.april.ukituki.tech/` (окружение `dev`), фронтенд runtime crash до отрисовки.
- Корреляция: route `/`; `requestId`/`correlationId`/`tenant`/роль Keycloak в публичном доступе не получены (экран падает до прикладного API-взаимодействия).
- Sentry: прямой доступ к issue отсутствует в текущем контуре (нужны доступы к проекту Sentry/issue URL), но runtime-симптом воспроизведён через Playwright.
- Loki/Prometheus: через `dev.april.ukituki.tech` observability-endpoint'ы действительно уходят в Vite fallback, но прямой central доступ работает: `http://192.168.1.29:3100` (Loki) и `http://192.168.1.29:9090` (Prometheus).
- Loki (30m): зафиксированы ошибки `hub-shell` уровня dev-server (`[vite] Pre-transform error: ENOENT ... @vitejs/plugin-react/dist/refresh-runtime.js`), а также HMR события; прямых backend request-correlated ошибок по `requestId`/`correlationId` в рамках этого инцидента не выявлено.
- Prometheus: активен алерт `AprilHubTargetDown` для `instance=192.168.1.42:8081` (`up=0`), при этом локальный target `192.168.1.29:8081` остаётся `up=1`.
- Prometheus (HTTP rate): в `hub_bff_http_requests_total` видна базовая активность `200` и единичные `404`, а явного всплеска `5xx` в окне triage не зафиксировано.
- Наблюдения frontend: `PAGEERROR The requested module '/@fs/workspace/design-system/DisignApril/packages/ui/dist/index.js?...' does not provide an export named 'CardListColumn'`.
- Root cause classification: **frontend runtime integration defect** (рассинхронизация артефактов `@april/ui`: внешний `ProfilesWidget` ожидает экспорт `CardListColumn`, а установленный runtime-пакет мог не содержать актуальный `dist`).
- Исправление: в `hub-shell/scripts/ds-prepare.sh` добавлена принудительная синхронизация `@april/ui` из `design-system/DisignApril/packages/ui/dist` в `hub-shell/node_modules/@april/ui` (с безопасными skip-ветками для read-only и symlink-сценариев), чтобы исключить stale-артефакты перед `dev/build/test`.
- Верификация: `npm --prefix hub-shell run ds:prepare`, `npm --prefix hub-shell run lint`, `npm --prefix hub-shell run build` — `ok`; экспорт `CardListColumn` присутствует в `design-system/.../packages/ui/dist/index.js`.

## 10) Incident triage (повтор, export `CardListColumn`)
- Инцидент: повторный frontend runtime crash в `dev` на маршруте авторизованного shell (`ProfilesListHostWidget`), окно triage `2026-04-29`.
- Корреляция: из предоставленного stacktrace доступны `route`/`module` (`ProfilesWidget`), но `requestId`/`correlationId`/`tenant`/`roleSet` и Sentry issue URL в инциденте отсутствуют (падение на этапе module import до прикладного API).
- Sentry: зафиксирован runtime `SyntaxError` (`does not provide an export named 'CardListColumn'`) с деревом компонентов под `CompositionErrorBoundary`; release/tag-данные не приложены.
- Loki: по `service=hub-shell` за 6h прямых записей с `does not provide an export named` и `CardListColumn` не найдено (ошибка клиентская, в браузерном runtime и не всегда попадает в server logs).
- Prometheus: активен `AprilHubTargetDown` для `192.168.1.42:8081`, но паттерн не коррелирует с конкретным импорт-ошибочным сценарием виджета.
- Классификация: **UI/runtime defect**, owner: AprilHub frontend integration + DisignApril build artifacts.
- Изменения: в `hub-shell/scripts/ds-prepare.sh` добавлена проверка экспортов runtime-бандла `@april/ui` и auto-rebuild (`pnpm exec tsup --dts false`), если в `dist/index.js` отсутствует `CardListColumn`.
- Верификация: `npm --prefix hub-shell run ds:prepare`, `npm --prefix hub-shell run lint`, `npm --prefix hub-shell run build` — `ok`; сборка формирует chunk `april-profile-ui-*.js`.
