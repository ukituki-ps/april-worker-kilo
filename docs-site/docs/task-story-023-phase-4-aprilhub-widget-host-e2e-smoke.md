---
sidebar_position: 21
---

# Task story 023: AprilHub widget host + e2e smoke

Статус: исполнение задачи из `april-profile-1`, реализация выполнена в `april-worker`.

## Что реализовано

- В `hub-shell` добавлен host-driven composition модуль `Профиль (виджет)` с передачей `hostContext` (`tenant`, `auth`, `telemetry`) в контракте виджета.
- Для виджета подключён путь BFF proxy `/api/v1/admin/profile` и callback `onSaveSuccess` с отображением результата в UI.
- Расширен Playwright smoke (`hub-shell/tests/e2e/smoke.spec.ts`) сценарием: логин -> рендер виджета -> успешное сохранение -> фиксация `onSaveSuccess`.

## Как запускать e2e локально

```bash
./scripts/run-playwright-aprilhub.sh
```

Скрипт поднимает `aprilhub` compose profile, ждёт readiness ingress и запускает `playwright test` в `hub-shell`.

## Ограничения

- До публикации отдельного npm-пакета используется локальная реализация виджета в `hub-shell` с совместимым `hostContext`/`onSaveSuccess` контрактом.
- Playwright smoke для save flow использует сетевой intercept для стабилизации happy-path и проверки host callback.

## Ссылки

- Постановка: `april-profile-1/tasks/023-phase-4-aprilhub-widget-host-e2e-smoke/TASK.md`
- Отчёт (april-worker): `tasks/024-aprilhub-execute-external-task-023-april-profile-1/REPORT.md`
