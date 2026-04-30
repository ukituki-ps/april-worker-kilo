## 1) Итого

- Статус: ✅ выполнено
- Задача: восстановление DS-темы Keycloak после rollback на стоковый UI
- Ветка: `fix/keycloak-theme-rollback-restore`
- Коммиты: не создавались
- PR: не создавался

## 2) Что сделано

- [incident/triage] Проверен контур темы Keycloak: в `docker-compose.yml` и `infra/keycloak/realm/april-realm.json` wiring корректный (`aprilhub` уже прописан).
- [root cause] Подтверждена причина отката: настройки realm живут в Postgres Keycloak; повторный `--import-realm` не гарантирует возврат `loginTheme/accountTheme` для уже существующего realm после ручных/внешних изменений.
- [infra] В `deploy.sh` добавлен обязательный шаг `ensure_keycloak_realm_theme`, который после compose-синхронизации принудительно выравнивает theme realm и пишет отдельный deploy-артефакт логов.
- [ops/script] Добавлен `scripts/keycloak-ensure-april-theme.sh` (идемпотентный хелпер через `kcadm`), который:
  - логинится в `master`,
  - выставляет `loginTheme=aprilhub`, `accountTheme=aprilhub`,
  - верифицирует итоговое состояние realm.
- [docs] Добавлена micro-task папка с `TASK.md`/`REPORT.md`, обновлён индекс в `task_list.md`.

## 3) Изменённые файлы

- `deploy.sh`
- `scripts/keycloak-ensure-april-theme.sh`
- `task_list.md`
- `tasks/2026-04-30-micro-keycloak-theme-rollback-restore/TASK.md`
- `tasks/2026-04-30-micro-keycloak-theme-rollback-restore/REPORT.md`

## 4) Миграции и данные

- Миграции Atlas: нет
- Какие таблицы/индексы изменены: нет
- Обратимость: да, откат через удаление шага `ensure_keycloak_realm_theme` и скрипта; текущая реализация не меняет схему БД

## 5) Проверка качества

- Линтер: ok (IDE diagnostics)
- Сборка: n/a (изменения только deploy/script/docs)
- Unit tests: n/a
- Integration tests: n/a
- E2E / smoke: частично (операционный runtime-check скрипта на живом Keycloak)

Команды (фактически выполненные):

```bash
bash -n deploy.sh
bash -n scripts/keycloak-ensure-april-theme.sh
./scripts/keycloak-ensure-april-theme.sh
```

Результат ключевой проверки:
- `realm=april loginTheme=aprilhub accountTheme=aprilhub` — подтверждено.

## 6) Деплой

- Среда: локальное dev-окружение (только проверка скрипта)
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md`
- Образы: не применялось
- Health / readiness: не применялось
- Rollback: не применялось

## 7) Риски и ограничения

- Скрипт опирается на доступность работающего контейнера `keycloak` и admin credentials (`KEYCLOAK_ADMIN`/`KEYCLOAK_ADMIN_PASSWORD`).
- Если Keycloak недоступен на момент деплоя, шаг завершится ошибкой и остановит deploy (это намеренно, чтобы не пропустить повторный rollback темы).

## 8) Что осталось

- [ ] Опционально: добавить в smoke-check отдельную явную валидацию `accountTheme` через admin API (сейчас smoke уже валидирует login-тему по HTML/CSS ссылкам).
