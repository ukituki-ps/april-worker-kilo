# Отчёт: 052 — 401 у виджетов профиля после простоя

## Инцидент (triage)

- **Окружение:** `dev` (`https://dev.april.ukituki.tech`), маршрут UI: `#/app/profile/entities`.
- **Симптом:** у виджетов AprilProfile (список профилей / шаблоны) после небольшого простоя запросы завершаются **401**.
- **Sentry → Loki → Prometheus:** в этой сессии агента **нет доступа** к инстансам наблюдаемости стенда; корреляция по `requestId` / issue не выполнялась. Рекомендация для закрытия инцидента на стенде: по окну времени взять `X-Request-Id` / `X-Correlation-Id` из ответа BFF или из Network, затем цепочку из [`docs/runbooks/APRIL_ERROR_TELEMETRY_TRIAGE.md`](../../docs/runbooks/APRIL_ERROR_TELEMETRY_TRIAGE.md) (`hub-bff` → `april-profile-api`), плюс дашборды `Hub Auth And Degraded` / auth error rate — чтобы исключить одновременный сбой Keycloak или ACL.

## Корреляция (ожидаемые поля после повторного прогона на стенде)

| Поле | Значение в рамках задачи |
|------|---------------------------|
| Sentry issue | не собирался (нет доступа) |
| `requestId` / `correlationId` | собрать при повторе на dev из заголовков ответа |
| `tenant` / роль | из `/v1/me` и JWT (`realm_access.roles`) — без PII в тикете |
| `route` | `#/app/profile/entities`; API: `/api/v1/admin/profile/api/v1/...` |
| `module` / `widget` | `profiles-widget`, `entity-types-widget` (хост `hub-shell`) |

## Наблюдения по слоям (кодовый RCA без live-логов)

1. **Sentry (не подтверждено live):** вероятны события API/ручного capture при `401` с тегами host-route.
2. **Loki (гипотеза для проверки):** первый отказ на `hub-bff` или ingress с `401` и телом вроде invalid/expired JWT до downstream.
3. **Prometheus:** при чисто клиентском истечении токена **не** ожидается всплеск `5xx` или target down; при всплеске auth-метрик на стороне Keycloak — отдельный infra/IdP трек.

## Классификация root cause

- **Слой:** **frontend (AprilHub `hub-shell`)** — хост передавал в `@april/profile-ui` строку `accessToken={keycloak.token}` без ре-рендера после того, как `keycloak-js` обновил токен в памяти. Виджет держит снимок токена в `useRef`, обновляемый только при новом значении **prop** с родителя → после idle уходили запросы с **истёкшим** Bearer. Обходной путь «только Sentry» здесь недостаточен; live-корреляция всё равно нужна для постановки на метрики Keycloak/BFF.
- **Owner:** AprilHub (host shell).

## Изменения

| Файл | Назначение |
|------|------------|
| `hub-shell/src/keycloak-token-subscribers.ts` | Pub/sub для уведомления подписчиков о ротации access token |
| `hub-shell/src/keycloak.ts` | `onAuthRefreshSuccess` → notify; `onTokenExpired` → `updateToken(70)` |
| `hub-shell/src/api.ts` | После успешного `updateToken` при 401 → `notifyKeycloakTokenRotated()` (согласованность с запросами через `authorizedFetch`) |
| `hub-shell/src/widgets.tsx` | `useProfileWidgetAccessToken()` — подписка и прокид актуального токена в виджеты |
| `hub-shell/src/api.test.ts`, `hub-shell/src/keycloak-token-subscribers.test.ts` | Покрытие |

## Риски и rollback

- **Риск:** дублирующие уведомления подписчикам при нескольких источниках refresh — только лишние ререндеры.
- **Rollback:** откат коммита в `hub-shell` и redeploy образа по предыдущему SHA.

## Верификация

```bash
cd hub-shell && npm ci && npm test && npm run build
```

После деплоя на dev: сценарий «entities → idle > access TTL → действие в виджете» без `401`; при необходимости — повторная выборка Sentry/Loki/Prometheus по runbook.

---

## 1) Итого (шаблон `AGENT_REPORT_TEMPLATE.md`)

- **Статус:** выполнено (код + тесты; live-наблюдаемость на стенде не подключалась)
- **Задача:** устранение 401 у profile-виджетов после простоя из‑за устаревшего Bearer в React
- **Ветка:** `fix/052-profile-widgets-idle-401` (рекомендуется создать локально)
- **Коммиты:** см. `git log`
- **PR:** https://github.com/ukituki-ps/april-worker/pull/127

## 2) Что сделано

- [frontend] Синхронизация ротации Keycloak access token с хостом виджетов и проактивный refresh по `onTokenExpired`.

## 3) Изменённые файлы

- `hub-shell/src/keycloak-token-subscribers.ts`
- `hub-shell/src/keycloak.ts`
- `hub-shell/src/api.ts`
- `hub-shell/src/widgets.tsx`
- `hub-shell/src/api.test.ts`
- `hub-shell/src/keycloak-token-subscribers.test.ts`

## 4) Миграции и данные

- Миграции Atlas: нет

## 5) Проверка качества

- Линтер / `tsc`: ok (`npm run build`)
- Unit tests: ok (`npm test`)

## 6) Деплой

- Среда: dev — после merge по [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
- Образы: обновить `hub-shell` по git SHA

## 7) Риски и ограничения

- Без подтверждения Loki нельзя исключить вторичную причину (Keycloak session timeout, clock skew); при повторении после фикса — полный triage-цикл.

## 8) Что осталось

- [ ] Прогон корреляции Sentry → Loki → Prometheus на dev по фактическому окну
- [ ] Smoke на стенде после выката образа
