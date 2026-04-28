# Задача 035: подготовка внедрения Sentry в AprilHub (`april-worker`)

## Мета
- **ID / ветка:** `035-aprilhub-sentry-rollout-preparation`
- **Приоритет:** высокий
- **Связанные документы:**
  - результаты `033` и `034`
  - [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
  - [`docs/guides/OBSERVABILITY_INDEX.md`](../../docs/guides/OBSERVABILITY_INDEX.md)
  - [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md)
  - `hub-shell` и `hub-bff` env templates / compose-конфиги

## Цель
Подготовить безопасный и воспроизводимый rollout-пакет для включения Sentry в AprilHub: env-контур, redaction policy, правила sampling, runbook запуска/отката, критерии готовности к реализации.

## Контекст для агента
- Реализация будет отдельной задачей (`037`), сейчас нужен подготовительный этап без функциональных правок бизнес-логики.
- Контур должен учитывать текущую роль `april-worker` как источника observability baseline в экосистеме.

## Входит в объём
- Определить обязательные env-переменные и добавить их в `.env.example`/документацию:
  - `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE`,
  - `SENTRY_TRACES_SAMPLE_RATE`, `SENTRY_REPLAYS_SESSION_SAMPLE_RATE`, `SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE` (если используется replay).
- Подготовить политику маскирования/редакции чувствительных данных для frontend payload.
- Описать правила event filtering (игнорируемый шум, сетевые ошибки без действия, browser extension noise).
- Обновить runbook внедрения: шаги включения, smoke-check, rollback, ownership.
- Подготовить checklist для PR реализации (`037`): какие тесты, какие скриншоты/артефакты, какие метрики стабилизации.

## Не входит в объём
- Подключение SDK и изменение runtime-кода.
- Подключение Sentry в `april-profile-1`.
- Настройка production секретов в реальных окружениях.

## Технические ограничения
- Никаких реальных DSN в репозитории.
- Не ломать текущий compose/deploy flow.
- Документация должна быть пригодна для локального стенда и CI.

## Критерии готовности (acceptance)
- [x] Определён и задокументирован env-контур для Sentry в AprilHub.
- [x] Зафиксирована redaction/filtering политика для frontend ошибок.
- [x] Подготовлен runbook rollout/rollback и smoke-проверок.
- [x] Сформирован implementation checklist для задачи `037`.
- [x] Создан `REPORT.md` с готовыми артефактами к реализации.

## Проверка (команды)
```bash
# Проверка валидности шаблонов env и ссылок в документации.
# Smoke dry-run команд из runbook (без реального DSN).
```

## Результат в отчёте
- Какие env/документы обновлены.
- Какие риски устранены на этапе подготовки.
- Что остаётся сделать в задаче `037`.
