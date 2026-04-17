# План: Keycloak UI/Theming Alignment with April Design System (Этап 014)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-17
- **Статус плана:** согласован

## Исходные допущения
- Контур работ ограничен неадминскими пользовательскими экранами Keycloak (login/auth/account) и артефактами задачи `tasks/014-aprilhub-keycloak-design-system-alignment/`.
- Логика OIDC/RBAC/backend-контракты не меняются; source of truth по IAM остается в Keycloak.
- Тема `aprilhub` уже подключена на уровне realm/runtime, но требуется доведение до полного визуального покрытия desktop/mobile без видимого базового Keycloak UI.
- Пользовательские тексты и сообщения в неадминском контуре должны быть на русском языке.

## Порядок работ (шаги)
1. Зафиксировать план и согласовать матрицу покрытия экранов в `REPORT.md` как контрольный список закрытия.
2. Провести инвентаризацию активированных неадминских user flow экранов в текущем realm:
   - login,
   - error/info states,
   - required actions (reset/update/verify и эквивалентные шаги),
   - account console user screens.
3. Сопоставить каждый экран с текущим покрытием `aprilhub` theme и определить gaps (desktop/mobile, русификация, fallback на дефолтный визуал).
4. Закрыть визуальные gaps в теме:
   - расширить CSS для недостающих состояний,
   - при необходимости добавить template/message overrides для экранов, которые нельзя стабильно брендировать только CSS.
5. Проверить согласованность подключений theme в `docker-compose.yml` и realm (`loginTheme`, `accountTheme`) после изменений.
6. Выполнить проверки и smoke/e2e сценарий `guest -> Keycloak -> authorized`.
7. Актуализировать `REPORT.md`: заполнить карту покрытых экранов (desktop/mobile), добавить evidence и итоговый статус по acceptance.
8. При полном закрытии критериев перевести статус этапа `014` в `task_list.md` в консистентное состояние (без противоречий между блоками).

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | Не меняется |
| Frontend | Не меняется (кроме проверки пользовательского flow из `hub-shell`) |
| БД / Atlas | Не меняется, миграции не требуются |
| Инфра / Compose | Возможна точечная актуализация wiring theme/realm в `docker-compose.yml` и `infra/keycloak/realm/april-realm.json` |
| Документация / OpenAPI | `TASK.md`/`PLAN.md`/`REPORT.md` задачи `014`, при необходимости `task_list.md`; OpenAPI без изменений |

## Риски и откат
- **Риск:** часть нечастых auth-экранов останется в дефолтной верстке Keycloak при styling-only подходе. → **Митигация:** инвентаризация flow + точечные template overrides для проблемных страниц.
- **Риск:** визуальная деградация на mobile viewport. → **Митигация:** отдельный mobile чек-лист по каждому экрану матрицы и проверка breakpoints.
- **Риск:** рассинхронизация статусов `014` между разными разделами `task_list.md`. → **Митигация:** единообразно обновлять статус после фактического закрытия acceptance.
- При необходимости отката: вернуть изменения темы/realm/task-документации в предыдущую ревизию ветки.

## Проверка после выполнения
- Команды:
  - `docker compose --profile aprilhub config`
  - `docker compose up -d keycloak`
  - `./scripts/smoke-aprilhub.sh`
- Ручная проверка / smoke:
  - пользовательский сценарий `guest -> login -> authorized` проходит через branded UI;
  - неадминские экраны активированных flow не показывают дефолтный визуал Keycloak;
  - desktop и mobile проверки по матрице в `REPORT.md` закрыты без `⚠️/❌`.

## Примечания
- Связанные документы: `task_list.md`, `tasks/012-aprilhub-unified-ingress-auth-hardening/REPORT.md`, `tasks/016-aprilhub-guest-landing-entrypoint/REPORT.md`, `docs/DEPLOYMENT_STRATEGY.md`.
- Обновления плана:
  - `2026-04-17` — создан план полного визуального покрытия неадминского контура Keycloak под требования AprilHub.
