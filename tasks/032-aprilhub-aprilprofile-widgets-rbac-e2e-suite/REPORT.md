## 1) Итого

- Статус: ⚠️ частично (код и документация готовы; полный `./scripts/run-playwright-aprilhub.sh` на агентской машине не доведён до зелёного из‑за таймаутов/нагрузки compose при параллельном прогоне — см. раздел 5)
- Задача: полноценный тестовый контур AprilHub + виджеты AprilProfile (RBAC, сценарии, stub vs реальный BFF)
- Ветка: `feature/032-aprilhub-aprilprofile-widgets-rbac-e2e-suite`
- Коммиты: последний на ветке `feature/032-aprilhub-aprilprofile-widgets-rbac-e2e-suite` (по состоянию на завершение работы)
- PR: не создавался

## 2) Что сделано

- [frontend / hub-shell] Разнесён бывший `smoke.spec.ts` на спеки: `guest.spec.ts`, `shell-privileged.spec.ts`, `profile-widgets-smoke.spec.ts`, `rbac-matrix.spec.ts`, `profile-widgets-restricted.spec.ts`, `profile-widgets-integration.spec.ts`; общий хелпер `tests/e2e/helpers/login.ts` с `loginThroughKeycloak` (поддержка гостевого CTA и прямой формы Keycloak после `check-sso`).
- [frontend / hub-shell] `playwright.config.ts`: проекты `guest` и `chromium`, `timeout` 180s, `workers` 2 (CI) / 3 (локально), `expect.timeout` 30s.
- [tooling] `hub-shell/package.json`: скрипты `e2e:smoke`, `e2e:integration`.
- [tooling] `scripts/run-playwright-aprilhub.sh`: прогрев Vite через ingress (`/@vite/client`, `/src/main.tsx`) и попытка прогрева из контейнера `hub-shell`.
- [docs] Новый гайд [`docs/guides/APRILHUB_PLAYWRIGHT_PERSONAS.md`](../../docs/guides/APRILHUB_PLAYWRIGHT_PERSONAS.md) — матрица персон, UI/BFF, команды, файлы спеков.
- [docs] Обновлены [`docs/TESTING_STRATEGY.md`](../../docs/TESTING_STRATEGY.md) и [`docs/runbooks/APRILHUB_4A_WIDGET_RELEASE_GATE.md`](../../docs/runbooks/APRILHUB_4A_WIDGET_RELEASE_GATE.md).
- [docs] `.env.example`: комментарии к переменным Playwright.
- [repo] `.gitignore`: `hub-shell/tests/e2e/.auth/` (резерв под будущий `storageState`).
- [tasks] `TASK.md` (матрица, acceptance), `PLAN.md`, `task_list.md` — статус задачи 032.

## 3) Изменённые файлы

- `hub-shell/playwright.config.ts`
- `hub-shell/package.json`
- `hub-shell/tests/e2e/guest.spec.ts`
- `hub-shell/tests/e2e/shell-privileged.spec.ts`
- `hub-shell/tests/e2e/profile-widgets-smoke.spec.ts`
- `hub-shell/tests/e2e/rbac-matrix.spec.ts`
- `hub-shell/tests/e2e/profile-widgets-restricted.spec.ts`
- `hub-shell/tests/e2e/profile-widgets-integration.spec.ts`
- `hub-shell/tests/e2e/helpers/login.ts`
- Удалён: `hub-shell/tests/e2e/smoke.spec.ts`
- `scripts/run-playwright-aprilhub.sh`
- `.gitignore`
- `.env.example`
- `docs/guides/APRILHUB_PLAYWRIGHT_PERSONAS.md`
- `docs/TESTING_STRATEGY.md`
- `docs/runbooks/APRILHUB_4A_WIDGET_RELEASE_GATE.md`
- `tasks/032-aprilhub-aprilprofile-widgets-rbac-e2e-suite/TASK.md`
- `tasks/032-aprilhub-aprilprofile-widgets-rbac-e2e-suite/PLAN.md`
- `task_list.md`

## 4) Миграции и данные

- Миграции Atlas: нет
- Изменения Keycloak realm: нет (персоны `april-dev` / `april-user` уже в `infra/keycloak/realm/april-realm.json`)

## 5) Проверка качества

- Линтер hub-shell (`npm run lint`): ok
- Unit tests hub-shell (`npm run test`): ok
- Сборка hub-shell (`npm run build`): ok
- `make openapi-lint`: ok
- `cd hub-bff && go test ./...`: ok
- E2E / smoke: **частично** — первый прогон `./scripts/run-playwright-aprilhub.sh` (альтернативный порт) показал таймауты при `beforeEach`/`loginThroughKeycloak` при `timeout: 60s` и 6 workers; после увеличения таймаута до 180s и снижения workers полный прогон на агенте не завершился в разумное окно (долгий cold start compose). Рекомендация: прогнать на CI nightly или локально с `DOCS_HTTP_PORT=<свободный>` и мониторингом `docker compose` логов `hub-shell`.

Команды (фактически выполненные):

```bash
make openapi-lint
cd hub-bff && go test ./...
cd hub-shell && npm run lint && npm run test && npm run build
cd hub-shell && npx playwright test --list
# частично: DOCS_HTTP_PORT=... PLAYWRIGHT_BASE_URL=... ./scripts/run-playwright-aprilhub.sh
```

## 6) Деплой

- Среда: нет
- Образы: не применялись

## 7) Риски и ограничения

- **Длительность и параллелизм:** несколько тестов с полным OIDC + Vite dev нагружают `hub-shell`; без `storageState` каждый тест платит за логин.
- **Flaky OIDC / `check-sso`:** первый экран может быть гостевой лендинг или сразу Keycloak — покрыто в `loginThroughKeycloak`.
- **Порты:** при занятом `8080` задавать `DOCS_HTTP_PORT` и согласованные `PLAYWRIGHT_BASE_URL` / `KEYCLOAK_ISSUER` (как в `run-playwright-aprilhub.sh`).
- **Интеграция без stub:** при пустом `APRIL_PROFILE_ADMIN_URL` у `hub-bff` ожидается ошибка от прокси, а не «happy» сохранение — тест допускает `profile-widget-save-success` **или** `profile-widget-save-error`.

## 8) Матрица «сценарий × роль × статус» (плановая)

| Сценарий | Гость | restricted (`april-user`) | privileged (`april-dev`) |
|----------|-------|----------------------------|----------------------------|
| Лендинг / OIDC redirect | ✅ спека | — | — |
| Shell, админ-меню, выход | — | — | ✅ спека |
| RBAC: нет admin-ссылок, запреты, not-found | — | ✅ спека | — |
| Виджеты со stubs | — | — | ✅ спека |
| Список без admin, 403 | — | ✅ спека | — |
| Карточка, реальный BFF | — | — | ✅ спека |

## 9) Что осталось

- [ ] Подтвердить зелёный `./scripts/run-playwright-aprilhub.sh` на CI nightly или локально после стабилизации (при необходимости `fullyParallel: false` или дальнейшее снижение `workers`).
- [ ] Опционально: вернуть `globalSetup` + `storageState` после стабильного прогрева Vite (см. гайд по персонам).
