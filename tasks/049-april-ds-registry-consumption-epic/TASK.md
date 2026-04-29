# Эпик 049 — Версионируемое потребление `@april/ui` / `@april/tokens` из npm registry

## Мета

- **ID:** `049`
- **Приоритет:** обычный (архитектурная инициатива; снижает класс production/dev инцидентов stale `dist`)
- **Связь:** инцидент stale DS [`048`](../048-aprilhub-dev-white-screen-stale-ui-dist/REPORT.md); вариант стратегии «5» из обсуждения с командой

## Цель

Заменить неявную доставку runtime дизайн-системы (`file:` + локальная сборка `dist`) на **явные версии пакетов** в **приватном npm registry**, чтобы AprilHub и AprilProfile на CI и стендах всегда получали согласованный артефакт, зафиксированный в lockfile.

## Контекст

- Мастер-план: [`PLAN.md`](./PLAN.md)
- Каноническая документация по текущей модели: [`docs/guides/DESIGN_SYSTEM.md`](../../docs/guides/DESIGN_SYSTEM.md)
- Деплой и секреты: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)

## Входит в объём эпика

- Архитектурное решение (ADR) в `april-worker`
- Обновление документации AprilHub под registry-модель
- Изменения `hub-shell`, CI, compose/deploy по мере согласования
- Сквозная задача финальной проверки [`TASK-049-99`](./TASK-049-99-aprilhub-final-integration-verify.md)

## Не входит

- Редизайн компонентов DisignApril (только дистрибуция и потребление)
- Смена Keycloak / BFF контрактов

## Критерии готовности эпика

- [ ] В registry опубликованы `@april/ui` и `@april/tokens` (минимум одна согласованная версия каждого пакета)
- [ ] AprilHub: `hub-shell` собирается из lock с зависимостями из registry; документация обновлена
- [ ] AprilProfile: постановка выполнена во внешнем репо (координация владельца)
- [ ] DisignApril: постановка выполнена во внешнем репо
- [ ] Выполнена [`TASK-049-99`](./TASK-049-99-aprilhub-final-integration-verify.md)

## Внешние постановки (скопировать в другие репозитории)

| Репозиторий | Файл-источник в april-worker |
|-------------|------------------------------|
| **DisignApril** | [`EXTERNAL_DISIGNAPRIL_TASK.md`](./EXTERNAL_DISIGNAPRIL_TASK.md) |
| **AprilProfile** (`april-profile-1`) | [`EXTERNAL_APRILPROFILE_TASK.md`](./EXTERNAL_APRILPROFILE_TASK.md) |

## Результат в отчёте

После закрытия эпика: `tasks/049-april-ds-registry-consumption-epic/REPORT.md` по [`docs/AGENT_REPORT_TEMPLATE.md`](../../docs/AGENT_REPORT_TEMPLATE.md) + ссылки на PR во внешних репозиториях.
