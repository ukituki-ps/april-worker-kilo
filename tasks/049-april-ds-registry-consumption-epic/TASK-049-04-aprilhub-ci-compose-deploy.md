# 049-04 — AprilHub: CI, compose и деплой под установку пакетов из registry

## Мета

- **Эпик:** [`049`](./TASK.md)
- **Зависимость:** [`049-03`](./TASK-049-03-aprilhub-hub-shell-registry-deps.md) (lock + package.json)

## Цель

Обеспечить, чтобы **GitHub Actions** (в т.ч. `hub-shell`, `hub-shell-alpine-runtime`, bootstrap) и при необходимости **Docker / deploy** получали доступ к **GitHub Packages** для `npm ci` / `npm install` без утечки токенов в логи и артефакты.

## Входит в объём

- `.github/workflows/ci.yml` (и связанные: `bootstrap-ci.yml`, `dev-deploy.yml` при необходимости): `NODE_AUTH_TOKEN`, permissions `packages:read`
- Документация секретов в **GitHub repository settings** (чеклист в `DEPLOYMENT_STRATEGY.md` или `docs/guides/` — согласовать с 049-02, без дублирования длинных блоков)
- `docker-compose.yml` / `deploy.sh`: если сборка образа выполняет `npm ci` внутри Dockerfile — передать build-arg или секрет согласно best practices
- Self-hosted runner на `192.168.1.29`: убедиться, что переменные/секреты доступны job'ам, которые собирают hub-shell

## Не входит

- Публикация пакетов (DisignApril)

## Критерии готовности

- [ ] Зелёный прогон CI на PR после merge зависимостей из registry
- [ ] Deploy to dev (при сценарии с образами) не ломается; при ручном `npm ci` на сервере описан порядок

## Проверка

Запуск соответствующих workflow в тестовом PR; локально эмуляция с `NODE_AUTH_TOKEN`.

## Результат

PR в `april-worker` с правками workflow/compose; ссылка в `REPORT.md` эпика 049.
