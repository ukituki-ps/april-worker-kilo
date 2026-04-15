# План: Unified Ingress + Auth UX Hardening (Этап 012)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-15
- **Статус плана:** согласован (рабочий)

## Исходные допущения
- Этапы `002` и `003` корректно закрыли MVP auth/RBAC + UX зоны, но без единого ingress пути.
- Для dev-стенда приемлем один Nginx entrypoint без TLS-терминации в рамках этой задачи.
- Ключевая цель — доступность runtime без прямого использования host-port пользователем.

## Порядок работ (шаги)
1. Зафиксировать целевую ingress-схему маршрутов (`/`, `/api/`, auth path Keycloak) и ограничить blast radius.
2. Обновить `docker-compose.yml`:
   - подключить/расширить Nginx runtime routing,
   - проверить связи сервисов и внутренние порты,
   - минимизировать публично проброшенные порты runtime сервисов.
3. Обновить `infra/nginx/default.conf` (или выделить runtime conf), сохранив docs-маршруты.
4. Синхронизировать env-настройки (`.env.example`, runtime vars) под unified ingress.
5. Обновить smoke scripts для проверки auth/API через единый вход.
6. Прогнать проверки (`docker compose ... config`, smoke), зафиксировать результаты.
7. Обновить документацию деплоя и оформить итоговый `REPORT.md`.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | Без изменений бизнес-логики; возможны только env/runtime адаптации |
| Frontend | Runtime URL/flow через единый ingress (без прямых пользовательских портов) |
| БД / Atlas | Не затрагивается |
| Инфра / Compose | Nginx routing + compose ports/proxy topology |
| Документация / OpenAPI | Обновление deployment/auth smoke описания; OpenAPI без контрактных изменений |

## Риски и откат
- **Риск:** некорректный proxy-path Keycloak (redirect/login loop) -> **Митигация:** проверить login/logout и callback на реальном smoke-сценарии.
- **Риск:** поломка docs маршрутов Nginx -> **Митигация:** сохранить и проверить `/`, `/openapi/`, `/swagger/`.
- **Риск:** несовместимость с текущим deploy flow -> **Митигация:** сверка с `deploy.sh` и `docs/DEPLOYMENT_STRATEGY.md`.
- При необходимости отката: вернуть предыдущие версии `docker-compose.yml`, `infra/nginx/default.conf`, env и smoke-скриптов; затем повторно выполнить compose up и health/smoke.

## Проверка после выполнения
- Команды:
  - `docker compose --profile aprilhub config`
  - `./scripts/smoke-aprilhub.sh`
  - `./scripts/smoke-after-deploy.sh`
- Ручная проверка:
  - Открытие shell по единому URL,
  - login через Keycloak без ручного перехода на другой порт,
  - успешный вызов `GET /api/v1/me` после авторизации.

## Примечания
- Связанные материалы: `tasks/002-aprilhub-auth-rbac/REPORT.md`, `tasks/003-aprilhub-shell-design-system/REPORT.md`.
- Обновления плана:
  - `2026-04-15` — первичная фиксация плана для этапа `012`.
