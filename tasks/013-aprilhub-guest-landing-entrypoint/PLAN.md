# План: Public Guest Landing and Authorized Entrypoint UX (Этап 013)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-16
- **Статус плана:** согласован

## Исходные допущения
- Базовый ingress и auth-flow уже унифицированы в этапе `012`; в `013` меняем только UX guest-зоны и точку входа в login flow.
- IAM-модель и backend-контракты остаются неизменными; источник ролей и прав — Keycloak.
- Пользовательские тексты интерфейса (заголовки, CTA, состояния `loading/error/forbidden`) должны быть на русском языке.
- Проверки ограничиваются `hub-shell` build/tests и существующим smoke-скриптом платформы.

## Порядок работ (шаги)
1. Проанализировать текущий `hub-shell` guest entrypoint и существующие тесты.
2. Реализовать дизайн-системный guest landing (hero, value blocks, scenarios, primary CTA) с русскоязычными UI-текстами.
3. Усилить entrypoint UX: обработать запуск login flow и ошибки недоступности auth endpoint с русскоязычными сообщениями состояний.
4. Обновить unit/smoke-проверки guest->login сценария без изменения IAM/API контрактов.
5. Прогнать команды из `TASK.md` и зафиксировать результат в `REPORT.md`.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | Без изменений |
| Frontend | `hub-shell` guest landing, CTA login flow, русскоязычные UI-тексты/состояния, тесты и стили |
| БД / Atlas | Без изменений |
| Инфра / Compose | Без изменений |
| Документация / OpenAPI | Отчёт задачи `tasks/013.../REPORT.md`; OpenAPI без изменений |

## Риски и откат
- **Риск:** деградация UX входа при ошибке Keycloak login init → **Митигация:** явная обработка исключений и отображение error state на landing.
- **Риск:** регрессия guest/authorized ветвления → **Митигация:** обновление unit-тестов `App`.
- **Риск:** смешение языков интерфейса (RU/EN) после обновления UX → **Митигация:** ввести проверку русскоязычных UI-строк в unit/UI smoke сценарии.
- При необходимости отката: вернуть изменения в `hub-shell/src/App.tsx`, `hub-shell/src/main.tsx`, `hub-shell/src/app.css`, `hub-shell/src/App.test.tsx`.

## Проверка после выполнения
- Команды:
  - `npm --prefix hub-shell run build`
  - `npm --prefix hub-shell run test`
  - `./scripts/smoke-aprilhub.sh`
- Ручная проверка / smoke:
  - Guest landing отображает hero, карточки ценности и primary CTA с русскоязычными текстами.
  - Состояния `loading/error/forbidden` и подписи действий отображаются на русском языке.
  - Primary CTA инициирует Keycloak login flow через ingress-path.

## Примечания
- Связанные задачи/follow-up: `014` (Keycloak theming), `015` (authorized shell layout).
