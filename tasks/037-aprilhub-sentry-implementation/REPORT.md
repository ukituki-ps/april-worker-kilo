## 1) Итого
- Статус: ⚠️ частично
- Задача: реализация Sentry и error telemetry в AprilHub (`hub-shell`/`hub-bff`)
- Ветка: `feature/034-agent-error-triage-master-prompt`
- Коммиты: не создавались
- PR: не создавался

## 2) Что сделано
- [frontend] Добавлен Sentry runtime-layer в `hub-shell`: инициализация SDK, global handlers (`window.onerror`, `unhandledrejection`), контекстные теги и redaction/filtering policy.
- [frontend] Подключён capture в `CompositionErrorBoundary` и прокинуты `tenant/correlationId` из host context.
- [frontend] Реализован единый HTTP telemetry-слой в `api.ts` с capture статусов `400/404/503/5xx`, автоматическим retry при `401` и прокидкой correlation headers.
- [frontend] Вызовы `fetch` в host-виджетах/профильном виджете переведены на единый авторизованный telemetry-wrapper.
- [frontend] Добавлено покрытие `api.test.ts` для capture HTTP telemetry (`404`).
- [docs] Обновлён runbook `docs/runbooks/APRILHUB_SENTRY_ROLLOUT_PREPARATION.md` секцией runtime mapping для задачи `037`.
- [tasks] Созданы `PLAN.md` и `REPORT.md` для задачи `037`, обновлён статус acceptance в `TASK.md`.

## 3) Изменённые файлы
- `hub-shell/package.json`
- `hub-shell/package-lock.json`
- `hub-shell/vite.config.ts`
- `hub-shell/src/sentry.ts`
- `hub-shell/src/main.tsx`
- `hub-shell/src/App.tsx`
- `hub-shell/src/api.ts`
- `hub-shell/src/api.test.ts`
- `hub-shell/src/composition-error-boundary.tsx`
- `hub-shell/src/composition-layer.tsx`
- `hub-shell/src/widgets.tsx`
- `hub-shell/src/profile-widget.tsx`
- `hub-shell/src/vite-env.d.ts`
- `docs/runbooks/APRILHUB_SENTRY_ROLLOUT_PREPARATION.md`
- `tasks/037-aprilhub-sentry-implementation/PLAN.md`
- `tasks/037-aprilhub-sentry-implementation/TASK.md`
- `tasks/037-aprilhub-sentry-implementation/REPORT.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да; rollback через отключение `SENTRY_DSN` и/или revert изменений `hub-shell`

## 5) Проверка качества
- Линтер: ok
- Сборка: ok
- Unit tests: ok
- Integration tests: ok (`hub-bff go test ./...`)
- E2E / smoke: частично (`smoke-aprilhub.sh` ok, Playwright blocked локальным ingress `502`)

Команды (фактически выполненные):
```bash
cd hub-shell && npm install @sentry/react
cd hub-shell && npm run lint && npm run test && npm run build
cd hub-bff && go test ./...
./scripts/smoke-aprilhub.sh
./scripts/run-playwright-aprilhub.sh
DOCS_HTTP_PORT=18080 PLAYWRIGHT_BASE_URL=http://localhost:18080 ./scripts/run-playwright-aprilhub.sh
docker compose -p aprilhub-playwright --profile aprilhub down -v
```

## 6) Деплой
- Среда: нет
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md`
- Образы: не применялось
- Health / readiness: проверен smoke через существующий ingress (`/healthz`) в локальном контуре
- Rollback: не применялся

## 7) Риски и ограничения
- Playwright regression suite не завершился из-за проблем локального compose ingress (`502/504`) в тестовом контуре, поэтому e2e gate остаётся открытым.
- Корреляция `Sentry -> Loki -> Prometheus` требует проверки на dev-стенде с реальным `SENTRY_DSN` и тестовым инцидентом.
- Для production rollout нужно согласовать финальные значения sampling после первых 24-72 часов наблюдения.

## 8) Что осталось
- [ ] Прогнать `./scripts/run-playwright-aprilhub.sh` в стабильном локальном/dev-контуре без `502` и приложить артефакты.
- [ ] Выполнить post-deploy smoke с тестовым Sentry incident и проверить корреляцию по `requestId` в Loki + окно в Prometheus.
- [ ] Подготовить PR с commit history и test plan/рисками по требованиям workflow.
