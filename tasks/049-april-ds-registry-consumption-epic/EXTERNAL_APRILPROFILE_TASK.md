<!--
  ИНСТРУКЦИЯ: скопировать в репозиторий AprilProfile (например april-profile-1),
  например как tasks/049-consume-april-ui-from-registry/TASK.md
-->

## Мета

- **Связь с эпиком AprilHub:** `april-worker` → `tasks/049-april-ds-registry-consumption-epic/`
- **Приоритет:** обычный

## Цель

Перевести фронтенд AprilProfile на зависимости **`@april/ui`** и **`@april/tokens`** из **того же приватного npm registry**, что и AprilHub, с фиксацией версий в lockfile; убрать зависимость от локального `file:` к клону DisignApril на стендах и в CI.

## Контекст

После публикации пакетов из DisignApril (см. `EXTERNAL_DISIGNAPRIL_TASK.md` в эпике 049 april-worker) потребители устанавливают пакеты через `npm ci` / `pnpm install` с `.npmrc` и `NODE_AUTH_TOKEN` / `GITHUB_TOKEN`.

## Входит в объём

- `package.json` (и lock): semver на `@april/ui`, `@april/tokens`
- `.npmrc` + документация для разработчика и CI
- Обновление Dockerfile / GitHub Actions для передачи токена на этап install (без коммита секрета)
- Документация: ссылка на ADR/гайд AprilHub или краткий локальный раздел «версии DS»

## Не входит

- Изменение API AprilProfile backend

## Критерии готовности

- [ ] CI и Docker build Profile без `file:` на DS при типовом сценарии
- [ ] Документирован порядок bump версии DS и регрессии UI
- [ ] Согласован минимальный диапазон версий с AprilHub (или зафиксированы одинаковые миноры)

## Проверка

```bash
npm ci
npm run build   # или фактические команды фронта в репозитории
```

## Результат в отчёте

`REPORT.md` в подпапке задачи AprilProfile; уведомить владельца эпика 049 в april-worker о завершении и опубликованных версиях.
