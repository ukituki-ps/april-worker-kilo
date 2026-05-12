# ADR: дистрибуция дизайн-системы April через приватный npm registry

- **Статус:** принято (черновик для согласования в PR; после merge в целевую ветку по [`DEPLOYMENT_STRATEGY.md`](../DEPLOYMENT_STRATEGY.md) — каноническое состояние)
- **Дата:** 2026-04-29
- **Контекст эпика:** [`tasks/049-april-ds-registry-consumption-epic/TASK.md`](../../tasks/049-april-ds-registry-consumption-epic/TASK.md)
- **Связанные документы:** [`docs/guides/DESIGN_SYSTEM.md`](../guides/DESIGN_SYSTEM.md), [`tasks/048-aprilhub-dev-white-screen-stale-ui-dist/REPORT.md`](../../tasks/048-aprilhub-dev-white-screen-stale-ui-dist/REPORT.md)

## Контекст

Пакеты **`@april/tokens`** и **`@april/ui`** поставляются из монорепозитория [DisignApril](https://github.com/ukituki-ps/DisignApril-kilo

- git submodule `design-system/DisignApril`;
- зависимости **`file:`** в `hub-shell/package.json`;
- скрипт **`ds:prepare`** (`pnpm install` + `pnpm build` в submodule перед dev/lint/test/build).

Такой контур даёт гибкую локальную разработку, но **runtime-артефакт**, который исполняет браузер, зависит от состояния рабочего дерева и успешной пересборки `dist` на CI/стенде. Возможен рассинхрон исходников потребителя и устаревшего `packages/ui/dist` (класс инцидентов вроде [`048`](../../tasks/048-aprilhub-dev-white-screen-stale-ui-dist/REPORT.md): белый экран, `SyntaxError` по named export).

Цель эпика `049`: зафиксировать в lockfile **явные semver-версии** опубликованных tarball’ов из **одного приватного registry**, чтобы CI и стенды получали воспроизводимый артефакт без неявной сборки submodule на критическом пути деплоя `hub-shell`.

## Решение

1. **Registry (npm для пакетов `@april/*`):** использовать **GitHub Packages** в режиме npm-registry.

   - **Базовый URL registry для scope `@april`:** `https://npm.pkg.github.com`
   - В `.npmrc` потребителей: `@april:registry=https://npm.pkg.github.com` и аутентификация через `NODE_AUTH_TOKEN` (или эквивалент в CI/Docker build) с правами **read:packages** для установки и **write** — только в пайплайне публикации DisignApril.

   Примечание: образы приложений AprilHub по-прежнему публикуются в **ghcr.io** по git SHA ([`DEPLOYMENT_STRATEGY.md`](../DEPLOYMENT_STRATEGY.md)); это **отдельный** контур от npm-пакетов дизайн-системы.

2. **Scope пакетов:** **`@april`** — единый scope для токенов и UI (`@april/tokens`, `@april/ui`). Имена и `publishConfig` задаются в репозитории DisignApril.

3. **Semver и breaking:**

   - Версии пакетов — **semver** (`MAJOR.MINOR.PATCH`), независимо для `@april/tokens` и `@april/ui` (согласованные мажорные версии при необходимости фиксируются в документации эпика / release checklist).
   - **`MAJOR`:** намеренные breaking changes (удаление/переименование публичного API, несовместимые изменения контракта стилей/темы по согласованию с потребителями).
   - **`MINOR`:** обратно совместимые функции и компоненты.
   - **`PATCH`:** исправления без изменения контракта.
   - Потребители в продакшен-контуре AprilHub: диапазоны в `package.json` (`^` / зафиксированные версии) по политике команды; **источник истины для CI** — lockfile (`package-lock.json`).

4. **Роль git submodule `design-system/DisignApril` после перехода:**

   | Назначение | Описание |
   |------------|----------|
   | Витрина | Сборка и запуск `april-showcase` (DisignApril `apps/showcase`), маршрут `/showcase/` в dev-контуре |
   | Локальная разработка | Редактирование DS рядом с `hub-shell`, эксперименты до публикации версии |
   | Синхронизация до релиза | Поднятие submodule SHA и подготовка релиза в DisignApril; **bump версии shell для продуктового runtime** — отдельный шаг: обновление зависимостей из registry + lock в PR AprilHub (задача [`049-03`](../../tasks/049-april-ds-registry-consumption-epic/TASK-049-03-aprilhub-hub-shell-registry-deps.md)) |

   Submodule **не** считается единственным источником runtime для production-сборки `hub-shell` после завершения миграции эпика `049`.

5. **Ответственность за релизы дизайн-системы:**

   - **Публикация версий** `@april/tokens` и `@april/ui` в registry: **владельцы репозитория DisignApril** (`ukituki-ps/DisignApril-kilo
   - **Потребление и своевременный bump** в AprilHub: команда AprilHub / владелец фронтенда `hub-shell` (PR с обновлением `package.json` + lock + прохождение обязательного quality gate из [`README.md`](../../README.md)).
   - **Секреты** read/write для GitHub Packages: хранение и ротация по [`DEPLOYMENT_STRATEGY.md`](../DEPLOYMENT_STRATEGY.md) и внутренним runbook’ам организации; владелец секретов CI — команда инфраструктуры / maintainers репозитория, где выполняется workflow.

6. **Откат (rollback):**

   | Ситуация | Действия |
   |----------|----------|
   | Регрессия после bump версии DS | Revert PR с обновлением `package.json` / lock в `hub-shell` (и при необходимости образов по SHA); предыдущая пара версий `@april/*` остаётся в registry — откат на известный semver без восстановления submodule |
   | Недоступность registry / истёкший токен | Восстановить `NODE_AUTH_TOKEN` / PAT, повторить `npm ci`; временная блокировка деплоя до починки |
   | Аварийный возврат к старой модели | Отдельное решение: временно вернуть зависимости `file:` + обязательный `ds:prepare` на ветке/hotfix; зафиксировать причину в отчёте инцидента (не целевое состояние после закрытия `049`) |

   Откат **образов** hub-shell на dev-сервере — по существующей политике: предыдущие теги **ghcr.io** по git SHA в `images.env` ([`DEPLOYMENT_STRATEGY.md`](../DEPLOYMENT_STRATEGY.md), раздел про rollback).

## Последствия

- **Плюсы:** воспроизводимые сборки; явная версия в lockfile; меньше класса «stale dist» на стенде; единый контур для AprilHub и AprilProfile.
- **Минусы:** обязательная настройка `.npmrc` и секретов на CI и в Docker build; координация релизов между тремя репозиториями (DisignApril, april-worker, april-profile-1).
- Документация пользовательского потребления (`DESIGN_SYSTEM.md`) обновляется в задаче **`049-02`** после принятия ADR (порядок: сначала ADR, затем гайд — допускается один согласованный PR).

## Альтернативы

| Альтернатива | Почему не выбрана как целевая для продуктового runtime |
|--------------|--------------------------------------------------------|
| Только **`file:`** + submodule + локальная сборка | Не фиксирует иммутабельный артефакт в lockfile; зависимость от шага `ds:prepare` на каждом окружении |
| Публичный npm без scope / без приватности | Несовместимо с политикой закрытой экосистемы и приватными пакетами |
| Другой приватный registry (Verdaccio, Artifactory и т.д.) | Допустимо в будущем; текущий выбор — GitHub Packages для единообразия с GitHub-организацией и уже используемым ghcr |

`file:` + submodule остаётся **допустимой опцией** для локальной разработки и витрины, но не как единственная стратегия доставки для production-сборки после эпика `049`.

## Миграция (высокий уровень)

1. В DisignApril: настроить publish в GitHub Packages, выпустить первые согласованные версии `@april/tokens` и `@april/ui`.
2. В `april-worker`: ADR (этот документ) → документация `049-02` → смена зависимостей и CI `049-03` → compose/deploy при необходимости.
3. Сквозная проверка: [`TASK-049-99`](../../tasks/049-april-ds-registry-consumption-epic/TASK-049-99-aprilhub-final-integration-verify.md).

Детальный план эпика: [`tasks/049-april-ds-registry-consumption-epic/PLAN.md`](../../tasks/049-april-ds-registry-consumption-epic/PLAN.md).
