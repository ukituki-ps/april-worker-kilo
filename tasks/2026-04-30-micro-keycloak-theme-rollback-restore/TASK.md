# Micro-task: восстановление DS-темы Keycloak после rollback

## Мета

- **id:** `2026-04-30-micro-keycloak-theme-rollback-restore`
- **ветка:** `fix/keycloak-theme-rollback-restore`
- **приоритет:** высокий
- **связанные файлы:**
  - `deploy.sh`
  - `scripts/keycloak-ensure-april-theme.sh`
  - `infra/keycloak/realm/april-realm.json`
  - `docker-compose.yml`
  - `scripts/smoke-aprilhub.sh`

## Цель

Найти причину отката Keycloak на стоковый UI и вернуть стабильное применение дизайн-системной темы `aprilhub` для login/account страниц без ручного восстановления через admin console.

## Scope

### Что входит

- Проверка wiring темы в realm/import/compose.
- Выявление причины rollback при повторных деплоях.
- Реализация автоматического восстановления `loginTheme/accountTheme` для существующего realm.
- Обновление task-документации и отчёта.

### Что не входит

- Редизайн CSS/верстки Keycloak темы.
- Изменение IAM-модели, ролей и мапперов.
- Деплой на стенды и ручное администрирование Keycloak через UI.

## Зависимости и ограничения

- Стек и архитектурные границы из `docs/AGENT_ARCHITECTURE_CONTEXT.md` (Keycloak как IAM source of truth).
- Без destructive git-команд и без прямого push в `main`/`develop`.
- Scope ограничен устранением rollback темы и автоматизацией восстановления.

## AGENT_MASTER_PROMPT compliance checklist

- [x] Прочитаны и учтены: `docs/AGENT_MASTER_PROMPT.md`, `README.md`, `task_list.md`, `docs/AGENT_ARCHITECTURE_CONTEXT.md`.
- [x] Для fix-сценария учтён `docs/AGENT_ERROR_TRIAGE_PROMPT.md`.
- [x] Проверены релевантные `.cursor/rules/*`.
- [x] Выполнение end-to-end: анализ -> изменение -> проверка -> `REPORT.md`.

## Acceptance criteria

- [x] Подтверждена первопричина rollback (realm-настройки в БД не гарантированно синхронизируются повторным import).
- [x] В `deploy.sh` есть шаг принудительного выравнивания `loginTheme/accountTheme` для realm `april`.
- [x] Добавлен исполняемый script-хелпер для идемпотентного выравнивания темы через `kcadm`.
- [x] Обновлены `task_list.md` и `REPORT.md` текущей micro-задачи.

## Проверка

```bash
bash -n deploy.sh
bash -n scripts/keycloak-ensure-april-theme.sh
./scripts/keycloak-ensure-april-theme.sh
```

## Ожидаемый результат в REPORT

- Описание root cause rollback.
- Список изменённых файлов и сути исправления.
- Выполненные команды проверок и их результат.
- Риски/ограничения и follow-up.
