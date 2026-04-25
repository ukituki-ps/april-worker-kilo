# Задача 036: подготовка внедрения Sentry в AprilProfile (`april-profile-1`, внешняя)

## Мета
- **ID / ветка:** `036-aprilprofile-sentry-rollout-preparation`
- **Приоритет:** высокий
- **Тип:** [внешний репозиторий]
- **Связанные документы:**
  - результаты `033` и `034`
  - `april-profile-1/docs/*` (observability, deployment, testing, agent docs)
  - `april-profile-1/tasks/<NNN-sentry-prep>/TASK.md` (создаётся в целевом репозитории)

## Цель
Подготовить во внешнем репозитории `april-profile-1` отдельный подготовительный контур для Sentry (env, redaction policy, runbook, ownership), синхронный с архитектурным решением AprilHub, но с учётом доменной специфики AprilProfile.

## Контекст для агента
- Эта задача исполняется в связке с `april-profile-1`.
- В `april-worker` нужен трекинг и дублирование отчёта, чтобы сохранить сквозную видимость межрепозиторных изменений.

## Входит в объём
- Завести внешнюю задачу в `april-profile-1` на подготовительный этап Sentry (без runtime-реализации).
- Согласовать и описать env-набор AprilProfile (frontend/backend, если применимо).
- Согласовать PII redaction и filtering policy с данными профиля (повышенные требования к персональным данным).
- Подготовить runbook внедрения/отката в `april-profile-1`.
- Сформировать checklist для реализации (будущая задача `038` в текущем трекере и соответствующая внешняя задача).
- Зафиксировать cross-repo зависимости: какие данные/теги должны совпадать с AprilHub для совместного triage.

## Не входит в объём
- Изменения runtime-кода AprilProfile.
- Изменения runtime-кода AprilHub.

## Технические ограничения
- Секреты не хранятся в git.
- Должен быть явный двойной отчёт: внешний (`april-profile-1`) и локальный (`april-worker/tasks/036.../REPORT.md`).
- Не вводить несовместимые с AprilHub соглашения по `requestId/correlationId`.

## Критерии готовности (acceptance)
- [x] Во внешнем репозитории создана и согласована задача подготовки Sentry для AprilProfile.
- [x] Подготовлены env/redaction/runbook артефакты AprilProfile.
- [x] Определены cross-repo поля корреляции и ownership.
- [x] В `april-worker` зафиксирован дублирующий отчёт (`tasks/036-aprilprofile-sentry-rollout-preparation/REPORT.md`); внешний PR не создавался (документационный prep-only scope).

## Проверка (команды)
```bash
# Проверки и команды выполняются в april-profile-1 по его workflow.
# В этом репозитории фиксируются ссылки и итоговый статус.
```

## Результат в отчёте
- Ссылка на внешнюю задачу/PR в `april-profile-1`.
- Какие подготовительные артефакты готовы.
- Что остаётся к реализации в задаче `038`.
