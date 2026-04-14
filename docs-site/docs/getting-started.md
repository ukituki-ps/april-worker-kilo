---
sidebar_position: 2
---

# Быстрый старт (документация)

Команды выполняются из **корня репозитория** (где лежат `Makefile` и `docker-compose.yml`).

## Сборка сайта (Docusaurus)

```bash
make docs-build
# или: cd docs-site && npm ci && npm run build
```

Статика появляется в `docs-site/build/`.

## Локальный просмотр статики

```bash
cd docs-site && npm run serve
```

## Docker Compose: Nginx + OpenAPI + Swagger UI + Structurizr Lite

1. Соберите статику Docusaurus (`make docs-build`).
2. Поднимите стек:

```bash
docker compose up -d
```

Удобная альтернатива: **`make compose-up`** — собирает Docusaurus и поднимает Compose за один шаг. Если вызывать только `docker compose up` без предварительной сборки, `docs-site/build` может быть пустым.

По умолчанию (см. `.env.example`):

| URL | Назначение |
|-----|------------|
| http://localhost:8080/ | Собранный Docusaurus |
| http://localhost:8080/openapi/openapi.yaml | Спецификация OpenAPI сервиса (YAML) |
| http://localhost:8080/openapi/mail-gateway-openapi.yaml | Internal Mail Gateway API (внутренний REST над SMTP) |
| http://localhost:8080/swagger/ | Swagger UI (читает спецификацию с того же хоста) |
| http://localhost:8091/ | Structurizr Lite (модель C4 из `structurizr/workspace.dsl`) |

Structurizr вынесен на отдельный порт: веб-приложение Lite плохо переносит префикс за обратным прокси; отдельный порт зафиксирован как согласованный вариант bootstrap.

## Проверка OpenAPI

```bash
make openapi-lint
```

## Проверка Compose

```bash
make compose-config
```

## AprilHub runtime profile (Hub Shell + Hub BFF + Keycloak)

1. Подготовьте env:

```bash
cp .env.example .env
```

2. Поднимите runtime-профиль:

```bash
docker compose --profile aprilhub up -d
```

3. Проверьте базовые endpoint-ы:

```bash
curl http://localhost:8081/healthz
curl http://localhost:8081/readyz
```

4. Проверка smoke auth path:
- Keycloak Admin Console: `http://localhost:8082/admin/`
- Realm: `april`
- Dev user: `april-dev`
- Password: `april-dev-pass`

5. Получите access token и проверьте auth/RBAC контракт:

```bash
TOKEN=$(curl -s -X POST "http://localhost:8082/realms/april/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=aprilhub-shell&username=april-dev&password=april-dev-pass" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["access_token"])')

# 200: профиль текущего пользователя
curl -i -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/v1/me

# 401: отсутствует Bearer token
curl -i http://localhost:8081/api/v1/overview

# 403: недостаточная роль (dev-user имеет только роль user)
curl -i -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/v1/admin/ping
```

6. OpenAPI Hub BFF:
- `http://localhost:8080/openapi/aprilhub-bff.yaml`
