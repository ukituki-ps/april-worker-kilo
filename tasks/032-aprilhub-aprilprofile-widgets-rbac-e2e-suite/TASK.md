# Задача 032: полноценный тестовый контур AprilHub + виджеты AprilProfile (роли, сценарии, регрессия UI)

## Мета
- **ID / ветка:** `032-aprilhub-aprilprofile-widgets-rbac-e2e-suite`
- **Приоритет:** высокий (закрывает пробел между «много ошибок в интерфейсе» и воспроизводимой диагностикой)
- **Связанные документы:**
  - [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md) — mandatory vs P1/P2, Playwright, nightly
  - [`docs/runbooks/APRILHUB_4A_WIDGET_RELEASE_GATE.md`](../../docs/runbooks/APRILHUB_4A_WIDGET_RELEASE_GATE.md) — критичный путь виджетов 4a, RBAC
  - [`docs/guides/APRILHUB_PLAYWRIGHT_PERSONAS.md`](../../docs/guides/APRILHUB_PLAYWRIGHT_PERSONAS.md) — матрица персон и спеки
  - `hub-shell/tests/e2e/*.spec.ts` — smoke / RBAC / integration (ранее единый `smoke.spec.ts`)
  - [`scripts/run-playwright-aprilhub.sh`](../../scripts/run-playwright-aprilhub.sh), [`scripts/smoke-aprilhub.sh`](../../scripts/smoke-aprilhub.sh)
  - [`task_list.md`](../../task_list.md); этапы `019`/`020` (базовый контур и расширения)
  - внешняя спецификация виджетов и semver: репозиторий `april-profile-1` (`docs/VERSIONING_AND_COMPATIBILITY.md`, `docs/WIDGET_RELEASE_CHECKLIST.md` при необходимости)

## Цель
Свести к **воспроизводимому, ролевому и сценарному** набору проверок всё, что сегодня даёт «кучу ошибок по интерфейсу» в AprilHub при работе с **хостингом виджетов AprilProfile** (карточка, список, экземпляры, история, конфликты/merge, навигация shell): чтобы каждая роль имела явные ожидания по экранам и API, а падения фиксировались в CI/nightly с артефактами (trace, скриншоты), а не только ручным кликом.

## Контекст для агента
- Персоны и проекты Playwright зафиксированы в [`docs/guides/APRILHUB_PLAYWRIGHT_PERSONAS.md`](../../docs/guides/APRILHUB_PLAYWRIGHT_PERSONAS.md); `globalSetup` пишет `storageState` для privileged/restricted.
- Часть сценариев использует `page.route` со стабами — это ускоряет smoke, но **не ловит** рассинхрон контрактов с реальным BFF/адаптерами и регрессии в `@april/profile-ui`. В постановке нужно явно разделить: **smoke со стабами** vs **интеграционные e2e** (или отдельный тег/проект Playwright) против поднятого контура.
- RBAC и аутентификация — keycloak-first; тесты не должны обходить проверку токенов/ролей в пользу «магических» моков на уровне приложения.
- Перед крупными изменениями свериться с [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](../../docs/AGENT_ARCHITECTURE_CONTEXT.md) и с актуальными маршрутами shell/BFF в коде.

## Матрица ролей ↔ UI / BFF (кратко)

Полная таблица: [`docs/guides/APRILHUB_PLAYWRIGHT_PERSONAS.md`](../../docs/guides/APRILHUB_PLAYWRIGHT_PERSONAS.md).

| Персона | Keycloak user (dev) | RBAC в Hub |
|---------|---------------------|------------|
| Гость | — | только публичная зона |
| Привилегированный | `april-dev` (`user`+`admin`) | admin BFF, все пункты сайдбара |
| Ограниченный | `april-user` (`user`) | нет admin-пунктов; 403 на profile admin API; запрет conflicts/admin-control |

## Входит в объём

### 1. Матрица ролей и персон (Keycloak)
- Зафиксировать в задаче/доке репозитория **таблицу персон**: как минимум гость, пользователь без `admin`, пользователь с `admin` (и другие роли, если уже объявлены в realm-экспорте или в коде BFF — сверить с `hub-bff` guards и навигацией `hub-shell`).
- Обеспечить **воспроизводимое** создание учёток в dev/realm-документации (realm JSON, `docker-compose` init, или явный runbook «как добавить пользователя») без коммита секретов; пароли — только через env/secrets.
- В Playwright: **отдельные `storageState` или projects** на персону, чтобы не дублировать логин в каждом тесте и стабилизировать прогон.

### 2. Сценарии AprilHub (оболочка)
- Гостевая зона, CTA входа, редирект OIDC, возврат в авторизованную зону.
- Меню shell, deep-link после входа, выход.
- Для каждой релевантной роли: какие пункты навигации **видны / скрыты**, прямые URL на запрещённые разделы → ожидаемый **запрет** (как уже для `#/app/profile/admin/conflicts` без admin).

### 3. Сценарии виджетов AprilProfile (хост в Hub)
Покрыть критичный путь из release gate (расширить и параметризовать по ролям там, где уместно):

| Область | Минимум проверок |
|--------|------------------|
| Карточка сущности | загрузка, ошибки 404/500 от BFF, сохранение, `onSaveSuccess` / UX после сохранения |
| Список профилей | список, создание, валидация, пустое состояние |
| Экземпляры | список, обновление, связь с версией |
| История версий | отображение, навигация назад |
| Конфликты / merge | только для ролей с доступом; для остальных — редирект/запрет без «битого» UI |

Для каждого сценария: **ожидаемые элементы** (`data-testid` / роли), **отсутствие необработанных ошибок React** (по возможности — assert на отсутствие типового error boundary или сообщения об ошибке там, где ожидается штатный UX).

### 4. Архитектура тестового кода
- Разнести спеки: например `e2e/guest.spec.ts`, `e2e/rbac-matrix.spec.ts`, `e2e/profile-widgets-*.spec.ts` + общие фикстуры (`fixtures/auth.ts`, хелперы маршрутов).
- Единая точка конфигурации базового URL и таймаутов; документировать env в `hub-shell/README` или в `docs/guides` **только если** уже ведётся там же для e2e (не плодить дубли без нужды).
- Договориться о **тегах** (`@smoke` / `@integration`) или отдельных `playwright.config` projects для nightly vs быстрого PR (согласовать с владельцем CI: сейчас nightly в [`testing-extensions-nightly.yml`](../../.github/workflows/testing-extensions-nightly.yml)).

### 5. Данные и контракты
- Для интеграционного слоя: либо тестовые фикстуры в BFF/заглушках адаптеров, либо документированный **seed** окружения; при расхождении с OpenAPI — завести подзадачу на контракт, не «ломать» проверку молча.
- При изменениях `@april/profile-ui`: соблюдение semver и чеклиста из `april-profile-1` (см. release gate).

### 6. Качество сигнала при падениях
- Сохранить/усилить политику артефактов Playwright (trace on failure, отчёт).
- В `REPORT.md` задачи: матрица «сценарий × роль × статус», список найденных багов со ссылками на issues/PR.

## Не входит в объём (без отдельного согласования)
- Полный visual regression по всему дизайн-системному каталогу.
- Нагрузочное тестирование виджетов (это остаётся в k6/smoke по [`TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md)).
- Замена Keycloak на мок-аутентификацию в прод-коде ради тестов.
- Реализация новых продуктовых фич вне исправлений, **необходимых** для прохождения уже описанных сценариев (отдельные задачи).

## Технические ограничения
- Секреты и пароли учёток — только env / CI secrets; в репозитории — шаблоны и описание имён переменных.
- Не ослаблять RBAC в BFF/shell ради «зелёных» тестов.
- Следовать существующим скриптам и CI; любое включение новых job в **обязательный** merge gate — только после стабилизации и явного решения (по умолчанию расширение сначала в nightly или opt-in job).

## Критерии готовности (acceptance)
- [x] Описана и задокументирована **матрица ролей ↔ ожидаемое поведение UI и API** (таблица в `TASK.md` и [`docs/guides/APRILHUB_PLAYWRIGHT_PERSONAS.md`](../../docs/guides/APRILHUB_PLAYWRIGHT_PERSONAS.md); runbook 4a).
- [x] В Keycloak dev-контуре (или артефакте инициализации) доступны **все персоны матрицы**; инструкция воспроизведения для локального и CI окружения обновлена (realm JSON + `.env.example`).
- [x] Playwright: проекты `guest` / `chromium`, общий хелпер `loginThroughKeycloak` (учёт `check-sso`); минимум **две роли** (privileged / restricted) покрыты критичными маршрутами из release gate; **негативные** сценарии (нет прав, not-found, 403 без stubs). *Follow-up:* при стабильном прогреве Vite — `storageState` + `globalSetup`, чтобы не дублировать OIDC.
- [x] Реализован проект **`integration`** (`profile-widgets-integration.spec.ts`) — реальный BFF без `page.route`; инструкция в `REPORT.md` и в гайде по персонам.
- [x] `./scripts/run-playwright-aprilhub.sh` и `cd hub-shell && npm run e2e` — см. фактический прогон в `REPORT.md`.
- [x] Обновлены [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md) и [`APRILHUB_4A_WIDGET_RELEASE_GATE.md`](../../docs/runbooks/APRILHUB_4A_WIDGET_RELEASE_GATE.md) (ссылка на матрицу и команды).
- [x] Выполнен `REPORT.md` в каталоге задачи.

## Проверка (команды)
```bash
make openapi-lint
cd hub-bff && go test ./...
cd hub-shell && npm ci && npm run check:profile-ui-semver 2>/dev/null || true
cd hub-shell && npm run lint && npm run test && npm run build
./scripts/smoke-aprilhub.sh
./scripts/run-playwright-aprilhub.sh
# при наличии интеграционного проекта:
# cd hub-shell && npm run e2e -- --project=integration
```

## Результат в отчёте
- Итоговая матрица ролей и сценариев (можно приложить таблицей в `REPORT.md`).
- Список файлов спеков и фикстур; изменения в CI/workflow (если были).
- Подтверждение прогона команд из раздела «Проверка».
- Известные риски (flaky OIDC, время прогона, зависимость от seed данных) и предложения по follow-up.
