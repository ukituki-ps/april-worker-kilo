# Задача: Hub Shell Composition Runtime + дизайн-системный UX (Этап 003)

## Мета
- **ID / ветка:** `003-aprilhub-shell-design-system`
- **Приоритет:** высокий
- **Связанные документы:** `task_list.md`, `tasks/000-aprilhub-full-service-roadmap/TASK.md`, `tasks/000-aprilhub-full-service-roadmap/PLAN.md`, `tasks/002-aprilhub-auth-rbac/REPORT.md`, `docs/guides/DESIGN_SYSTEM.md`, `docs/auth-jwt-keycloak-adapted.md`, `docs/architecture/APRILHUB_C3_C4.md`, `docs/architecture/C4_RUNTIME_SEQUENCES.md`

## Цель
Реализовать этап `003` roadmap: рабочий **Hub Shell Composition Runtime** (App Shell Core, Registry, Loader, Composition Layer, Shared UX Layer) и согласованный с дизайн-системой UX для трёх зон (guest/Keycloak/authorized), чтобы `hub-shell` стал полноценной компоновочной оболочкой для последующих интеграций этапа `004`.

## Контекст для агента
- Этап `002` завершил auth/runtime контур (`OIDC`, `JWT`, `/me`, role guards); текущий этап строит composition runtime поверх него.
- По `000-aprilhub-full-service-roadmap` этап `003` включает: App Shell Core, Registry, Loader, Composition Layer, Shared UX Layer, fallback/error boundaries, роутинг и инициализацию пользовательского контекста.
- В этот же этап включён дизайн-системный UX: guest зона, Keycloak transitions, authorized зона.
- Источник ролей и прав остаётся только Keycloak; UI использует данные `/me` и token claims без отдельной IAM-логики.

## Входит в объём
- Реализовать **App Shell Core** в `hub-shell`:
  - каркас приложения (header/navigation/content),
  - единая точка инициализации user context (`user`, `roles`, `orgScope`, `correlationId` где применимо на уровне shell).
- Реализовать **Registry + Loader + Composition Layer** MVP:
  - декларативный реестр модулей/виджетов shell,
  - безопасная загрузка/рендер через loader abstraction,
  - базовый composition runtime с контролируемой деградацией.
- Реализовать **Shared UX Layer**:
  - стандартные состояния loading/empty/error/forbidden,
  - fallback/error boundaries для частичных отказов компонуемых блоков.
- Реализовать дизайн-системный UX для трёх зон:
  - **неавторизованная зона** (guest/login gate),
  - **Keycloak transitions** (`redirecting`, `return from IdP`, `session expired`),
  - **авторизованная зона** (app shell + стартовая компоновка).
- Согласовать маршрутизацию guest/authorized зон и bootstrap контекста после login.
- Обновить документацию по запуску/проверке composition runtime и UX-сценариев.
- Добавить frontend-тесты для критичных сценариев composition+UX (минимум unit/smoke).

## Не входит в объём
- Полная бизнес-реализация downstream-виджетов и сложной агрегации данных (этап `004` и далее).
- Финализация BFF fan-out orchestration, retry/timeout политики на стороне backend (этап `004`).
- Полная production-кастомизация Keycloak темизации (глубокий branding/localization/SPI).
- Глобальный рефакторинг backend auth-контрактов из `002` без явной необходимости.
- Финальный E2E-регресс всего продукта beyond smoke.

## Технические ограничения
- Стек строго по `docs/AGENT_ARCHITECTURE_CONTEXT.md` (React/TS/Vite + Keycloak; без замены на альтернативные IAM/UI платформы).
- Использовать дизайн-систему April (см. `docs/guides/DESIGN_SYSTEM.md`) и существующие паттерны проекта.
- IAM-модель не дублировать в UI: роли/права читаются из `/me` и token claims.
- Composition runtime не должен ломать контракты `002` (`/me`, 401/403 strategy, controlled re-login).
- API-контракты не менять без синхронного обновления OpenAPI (если затрагиваются).
- Секреты/ключи не коммитить; только env-шаблоны и dev-safe конфигурация.

## Критерии готовности (acceptance)
- [ ] Реализован App Shell Core (layout + навигационный каркас + контекст пользователя).
- [ ] Реализованы Registry/Loader/Composition Layer MVP для подключения и отображения shell-модулей.
- [ ] Реализованы fallback/error boundaries для частичных отказов в composition runtime.
- [ ] В `hub-shell` реализована дизайн-системная неавторизованная зона (guest/login gate).
- [ ] В `hub-shell` реализована дизайн-системная авторизованная зона (app shell + shared states).
- [ ] Login/logout/session-expired flow через Keycloak имеет понятные переходные состояния и без redirect-loop.
- [ ] Доступ с недостаточной ролью отображается консистентным access denied состоянием.
- [ ] Добавлены/обновлены frontend-тесты ключевых состояний composition+auth UX.
- [ ] Локальные проверки (`lint`, `build`, тесты) проходят.
- [ ] Документация по запуску и проверке composition+UX сценариев обновлена.
- [ ] В `REPORT.md` зафиксированы ограничения MVP composition runtime и follow-up к `004/008/010`.

## Проверка (команды)
```bash
# frontend quality gates
cd hub-shell && npm run lint && npm run build

# если добавлены тесты
cd hub-shell && npm run test

# runtime smoke
docker compose --profile aprilhub up -d

# ручной smoke:
# 1) открыть hub-shell как неавторизованный пользователь и проверить guest/login gate
# 2) выполнить login через Keycloak и проверить инициализацию authorized app shell
# 3) проверить отрисовку composition-модулей через registry/loader
# 4) имитировать отказ части модулей и проверить fallback/error boundaries
# 5) проверить insufficient-role сценарий (access denied UX)
# 6) проверить logout/session-expired и возврат в guest/login без redirect-loop
```

## Результат в отчёте
После выполнения оформить `REPORT.md` в этой задаче: перечислить изменённые модули composition runtime, UX-артефакты, тесты, фактические проверки, ограничения MVP и follow-up к этапам `004`, `008`, `010`.
