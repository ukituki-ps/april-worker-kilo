# Architecture Docs Index

Единая папка архитектурной документации проекта.

## Для агента (читать в первую очередь)

- `docs/AGENT_ARCHITECTURE_CONTEXT.md`
- `docs/architecture/структура сервиса.md`
- `docs/architecture/INTERSERVICE_LINKS.md`
- `docs/architecture/INTEGRATION_CONTRACTS.md`
- `docs/architecture/ERROR_TELEMETRY_MODEL.md`
- `docs/architecture/APRILHUB_C3_C4.md`
- `docs/architecture/APRILWORKER_C3_C4.md`
- `docs/architecture/C4_RUNTIME_SEQUENCES.md`
- `structurizr/workspace.dsl`
- `docs/guides/OBSERVABILITY_INDEX.md` (central observability navigation)
- `docs/guides/OBSERVABILITY_MULTI_STAND_OPERATING_MODEL.md` (multi-stand operating model)
- [`ADR-april-design-system-npm-distribution.md`](./ADR-april-design-system-npm-distribution.md) — дистрибуция `@april/ui` / `@april/tokens` через приватный npm (GitHub Packages), роль submodule

## Назначение файлов

- `структура сервиса.md` — обзор сервисов экосистемы и их роли (в т.ч. **AprilProfile**; каноничное описание продукта и модели — в репозитории [april-profile](https://github.com/ukituki-ps/april-profile-kilo
- `INTERSERVICE_LINKS.md` — матрица межсервисных связей (`Sync`/`Async`).
- `INTEGRATION_CONTRACTS.md` — рабочие контракты интеграций (draft).
- `ERROR_TELEMETRY_MODEL.md` — модель обработки и корреляции frontend/API ошибок (`Sentry + Loki/Prometheus`).
- `APRILHUB_C3_C4.md` — детальная C3/C4 спецификация `AprilHub`.
- `APRILWORKER_C3_C4.md` — детальная C3/C4 спецификация `AprilWorker`.
- `C4_RUNTIME_SEQUENCES.md` — ключевые runtime sequence-сценарии.
- `ADR-april-design-system-npm-distribution.md` — ADR: registry, semver, submodule vs npm для дизайн-системы.

## Правило актуализации

При изменении архитектуры:
1. Обновить `structurizr/workspace.dsl`.
2. Синхронизировать `INTERSERVICE_LINKS.md`.
3. При изменении контрактов обновить `INTEGRATION_CONTRACTS.md`.
4. Если изменились runtime-потоки — обновить `C4_RUNTIME_SEQUENCES.md`.
