# Задача: Hub Testing Contour Extensions (Этап 020)

## Мета
- **ID / ветка:** `020-hub-testing-contour-extensions`
- **Приоритет:** средний
- **Связанные документы:** `task_list.md`, `tasks/019-hub-testing-contour-finalization/TASK.md`, `tasks/019-hub-testing-contour-finalization/PLAN.md`, `docs/TESTING_STRATEGY.md`, `.github/workflows/ci.yml`, `hub-shell/package.json`, `hub-bff/go.mod`, `docs/DEPLOYMENT_STRATEGY.md`

## Цель
Реализовать расширения тестового контура уровня P1/P2 после закрытия обязательного P0-gate: добавить Playwright smoke E2E набор, integration-suite для `hub-bff` с Testcontainers/Atlas, а также операционные улучшения (nightly extended load и метрики качества pipeline).

## Контекст для агента
- Этап `019` закрывает mandatory testing gate (CI/local, docs sync, runbook triage).
- Этап `020` выносит "хорошо бы сделать" из `019` в самостоятельный roadmap блок, чтобы не смешивать release-blocking и улучшения зрелости.
- По `docs/TESTING_STRATEGY.md` Playwright и integration-контур соответствуют целевой модели и должны быть реализованы поэтапно.

## Входит в объём
- P1: добавить минимальный Playwright smoke-набор критических пользовательских сценариев.
- P1: добавить integration-suite для `hub-bff` с использованием Testcontainers; для миграций БД использовать Atlas-процесс проекта.
- P2: добавить extended load профиль (nightly/scheduled) поверх существующего baseline k6.
- P2: зафиксировать минимальные метрики качества тестового pipeline (длительность, флаки, частота ретраев/падений) и правила наблюдения.
- Обновить task- и проектную документацию по новым слоям тестирования.

## Не входит в объём
- Полный регресс UI на десятки Playwright-сценариев.
- Production capacity planning и долгие soak/chaos тесты.
- Существенный рефакторинг runtime-кода ради достижения coverage-метрик.

## Технические ограничения
- Следовать `docs/TESTING_STRATEGY.md`; не дублировать источники истины по правилам тестирования.
- Не коммитить секреты/токены; использовать env-подходы и тестовые аккаунты по процессу проекта.
- Интеграционные тесты с БД выполнять через согласованный migration-путь (Atlas), без обходных SQL-механик.
- Сохранить совместимость с `docs/DEPLOYMENT_STRATEGY.md` и текущим CI-гейтом.

## Критерии готовности (acceptance)
- [ ] Добавлен Playwright smoke-набор (минимум 2-3 критических сценария) с понятной командой запуска.
- [ ] Playwright-прогоны формируют полезные артефакты при падениях (trace/screenshot и/или video).
- [ ] Добавлен integration-suite `hub-bff` с Testcontainers и миграционным потоком через Atlas.
- [ ] Для integration-suite описаны запуск, ограничения и критерии pass/fail.
- [ ] Добавлен extended load профиль k6 (nightly/scheduled) отдельно от PR baseline.
- [ ] Зафиксированы и документированы минимальные quality-метрики тестового pipeline.
- [ ] Обновлены `PLAN.md`/`REPORT.md` этапа `020` и `task_list.md`.

## Проверка (команды, целевые)
```bash
# Playwright smoke
cd hub-shell && npm run e2e

# hub-bff integration suite (уточнить по реализации)
cd hub-bff && go test ./... -run Integration

# extended load profile (nightly-ready)
./scripts/run-k6-aprilhub-extended.sh
```

## Результат в отчёте
После выполнения оформить `REPORT.md`: какие P1/P2-слои внедрены, какие команды и CI/scheduled jobs добавлены, какие ограничения и follow-up остаются.
