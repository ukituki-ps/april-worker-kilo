## 1) Итого
- Статус: ✅ выполнено
- Задача: реализация Sentry и error telemetry в AprilProfile (`april-profile-1`)
- Ветка: `feature/036-phase-4b-profile-sentry-rollout-preparation`
- Коммиты: не создавались
- PR: не создавался

## 2) Что сделано
- [backend] Добавлен runtime-контур Sentry: инициализация SDK, HTTP panic-capture и отправка событий для `5xx` с тегами `requestId/correlationId`.
- [backend] Реализована redaction-политика (`Authorization`, `Cookie`, query/body/user fields) в `BeforeSend`.
- [frontend] Подключён `@sentry/react`, добавлен init из `VITE_SENTRY_*`, подключён capture `save_failed` telemetry событий виджетов (`@april/profile-ui`).
- [docs] Обновлены `docs/OBSERVABILITY.md` и `docs/runbooks/APRILPROFILE_SENTRY_ROLLOUT_PREPARATION.md` с фактическим runtime status и контрактом корреляции.

## 3) Изменённые файлы
- `april-profile-1/internal/telemetry/sentry.go`
- `april-profile-1/internal/app/run.go`
- `april-profile-1/internal/httpapi/server.go`
- `april-profile-1/internal/config/config.go`
- `april-profile-1/go.mod`
- `april-profile-1/go.sum`
- `april-profile-1/frontend/src/sentry.ts`
- `april-profile-1/frontend/src/main.tsx`
- `april-profile-1/frontend/src/App.tsx`
- `april-profile-1/frontend/src/vite-env.d.ts`
- `april-profile-1/frontend/package.json`
- `april-profile-1/frontend/package-lock.json`
- `april-profile-1/.env.example`
- `april-profile-1/docs/OBSERVABILITY.md`
- `april-profile-1/docs/runbooks/APRILPROFILE_SENTRY_ROLLOUT_PREPARATION.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да; откат через отключение `SENTRY_DSN` / `VITE_SENTRY_DSN` и revert изменений

## 5) Проверка качества
- Линтер: ok
- Сборка: ok
- Unit tests: ok
- Integration tests: не применялось
- E2E / smoke: не применялось

Команды (фактически выполненные):
```bash
cd /home/ukituki/april-profile-1 && go test ./...
cd /home/ukituki/april-profile-1/frontend && npm run lint
cd /home/ukituki/april-profile-1/frontend && npm run test
cd /home/ukituki/april-profile-1/frontend && npm run build
```

## 6) Деплой
- Среда: нет
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md`
- Образы: не применялось
- Health / readiness: не применялось
- Rollback: отключение DSN и/или revert изменений по runbook

## 7) Риски и ограничения
- Без фактического DSN/релиза в окружении события в Sentry не отправляются (это ожидаемое поведение).
- Проведение финального smoke с синтетическими ошибками и визуальная проверка событий в Sentry остаются за этапом запуска на dev-стенде с секретами.
- Настройка sample rates может потребовать корректировки после первых дней эксплуатации.

## 8) Что осталось
- [ ] Создать commit/PR в `april-profile-1` и заменить плейсхолдеры по ссылкам на артефакты.
- [ ] Выполнить runtime smoke на dev-стенде с реальным DSN и проверить цепочку Sentry ↔ Loki/Grafana.
