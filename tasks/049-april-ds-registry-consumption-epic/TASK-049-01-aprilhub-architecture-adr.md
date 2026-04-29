# 049-01 — AprilHub: ADR и граница «исходники DisignApril vs npm-пакеты»

## Мета

- **Эпик:** [`049`](./TASK.md)
- **Приоритет:** обычный
- **Тип:** архитектура

## Цель

Зафиксировать архитектурное решение о **дистрибуции дизайн-системы**: приватный npm registry, scope, политика semver/breaking, роль **git submodule** `design-system/DisignApril` после перехода (витрина, локальная разработка, синхронизация до релиза).

## Входит в объём

- Новый файл **`docs/architecture/ADR-april-design-system-npm-distribution.md`** (имя можно уточнить под нумерацию ADR в репо) с разделами: контекст, решение, последствия, альтернативы (`file:`), миграция
- При необходимости одна ссылка из [`docs/architecture/README.md`](../../docs/architecture/README.md) или индекса архитектуры

## Не входит

- Реализация publish в DisignApril
- Смена зависимостей в `hub-shell` (задача 049-03)

## Критерии готовности

- [ ] ADR смержен в целевую ветку согласно `DEPLOYMENT_STRATEGY.md` *(выполняется при merge PR; артефакт: `docs/architecture/ADR-april-design-system-npm-distribution.md`)*
- [x] В ADR явно указаны: registry URL, scope `@april`, ответственный за релизы DS, откат

## Проверка

Ревью архитектуры + отсутствие противоречий с [`docs/guides/DESIGN_SYSTEM.md`](../../docs/guides/DESIGN_SYSTEM.md) (после 049-02 там будет обновлённая модель — порядок задач: сначала ADR, затем правка DESIGN_SYSTEM или одним PR с согласованными правками).

## Результат

Файл ADR в `docs/architecture/`; краткая отметка в `REPORT.md` эпика 049.
