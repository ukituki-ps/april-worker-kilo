# 049-02 — AprilHub: документация потребления DS из registry

## Мета

- **Эпик:** [`049`](./TASK.md)
- **Зависимость:** согласованный черновик/мерж [`049-01`](./TASK-049-01-aprilhub-architecture-adr.md) (или параллельно в одном PR с согласованием)

## Цель

Обновить документацию AprilHub так, чтобы **каноническая** модель потребления `@april/ui` / `@april/tokens` для **hub-shell** и стендов описывала **registry + lockfile**, а submodule и `ds:prepare` — как **локальную / витринную** опцию.

## Входит в объём

- [`docs/guides/DESIGN_SYSTEM.md`](../../docs/guides/DESIGN_SYSTEM.md): раздел интеграции 013 дополнить веткой «production/stage: npm»; не удалять исторический контекст submodule без пометки
- [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md): секреты / переменные для `NODE_AUTH_TOKEN` при сборке образов или на runner; чеклист сервера при необходимости
- При необходимости [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](../../docs/AGENT_ARCHITECTURE_CONTEXT.md) — одна строка про источник UI-kit
- [`docs/guides/VERSIONS.md`](../../docs/guides/VERSIONS.md) — если есть таблица версий DS, синхронизировать с registry

## Не входит

- Реализация `hub-shell/package.json` (задача 049-03)

## Критерии готовности

- [x] Новый разработчик по доке понимает: откуда берутся пакеты, как bump, где submodule
- [x] Нет противоречий с ADR 049-01

## Проверка

Линкчек вручную по изменённым md; при наличии docusaurus build — по стратегии репозитория.

## Результат

PR с правками только в `docs/` (и минимальные перекрёстные ссылки).
