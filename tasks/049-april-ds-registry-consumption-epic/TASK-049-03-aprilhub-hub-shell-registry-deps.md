# 049-03 — AprilHub: `hub-shell` — зависимости из registry + `.npmrc`

## Мета

- **Эпик:** [`049`](./TASK.md)
- **Зависимости:** опубликованные версии пакетов (DisignApril); согласован ADR **049-01**; дока **049-02** может идти тем же PR или следом

## Цель

Заменить в `hub-shell` зависимости `file:../design-system/DisignApril/packages/ui` (и tokens) на **версии из приватного registry**, обновить **`package-lock.json`**, добавить шаблон **`.npmrc.example`** (без секретов) и инструкцию для CI.

## Входит в объём

- `hub-shell/package.json` — semver на `@april/ui`, `@april/tokens`
- `hub-shell/.npmrc.example` с `@april:registry=…` и комментарием про `NODE_AUTH_TOKEN`
- Рефакторинг скриптов: **`ds:prepare`** / **`ds:check-exports`** — не ломать локальную разработку с submodule:
  - вариант A: если `file:` удалён, `ds:prepare` только tokens fallback + no-op для ui **или** опциональный флаг `DS_LOCAL=1` для разработчиков с submodule
  - вариант B: оставить devDependency override через `npm install ../...` только в доке (предпочтительно описать один канонический путь)
- Минимальные правки, согласованные с ADR

## Не входит

- Полный перенос `april-showcase` на registry (отдельный follow-up, если витрина всё ещё тянет `file:`)

## Критерии готовности

- [ ] `npm ci && npm run lint && npm run build` в `hub-shell` на чистом клоне **после** настройки токена (как в CI)
- [ ] Нет регрессии по импортам из `@april/ui`

## Проверка

```bash
cd hub-shell
npm ci
npm run lint
npm run build
```

## Результат

PR в `april-worker`; в описании — опубликованные версии `@april/ui` / `@april/tokens`.
