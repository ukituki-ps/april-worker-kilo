# Задача 044: AprilHub auth-only контур с пустым сайдбаром

## Мета
- **ID / ветка:** `044-aprilhub-auth-only-empty-sidebar`
- **Приоритет:** высокий
- **Тип:** [radical cleanup + runtime simplification]
- **Связанные документы:**
  - [`task_list.md`](../../task_list.md)
  - [`tasks/043-aprilhub-sidebar-minimal-profile-list-only/TASK.md`](../043-aprilhub-sidebar-minimal-profile-list-only/TASK.md)
  - [`hub-shell/src/App.tsx`](../../hub-shell/src/App.tsx)
  - [`hub-shell/src/shell/AuthorizedShellGate.tsx`](../../hub-shell/src/shell/AuthorizedShellGate.tsx)
  - [`hub-shell/src/shell/AuthorizedHubContent.tsx`](../../hub-shell/src/shell/AuthorizedHubContent.tsx)
  - [`hub-shell/src/shell/shell-nav-config.ts`](../../hub-shell/src/shell/shell-nav-config.ts)
  - [`hub-shell/src/widgets.tsx`](../../hub-shell/src/widgets.tsx)
  - [`hub-shell/src/vendor/april-profile-ui.tsx`](../../hub-shell/src/vendor/april-profile-ui.tsx)

## Цель
С нуля упростить авторизованную зону AprilHub до минимального каркаса: оставить только рабочую авторизацию (Keycloak + `/api/v1/me`) и пустой сайдбар без продуктовых разделов. Все виджеты, маршруты, host-обвязки и API-вызовы, не относящиеся к входу и базовому auth-контексту, убрать из runtime-потока.

## Контекст для агента
- Текущий контур уже урезан до раздела `Профиль — список`, но в runtime и кодовой базе остаются компоненты/роуты/запросы профильного домена.
- Требуется не скрыть UI, а удалить лишний runtime-путь и привести shell к состоянию "auth-only scaffold".
- После логина пользователь должен попадать в авторизованный shell-каркас без бизнес-контента и без вызовов профильного API.

## Входит в объём
- Сохранить рабочий auth-flow:
  - `keycloak.init(check-sso)`,
  - guest -> login -> authorized,
  - загрузка контекста через `GET /api/v1/me`,
  - обработка `401/403` как в текущем UX.
- Оставить структуру авторизованной страницы (header + sidebar + content frame), но:
  - сайдбар без пунктов продуктовой навигации,
  - контент-зона с нейтральным placeholder-состоянием (например "Разделы отключены").
- Удалить из активного runtime:
  - маршруты продуктовых разделов,
  - рендер и подключение профильных виджетов,
  - вызовы `/api/v1/admin/profile/api/**`,
  - лишние host-компоненты, которые больше не используются в auth-only контуре.
- Упростить `shell-nav-config` и `shell-paths` до минимального контракта без бизнес-маршрутов.
- Обновить тесты (unit/e2e smoke) под новый контракт "логин + пустой сайдбар".
- Зафиксировать в `REPORT.md`, какие runtime-модули и запросы удалены.

## Не входит в объём
- Редизайн guest-лендинга или Keycloak UI.
- Изменение backend API-контрактов, кроме удаления их использования из `hub-shell`.
- Внедрение новых бизнес-разделов и новых фич в авторизованной зоне.
- Полный физический purge всех legacy-файлов репозитория, если они остаются вне runtime и не мешают сборке (можно оформить follow-up).

## Технические ограничения
- Не ломать OIDC/login/logout и загрузку `/api/v1/me`.
- Не оставлять "скрытые" активные маршруты к удалённым разделам.
- Не выполнять запросы к `/api/v1/admin/profile/api/**` после успешной авторизации в штатном сценарии.
- Сохранить стабильный рендер shell при неизвестном hash/route (без падения приложения).

## Критерии готовности (testable acceptance)
- [ ] После логина под валидным пользователем отображается авторизованный shell.
- [ ] Сайдбар пустой (нет продуктовых пунктов навигации).
- [ ] В authorized runtime нет загрузки профильных виджетов.
- [ ] В штатном авторизованном сценарии не выполняются запросы `/api/v1/admin/profile/api/**`.
- [ ] Вызов `GET /api/v1/me` остаётся и корректно формирует auth-контекст.
- [ ] Неизвестный/произвольный route не приводит к crash, показывается корректный fallback.
- [ ] Обновлённый набор lint/test/e2e smoke проходит.

## Проверка (команды)
```bash
# Статика/типы
npm --prefix hub-shell run lint

# Unit/integration frontend
npm --prefix hub-shell run test

# E2E smoke auth-only shell
npm --prefix hub-shell run e2e:smoke
```

## Результат в отчёте
- Какие компоненты/маршруты/виджеты выведены из runtime.
- Какие сетевые запросы остались в auth-only сценарии.
- Какие тесты обновлены и пройдены.
- Какие follow-up шаги нужны для полного удаления legacy-кода (если останется).
