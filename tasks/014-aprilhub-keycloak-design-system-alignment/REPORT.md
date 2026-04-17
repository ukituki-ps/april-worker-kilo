## 1) Итого
- Статус: ⏳ в работе (аудит выполнен, полное покрытие не завершено)
- Задача: Keycloak UI/Theming Alignment with April Design System (Этап 014)
- Ветка: `feature/aprilhub-implementation`
- Коммиты: `не создавались`
- PR: не создавался

## 2) Что сделано
- [audit] Выполнен аудит неадминских экранов Keycloak относительно требований полного визуального покрытия AprilHub.
- [inventory] Зафиксирован фактический scope активированных flow на основе `infra/keycloak/realm/april-realm.json`:
  - в realm явно назначены только `loginTheme/accountTheme` и i18n (`defaultLocale: ru`);
  - отдельные кастомные `authenticationFlows`/`requiredActions`/`browserFlow` в импорте не заданы;
  - активный пользовательский сценарий в текущей конфигурации: стандартный login flow + account console.
- [inventory-runtime] Через Admin API подтверждено состояние realm-переключателей:
  - `resetPasswordAllowed = false`,
  - `verifyEmail = false`,
  - `registrationAllowed = false`.
- [infra] Подтверждено подключение пользовательской темы в runtime:
  - `docker-compose.yml` монтирует только custom theme каталог `./infra/keycloak/themes/aprilhub` в `/opt/keycloak/themes/aprilhub` (без затирки встроенных тем Keycloak);
  - realm импортируется из `infra/keycloak/realm/april-realm.json`.
- [realm] Подтверждено назначение темы на уровне realm:
  - `loginTheme: "aprilhub"`,
  - `accountTheme: "aprilhub"`.
- [theme] Подтверждено наличие кастомных CSS/asset для `login` и `account`:
  - `infra/keycloak/themes/aprilhub/login/resources/css/aprilhub-login.css`,
  - `infra/keycloak/themes/aprilhub/account/resources/css/aprilhub-account.css`,
  - logo/favicon для login.
- [theme-fix] Исправлена совместимость account theme с Keycloak 26:
  - в `infra/keycloak/themes/aprilhub/account/theme.properties` parent изменён на `keycloak.v3`;
  - устранён риск падения `accountTheme` из-за некорректного parent (`keycloak`) на новых версиях.
- [smoke] Подтверждено наличие branded login в smoke:
  - `scripts/smoke-aprilhub.sh` проверяет загрузку login страницы;
  - есть проверка на подключение CSS темы `aprilhub` и присутствие русскоязычных login-строк.
- [runtime] Выполнена ручная проверка через `http://localhost:8080/auth`:
  - OIDC discovery endpoint отвечает `200` после готовности Keycloak;
  - authorization endpoint с PKCE возвращает branded login HTML (`kc-form-login` + `aprilhub` CSS + `lang=\"ru\"`);
  - при невалидном POST login-action возвращается login error page в branded теме (`aprilhub-login.css`).
- [required-actions] Попытка принудительно проверить `UPDATE_PASSWORD` через Admin API + browser flow зафиксирована, но стабильный переход на форму обновления пароля не воспроизводится в текущем dev-стенде:
  - после назначения `requiredActions: [UPDATE_PASSWORD]` login submit завершается `HTTP 400`,
  - возвращаемая страница остается в branded теме (`aprilhub-login.css`),
  - required-actions форма (`kc-passwd-update-form`) не появляется.
- [required-actions-root-cause] Установлена причина `HTTP 400` в локальном стенде:
  - Keycloak выставляет auth cookies как `Secure; SameSite=None` (`AUTH_SESSION_ID`, `KC_AUTH_SESSION_HASH`, `KC_RESTART`);
  - при проверке через `http://localhost` secure-cookie не возвращаются на `login-actions/authenticate`, что даёт `cookie_not_found` в логах Keycloak и срывает required-actions переход.
- [mobile] Добавлены адаптивные правила в CSS темы:
  - `login`: карточка/типографика/лого/контролы на `max-width: 768px`;
  - `account`: базовые отступы/карточки/контролы на `max-width: 768px`.
- [gap] Выявлено ограничение текущей реализации: кастомизация выполнена в основном через CSS; отдельных override-шаблонов (`.ftl`) и собственных message bundles для неадминского контура нет.

## 3) Карта покрытия неадминских экранов (desktop/mobile)

| Экран / пользовательский flow | Desktop | Mobile | Статус | Evidence / примечание |
| --- | --- | --- | --- | --- |
| Login (основная страница входа) | ✅ | ⚠️ | Частично покрыто | Проверено runtime через PKCE auth endpoint: `kc-form-login`, RU `lang`, `aprilhub` CSS; mobile подтвержден только через CSS-правки |
| Login error/info states (в рамках стандартного login layout) | ✅ | ⚠️ | Частично покрыто | В `aprilhub-login.css` есть стили alert/link/button; runtime зафиксирован branded error page при HTTP 400 login-action |
| Required actions (reset/update/verify и эквивалентные шаги) | ⚠️ | ⚠️ | Не подтверждено | В текущем realm `reset/verify/registration` отключены; `UPDATE_PASSWORD` сценарий не воспроизведен (login submit -> branded HTTP 400, без required-actions формы) |
| Account console (неадминский пользовательский профиль) | ⚠️ | ⚠️ | Частично покрыто | Исправлены wiring и parent для account theme (`keycloak.v3`), но нет подтверждённого e2e evidence для авторизованных account страниц |
| Экзотические/редкие неадминские экраны (если будут активированы позже) | ❌ | ❌ | Не покрыто по acceptance | Нет template/message overrides и регламентированной проверки desktop/mobile |

Легенда:
- `✅` подтверждено соответствие AprilHub визуалу в рамках проверки.
- `⚠️` частичное покрытие/нет полного подтверждения acceptance.
- `❌` не покрыто или не подтверждено.

## 4) Изменённые файлы в рамках аудита
- `tasks/014-aprilhub-keycloak-design-system-alignment/TASK.md` (актуализированы требования полного покрытия)
- `tasks/014-aprilhub-keycloak-design-system-alignment/REPORT.md` (этот отчёт)
- `docker-compose.yml` (исправлен mount custom Keycloak theme без затирки built-in themes)
- `infra/keycloak/themes/aprilhub/login/resources/css/aprilhub-login.css` (добавлена адаптивность mobile viewport)
- `infra/keycloak/themes/aprilhub/account/resources/css/aprilhub-account.css` (добавлена адаптивность mobile viewport)
- `infra/keycloak/themes/aprilhub/account/theme.properties` (parent обновлён до `keycloak.v3`)

## 5) Проверка качества
- Проверка структуры темы: ok (наличие `login/account` theme properties, CSS, assets).
- Проверка realm wiring: ok (`loginTheme/accountTheme` в `infra/keycloak/realm/april-realm.json`).
- Проверка runtime wiring: ok (монтаж theme volume в `docker-compose.yml`).
- Проверка theme wiring для account: частично (устранены ошибки конфигурации mount/parent, но нет финального e2e подтверждения для авторизованного account UI).
- Проверка smoke-логики: ok (`scripts/smoke-aprilhub.sh` содержит проверку branded login CSS и русских строк на login странице).
- Ручная runtime-проверка login/error через ingress: ok (`http://localhost:8080/auth`, PKCE auth endpoint, branded CSS в HTML).
- Runtime-проверка realm toggles через Admin API: ok (`resetPasswordAllowed=false`, `verifyEmail=false`, `registrationAllowed=false`).
- Runtime-проверка `UPDATE_PASSWORD` required action: частично (назначение действия успешно, но переход на required-actions форму в браузерном flow не воспроизведен).
- Диагностика cookie/session для required-actions: ok (зафиксированы secure-cookie и корреляция с `cookie_not_found` в логах Keycloak).
- End-to-end визуальная проверка всех потенциальных неадминских экранов: не завершена.
- Проверка desktop/mobile по полной матрице экранов: не завершена.

Команды/проверки для закрытия этапа:
```bash
docker compose --profile aprilhub config
docker compose up -d keycloak
./scripts/smoke-aprilhub.sh
```

## 6) Деплой
- Среда: локальный runtime/аудит конфигурации.
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md`.
- Образы: не применялось.
- Rollback: не применялся.

## 7) Риски и ограничения
- Styling-only подход (без `.ftl` override) не гарантирует 100% контролируемый визуал для всех edge/auth screens.
- Без формализованного списка активированных user flow экранов нельзя верифицировать критерий "обычный пользователь видит только AprilHub визуал".
- Отсутствует зафиксированный mobile чек-лист по всем экранам неадминского контура.
- Required-actions сценарии требуют отдельной стабилизации dev-проверки (или согласованной активации соответствующих realm toggles/flow).
- Верификация account console требует авторизованного e2e шага через `account-console` клиент/flow, который пока не добавлен в smoke.
- Для финального закрытия required-actions нужен HTTPS-бейзлайн проверки (dev-домен/ingress с TLS) либо отдельный тестовый контур, где secure-cookie корректно возвращаются.

## 8) Что осталось для полного закрытия 014
- [x] Составить и зафиксировать инвентарь активированного в realm пользовательского flow (базовый уровень).
- [x] Закрыть первичные визуальные gaps по mobile viewport (адаптивные CSS-правки для login/account).
- [ ] Закрыть оставшиеся визуальные gaps: при необходимости добавить override-шаблоны и/или расширить CSS, чтобы исключить дефолтный Keycloak визуал для всех неадминских экранов.
- [ ] Подтвердить desktop/mobile соответствие по каждому экрану из инвентаря (required-actions/account — после запуска HTTPS-проверки).
- [ ] Обновить матрицу покрытия до статуса `✅` для всех доступных пользователю экранов.
- [ ] Зафиксировать итоговые evidence (скриншоты, ссылки на проверки, smoke/e2e результаты) в этом отчёте.
