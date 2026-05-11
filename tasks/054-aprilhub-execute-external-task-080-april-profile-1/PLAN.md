# План: задача 054 / внешняя 080 — mobile chrome Hub + bump vendor + e2e

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-05-10
- **Статус плана:** согласован

## Исходные допущения

- Норматив: ADR-0006 и [`docs/WIDGET_INTEGRATION_CHECKLIST.md`](../../vendor/april-profile/docs/WIDGET_INTEGRATION_CHECKLIST.md) (копия в vendored `april-profile` на момент bump).
- Задача **079** в upstream `april-profile` может быть не закрыта полностью; минимально нужны актуальные виджеты + согласованный проброс пропсов для host-интеграции.
- DS `@april/ui` для Hub — канал GPR (`^0.1.9`), как в **053**; локальный `npm ci` без `read:packages` может быть недоступен — валидация через CI.

## Порядок работ (шаги)

1. Прочитать внешнюю **080**, ADR-0006, чеклист интеграции (mobile chrome).
2. Обновить `vendor/april-profile` на согласованный коммит `develop` + исправить проброс пропсов `ProfilesApiWidget` → `ProfilesWidgetCore` (иначе host не может задать `cardListColumnMobileLayout`).
3. Реализовать в `hub-shell` глобальный mobile dock (`AprilMobileShellBar`, `position="fixed"`) и скрытие десктопного сайдбара на `(max-width: 47.99em)`; отступ контента через `aprilMobileShellBarContentPaddingBottom()`.
4. На узком viewport передавать в `ProfilesWidget` `cardListColumnMobileLayout="off"`, чтобы не дублировать нижнюю капсулу со списком (стратегия A / чеклист).
5. Playwright: проект `mobile-chromium` для `profile-widgets-smoke.spec.ts`; поднять toast над панелью в CSS.
6. Отчёты: `tasks/054-.../REPORT.md` и зеркало во `vendor/april-profile/tasks/080-.../REPORT.md`; при необходимости push фикса profile-ui в upstream `april-profile` отдельным PR.

## Затрагиваемые области

| Область | Что меняется (кратко) |
|--------|------------------------|
| Frontend (`hub-shell`) | `AppShell`, dock, отступы, интеграция виджета, Playwright |
| Vendor (`april-profile`) | `ProfilesApiWidget.tsx`, submodule ref |
| Документация задачи | `PLAN.md`, `REPORT.md` |

## Риски и откат

- **Риск:** локальный gate без GPR-токена → **Митигация:** CI self-hosted с `NODE_AUTH_TOKEN` / `GPR_READ_TOKEN`.
- **Риск:** коммит только в локальном submodule — **Митигация:** открыть PR в `april-profile` с тем же патчем `ProfilesApiWidget`.
- Откат: убрать dock и вернуть `cardListColumnMobileLayout` по умолчанию у host; откатить submodule.

## Проверка после выполнения

- `make openapi-lint`, `cd hub-bff && go test ./...`
- `cd hub-shell && npm ci && npm run lint && npm run test && npm run build`
- `cd hub-shell && npm run e2e -- --project=mobile-chromium`

## Примечания

- Зависимость **079**: зафиксировано в `REPORT.md` (статус на момент выполнения).
