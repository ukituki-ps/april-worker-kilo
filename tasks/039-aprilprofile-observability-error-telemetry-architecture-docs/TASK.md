# Задача 039: аналог задачи 033 для AprilProfile — архитектура и документация error telemetry

## Мета
- **ID / ветка:** `039-aprilprofile-observability-error-telemetry-architecture-docs`
- **Приоритет:** высокий
- **Тип:** [внешний репозиторий]
- **Связанные документы:**
  - [`tasks/033-observability-error-telemetry-architecture-docs/TASK.md`](../033-observability-error-telemetry-architecture-docs/TASK.md)
  - `april-profile-1/docs/*` (архитектура, observability, deployment, testing)
  - `april-profile-1/tasks/<NNN-error-telemetry-arch>/TASK.md` (создаётся в целевом репозитории)
  - документы интеграции AprilHub <-> AprilProfile (контракты/telemetry поля)

## Цель
Подготовить во внешнем репозитории `april-profile-1` отдельное архитектурное и документационное решение по обработке и корреляции ошибок (`400/404/503`, runtime/UI-ошибки), синхронное с подходом AprilHub, но с доменной спецификой AprilProfile и требованиями к данным профиля.

## Контекст для агента
- Это зеркальная задача к `033`, но исполняется в контуре `april-profile-1`.
- В `april-worker` требуется сохранить трекинг и дублирующий отчёт (cross-repo видимость).
- Необходимо согласовать единые поля корреляции (`requestId`, `correlationId`, `tenant`, `route`, `module`) между репозиториями.

## Входит в объём
- Создать/обновить архитектурные документы в `april-profile-1` по error telemetry:
  - источники ошибок (frontend/backend/downstream),
  - каналы сбора (Sentry + Loki/Prometheus),
  - правила корреляции и incident flow.
- Зафиксировать redaction/PII policy для доменных payload AprilProfile.
- Добавить/обновить runbook triage-инцидентов в `april-profile-1`.
- Зафиксировать cross-repo контракты наблюдаемости с AprilHub.
- Подготовить дублирующий отчёт в `april-worker/tasks/039.../REPORT.md` со ссылками на внешний PR/коммиты.

## Не входит в объём
- Runtime-реализация SDK и кодовых интеграций (это отдельные задачи реализации).
- Настройка production секретов и реального DSN.
- Изменения бизнес-функционала профиля, не связанные с наблюдаемостью.

## Технические ограничения
- Секреты не коммитить.
- Не вводить несовместимые с AprilHub поля корреляции.
- Изменения должны быть согласованы с существующей архитектурной документацией `april-profile-1`.

## Критерии готовности (acceptance)
- [ ] Во внешнем репозитории создана и согласована архитектурная задача/документация по error telemetry (аналог `033`).
- [ ] В `april-profile-1` зафиксирован incident flow `Sentry -> Loki/Grafana -> root cause`.
- [ ] В `april-profile-1` утверждена redaction/PII политика для error events.
- [ ] Согласованы cross-repo поля корреляции с AprilHub.
- [ ] В `april-worker` оформлен дублирующий `REPORT.md` со ссылками на внешний PR/коммиты.

## Проверка (команды)
```bash
# Проверки выполняются в april-profile-1 по его workflow документации.
# В этом репозитории фиксируются ссылки и итоговый статус.
```

## Результат в отчёте
- Ссылки на внешнюю задачу/PR и обновлённые документы в `april-profile-1`.
- Список согласованных полей и правил корреляции с AprilHub.
- Риски, ограничения и follow-up по реализации.
