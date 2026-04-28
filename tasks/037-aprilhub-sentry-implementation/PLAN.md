# План: реализация Sentry и error telemetry в AprilHub

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-25
- **Статус плана:** согласован

## Исходные допущения

- Scope ограничен `april-worker`, в первую очередь `hub-shell`; внедрение в `april-profile-1` не входит в текущую задачу.
- Базовые требования по redaction/filtering уже зафиксированы в `docs/runbooks/APRILHUB_SENTRY_ROLLOUT_PREPARATION.md` и должны быть реализованы в коде без утечки секретов/PII.
- Текущий observability-контур (`Sentry -> Loki -> Prometheus`) и поля корреляции определены в `docs/architecture/ERROR_TELEMETRY_MODEL.md` и `docs/runbooks/APRIL_ERROR_TELEMETRY_TRIAGE.md`.

## Порядок работ (шаги)

1. Добавить инициализацию Sentry в `hub-shell` (env/release/environment/sampling + `beforeSend` redaction + фильтры шумов).
2. Подключить capture для runtime-ошибок:
   - `CompositionErrorBoundary`,
   - глобальные обработчики `window.onerror` и `window.onunhandledrejection`.
3. Реализовать единый telemetry-слой для сетевых запросов (`api.ts`) и подключить его в виджетах/критичных HTTP-вызовах.
4. Прокинуть обязательный контекст (`requestId`, `correlationId`, `tenant`, `route`, `module/widget`) в capture.
5. Обновить документацию задачи и подготовить `REPORT.md`.
6. Прогнать проверки качества (`lint`, `test`, `build`, релевантные smoke/e2e по возможности).

## Затрагиваемые области

| Область | Что меняется (кратко) |
|--------|------------------------|
| Frontend (`hub-shell`) | Sentry SDK init, runtime hooks, HTTP telemetry capture, redaction/filtering |
| Backend (`hub-bff`) | Только верификация тестами (без обязательных кодовых изменений, если не потребуется) |
| БД / Atlas | Нет изменений |
| Инфра / Compose | Без изменений flow, используются env-переменные из подготовленного контура |
| Документация | Обновление task-артефактов (`PLAN.md`, `REPORT.md`), при необходимости runbook/index ссылок |

## Риски и откат

- **Риск:** избыточный шум в Sentry из-за ожидаемых клиентских ошибок.
  - **Митигация:** фильтрация extension noise, `AbortError`, ожидаемых кейсов авторизации и повторяющихся статусов.
- **Риск:** попадание чувствительных данных в telemetry.
  - **Митигация:** deny-list редактирование заголовков/payload до отправки в Sentry.
- **Откат:** отключить Sentry через пустой `SENTRY_DSN` и вернуть изменения PR/revert в `hub-shell`.

## Проверка после выполнения

- `cd hub-shell && npm run lint && npm run test && npm run build`
- `cd hub-bff && go test ./...`
- `./scripts/smoke-aprilhub.sh`
- `./scripts/run-playwright-aprilhub.sh`

## Примечания

- Связанные задачи: `033`, `034`, `035`.
- При смене scope (например, кодовые правки в `hub-bff`) план должен быть актуализирован перед завершением работы.
