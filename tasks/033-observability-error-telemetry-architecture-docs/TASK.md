# Задача 033: наблюдаемость ошибок фронтенда/API — архитектура и документация (AprilHub + AprilProfile)

## Мета
- **ID / ветка:** `033-observability-error-telemetry-architecture-docs`
- **Приоритет:** высокий
- **Связанные документы:**
  - [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](../../docs/AGENT_ARCHITECTURE_CONTEXT.md)
  - [`docs/FRONTEND_STRATEGY.md`](../../docs/FRONTEND_STRATEGY.md)
  - [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md)
  - [`docs/guides/OBSERVABILITY_INDEX.md`](../../docs/guides/OBSERVABILITY_INDEX.md)
  - [`docs/guides/OBSERVABILITY_MULTI_STAND_OPERATING_MODEL.md`](../../docs/guides/OBSERVABILITY_MULTI_STAND_OPERATING_MODEL.md)
  - [`docs/architecture/INTEGRATION_CONTRACTS.md`](../../docs/architecture/INTEGRATION_CONTRACTS.md)
  - `april-profile-1/docs/*` (архитектура/observability/runbooks в целевом внешнем репозитории)

## Цель
Зафиксировать единое архитектурное решение по обработке и корреляции ошибок `400/404/503` и frontend runtime-ошибок (React error boundary, `unhandledrejection`) в контурах AprilHub и AprilProfile: где ловим, куда отправляем, как связываем события между Sentry и Loki/Grafana, как действуем при инцидентах.

## Контекст для агента
- В `hub-shell` уже есть `CompositionErrorBoundary`, но логирование локальное (`console.error`) без централизованной отправки.
- В `hub-bff` уже есть access-лог и метрики Prometheus (`hub_bff_http_requests_total`, `hub_bff_auth_errors_total`), а также существующий observability-контур Promtail/Loki/Grafana.
- Нужно выбрать модель: Sentry как frontend runtime incident-layer + существующий Loki/Prometheus как операционный слой.

## Входит в объём
- Обновить архитектурные документы и интеграционные контракты в `april-worker` с явной моделью:
  - источники ошибок (frontend/backend/downstream),
  - обязательные поля корреляции (`requestId`, `correlationId`, `tenant`, `route`, `module/widget`),
  - политика redaction/PII.
- Добавить/обновить runbook по triage-инцидентам с цепочкой "Sentry issue -> Loki logs -> Prometheus alert -> root cause".
- Зафиксировать границы ответственности между AprilHub (host) и AprilProfile (domain backend/widget).
- Синхронизировать требования для зеркального обновления в `april-profile-1` (отдельный PR/задача).

## Не входит в объём
- Реализация SDK и кода интеграции в приложениях.
- Настройка production DSN/секретов и релиз инфраструктуры.
- Полная замена текущего стека observability.

## Технические ограничения
- Не ломать существующие C4/ADR/OpenAPI связи; изменения документов должны быть согласованными.
- Не коммитить реальные DSN и секреты.
- Сохранять текущий источник правды по инфраструктурной наблюдаемости в `infra/observability/`.

## Критерии готовности (acceptance)
- [ ] В `april-worker` зафиксирован архитектурный документ/раздел по error telemetry (Sentry + Loki/Prometheus).
- [ ] Обновлены интеграционные документы host/widget и observability index с разделом о корреляции ошибок.
- [ ] Добавлен/обновлён runbook triage с шагами анализа инцидента.
- [ ] Подготовлен список зеркальных изменений для `april-profile-1` (артефакты и ожидаемые точки обновления).
- [ ] Создан `REPORT.md` с перечнем обновлённых документов и открытых рисков.

## Проверка (команды)
```bash
# Проверка ссылок/структуры docs по принятому процессу репозитория.
# При наличии скриптов линтинга документации — выполнить релевантные.
```

## Результат в отчёте
- Какие документы и разделы обновлены в `april-worker`.
- Какие изменения должны быть применены в `april-profile-1`.
- Какие архитектурные допущения и риски остались.
