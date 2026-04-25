# Задача 037: реализация Sentry и error telemetry в AprilHub (`april-worker`)

## Мета
- **ID / ветка:** `037-aprilhub-sentry-implementation`
- **Приоритет:** высокий
- **Связанные документы:**
  - результаты `033`, `034`, `035`
  - [`docs/FRONTEND_STRATEGY.md`](../../docs/FRONTEND_STRATEGY.md)
  - [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md)
  - [`docs/guides/OBSERVABILITY_INDEX.md`](../../docs/guides/OBSERVABILITY_INDEX.md)
  - `hub-shell/src/composition-error-boundary.tsx`, `hub-shell/src/api.ts`, `hub-shell/src/widgets.tsx`

## Цель
Реализовать в `april-worker` рабочий контур сбора и анализа frontend/runtime и HTTP-ошибок через Sentry с корреляцией к текущему observability-стеку (Loki/Prometheus/Grafana), чтобы инциденты `400/404/503` и падения React-компонентов были воспроизводимыми и трассируемыми.

## Контекст для агента
- В текущем коде boundary уже есть, но ошибки не централизуются.
- Много `fetch` вызовов в виджетах; нужен единый механизм сбора статусов/ошибок и контекста.
- Интеграция должна быть совместима с ролью host для виджетов AprilProfile.

## Входит в объём
- Подключить Sentry SDK в `hub-shell` (инициализация, environment/release/tags).
- Интегрировать capture в:
  - `CompositionErrorBoundary` (`componentDidCatch`),
  - глобальные обработчики `window.onerror` и `window.onunhandledrejection`,
  - единый сетевой слой (`apiRequest`/обёртка `fetch`) для capture `4xx/5xx` по правилам.
- Передавать обязательный контекст: `requestId`, `correlationId`, `tenant`, `route`, `moduleName/widget`.
- Реализовать filtering/redaction в соответствии с задачей `035`.
- Обновить пользовательский UX ошибок без раскрытия чувствительных данных.
- Добавить/обновить тесты и e2e проверки критичного пути ошибки.
- Обновить документацию внедрения и диагностики.

## Не входит в объём
- Полное переписывание всей API-обвязки, если это не нужно для capture.
- Внедрение Sentry в `april-profile-1` (это `038`).
- Массовое добавление performance tracing, если не требуется для текущего инцидентного сценария.

## Технические ограничения
- Не отправлять токены и секреты в Sentry.
- Не нарушать существующие контракты host/widget.
- Не ломать текущие smoke/e2e сценарии.

## Критерии готовности (acceptance)
- [x] Ошибки `ErrorBoundary`, `window.onerror`, `unhandledrejection` уходят в Sentry с нужными tag/context.
- [x] HTTP ошибки `400/404/503` фиксируются в едином error telemetry слое с маршрутом/виджетом/корреляцией.
- [x] Redaction/filtering применяются и проверены.
- [x] Документация по triage и runbook обновлены.
- [ ] Релевантные тесты и проверки зелёные; артефакты приложены в `REPORT.md` (Playwright blocked: ingress `502` в локальном compose-контуре).

## Проверка (команды)
```bash
cd hub-shell && npm run lint && npm run test && npm run build
cd hub-bff && go test ./...
./scripts/smoke-aprilhub.sh
./scripts/run-playwright-aprilhub.sh
```

## Результат в отчёте
- Список изменений в `hub-shell`/`hub-bff`.
- Какие типы ошибок теперь наблюдаемы и как их расследовать.
- Какие ограничения и follow-up остались.
