---
sidebar_position: 3
---

# ADR-0002: Политика публикации и lifecycle SHA-образов AprilHub

- **Дата:** 2026-04-15
- **Статус:** принято
- **Контекст:** после этапа `009` deploy pipeline AprilHub перешёл на `images.env` и auto-rollback, но policy жизненного цикла образов `hub-bff`/`hub-shell` требовала явной фиксации перед release-gate `010`.
- **Решение:** для dev deploy использовать только git SHA-теги образов в ghcr; runtime source of truth хранится в server-local `images.env`, а `deploy.sh` ведёт состояния `.deploy-state/images.env.previous` и `.deploy-state/images.env.last-good`. Успешный релиз фиксируется артефактами deploy и обновлением `last-good`.
- **Последствия:** исключается drift между git и runtime-пинами образов; rollback становится детерминированным по `last-good`; требуется дисциплина обновления `images.env` пайплайном и хранение deploy-артефактов.

## Детали policy

1. **Публикация образов:** `hub-bff` и `hub-shell` публикуются в ghcr с тегом `<git-sha>`; `latest` не используется как обязательный release-тег.
2. **Выбор версии на сервере:** compose читает `HUB_BFF_IMAGE`/`HUB_SHELL_IMAGE` из server-local `images.env`; файл не коммитится.
3. **Успешный deploy:** после health/readiness/smoke `deploy.sh` обновляет `images.env.last-good` и сохраняет артефакты deploy.
4. **Rollback:** при ошибке применяется `images.env.last-good`, затем выполняются compose-up и повторные health/smoke (плюс rollback миграций при наличии).

## Ссылки

- `docs/DEPLOYMENT_STRATEGY.md`
- `deploy.sh`
- `images.env.example`
- `tasks/009-hub-deployment-hardening-dev/REPORT.md`
- `docs/guides/APRILHUB_RELEASE_CHECKLIST_V1.md`
