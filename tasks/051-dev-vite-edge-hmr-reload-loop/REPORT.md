# Отчёт: 051 — dev: цикл reload (Vite HMR / edge WebSocket)

## 1) Итого

- Статус: ✅ выполнено (RCA + механизм обхода в репо; операционное включение на стенде — вручную)
- Задача: постоянная перезагрузка фронта `https://dev.april.ukituki.tech/`; сообщение в консоли «не успеваю увидеть»
- Ветка / PR / коммиты: правки локально в рабочем дереве april-worker (`hub-shell/vite.config.ts`, `docker-compose.yml`, `.env.example`), merge через PR по политике репозитория

---

## Инцидент (формат [`docs/AGENT_ERROR_TRIAGE_PROMPT.md`](../../docs/AGENT_ERROR_TRIAGE_PROMPT.md))

### 2) Инцидент и окружение

- Окружение: **dev** (`https://dev.april.ukituki.tech/`).
- Окно: **2026-05-01** (UTC около 15:07 на момент triage из агента).
- Симптом: многократные **полные перезагрузки документа**; текст в консоли «слишком быстро».

### 3) Корреляция (`requestId` / tenant / роль)

- **Нет связанной цепочки BFF/downstream**: ошибка возникает в **клиенте Vite dev** до или параллельно прикладной логики; пары `requestId`/`correlationId` для API в момент цикла не требовались для классификации root cause.

### 4) Наблюдения по слоям

- **Sentry:** доступ к живому проекту в этом triage не использовался; типичное событие при таком паттерне — шум/`NetworkError`/отсутствие issue без DSN или до первичного скринпринта.
- **Loki/Prometheus:** не дают первопричины WebSocket-upgrade на браузере; ожидаемо без аномальной деградации `hub-bff` именно как причины **document reload**.
- **Воспроизведение (эквивалент браузера):** headless Chromium (Playwright) за **12 сек** зафиксировал **`LOAD_EVENTS_COUNT` 5** и серию сообщений вида:

  - `[vite] connecting...`
  - `WebSocket connection to 'wss://dev.april.ukituki.tech/?token=…' failed: … Unexpected response code: 200`
  - `[vite] server connection lost. Polling for restart...`

- **Ingress-проверка:** `curl` с заголовками WebSocket-upgrade на тот же host возвращает **`HTTP 200`** и **`Content-Type: text/html`**, не **`101 Switching Protocols`** — внешний HTTPS-ингресс **не выполняет (или теряет) Upgrade** до docker-ingress/Vite.

### 5) Классификация и owner

- **Классификация:** **infra (edge reverse proxy перед compose-nginx)** в связке с **режимом Vite dev (HMR)** на стенде; проявление **UI/runtime loop**, не ошибка `/v1/me` или AprilProfile-widget в первую очередь.
- **Owner триажа первого уровня:** платформа/DevOps (HTTPS-/nginx перед `infra/nginx/default.conf`).
- **Owner обходного пути:** AprilHub frontend/compose (`VITE_DEV_HMR_DISABLE`).

---

## Что сделано в репозитории

- В [`hub-shell/vite.config.ts`](../../hub-shell/vite.config.ts): при `VITE_DEV_HMR_DISABLE=true` задаётся `server.hmr: false`, чтобы клиент `@vite/client` не пытался поднимать **wss**, не уходил в polling и не инициировал **reload-loop**.
- В [`docker-compose.yml`](../../docker-compose.yml): проброс переменной `VITE_DEV_HMR_DISABLE` в сервис `hub-shell`.
- В [`.env.example`](../../.env.example): документирован сценарий и комментарий про **HTTP 200 вместо 101**.

Долгосрочно правильнее **починить внешний nginx** для маршрута к hub-shell (`proxy_http_version 1.1`, `Upgrade`/`Connection` через `map`, достаточные таймауты), по аналогии с уже описанными заголовками во внутреннем [`infra/nginx/default.conf`](../../infra/nginx/default.conf).

На **192.168.1.29 (pr01)** готовые шаги: скопировать на хост файл [`scripts/apply-edge-nginx-websocket-april-dev.sh`](../../scripts/apply-edge-nginx-websocket-april-dev.sh) и выполнить **`sudo bash ./apply-edge-nginx-websocket-april-dev.sh`** (создаёт `conf.d/10-map-websocket-upgrade.conf`, патчит `sites-enabled/space.conf` для единственного `proxy_pass` на `:8080`, `nginx -t` и reload).

Операция на стенде **192.168.1.42** после merge/deploy:

1. В `.env` в корне compose-проекта: `VITE_DEV_HMR_DISABLE=true`.
2. `docker compose … up -d hub-shell` (или полный compose), чтобы процесс перечитал env на старте Vite.

---

## Изменённые файлы

- `hub-shell/vite.config.ts`
- `docker-compose.yml`
- `.env.example`

## Миграции и данные

- Нет.

## Проверка качества

- `npm --prefix hub-shell run lint`: **ok**.

## Деплой

- Среда: dev; после установки переменной — перезапуск `hub-shell`.
- Rollback: убрать `VITE_DEV_HMR_DISABLE` или выставить `false`, перезапустить контейнер (горячая перезагрузка вернётся только после починки WebSocket на edge).

## Риски

- При `hmr: false` **нет live HMR** в dev-режиме Vite за этим ingress; нужна ручная перезагрузка страницы при смене кода или сборка статики для стабильного UX.
