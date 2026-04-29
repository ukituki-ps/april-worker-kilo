# 048 — Incident: белый экран dev.april (stale @april/ui dist)

## Цель

Расследовать и устранить белый экран на `https://dev.april.ukituki.tech/`, зафиксировать root cause и предотвратить регрессию.

## Критерии приёмки

- [x] Корреляция triage (Sentry → Loki → Prometheus) задокументирована; при отсутствии Sentry issue — эквивалентная клиентская верификация.
- [x] Кодовый guard: `ds:prepare` / `ds:check-exports` проверяют все критичные named exports shell + виджетов из `@april/ui` dist.
- [x] `REPORT.md` по шаблону репозитория.

## Scope

- `hub-shell/scripts/assert-ui-dist-exports.mjs`, `check-ui-exports.mjs`, `ds-prepare.sh`.

## Операционное восстановление dev

После merge: на стенде выполнить полный цикл `ds:prepare` (включая `pnpm build` в `design-system/DisignApril`, если dist устарел) и перезапуск `hub-shell` (см. `DEPLOYMENT_STRATEGY.md`).
