## 1) Итого

- Статус: выполнено
- Задача: исправление дефолта пути деплоя GitHub Actions для AprilHub (`april-worker`)
- Ветка: `fix/046-dev-deploy-git-root`
- Коммиты: единый коммит на ветке `fix/046-dev-deploy-git-root` (до merge)
- PR: https://github.com/ukituki-ps/april-worker/pull/92

## 2) Инцидент и классификация (CI / Git, не runtime Sentry)

1. **Инцидент:** падение workflow **Deploy to dev** (`.github/workflows/dev-deploy.yml`) на шаге checkout коммита после `push` в `develop` репозитория `ukituki-ps/april-worker`.
2. **Корреляция Sentry → Loki → Prometheus:** не применима; это сбой **инфраструктуры CI/deploy** (git), а не HTTP/UI runtime.
3. **Наблюдения:** в workflow передаётся `github.sha` из **april-worker**, а дефолтный `APRIL_DEPLOY_ROOT` был `/opt/april-profile` (наследие шаблона AprilProfile). Если на сервере в этом пути клон `april-profile`, объект коммита отсутствует → `git checkout` завершается ошибкой.
4. **Классификация:** **infra / конфигурация деплоя** (несоответствие клона и репозитория события). Owner: команда AprilHub + администратор runner/сервера.
5. **Изменения:** см. раздел «Что сделано»; риск: на стендах, где уже выставлена переменная `APRIL_DEPLOY_ROOT`, поведение не меняется; где полагались на дефолт `/opt/april-profile` для **именно** клона april-worker — нужно один раз выставить переменную или перенести клон в `/opt/april-worker`.
6. **Верификация:** после merge — убедиться, что на dev-хосте каталог из `APRIL_DEPLOY_ROOT` — клон `ukituki-ps/april-worker` и `git fetch && git checkout <sha из Actions>` проходит для свежего push в `develop`.

## 3) Что сделано

- [infra] Дефолт `APRIL_DEPLOY_ROOT` в `dev-deploy.yml` заменён на `/opt/april-worker`, добавлены комментарии.
- [docs] Обновлены `docs/DEPLOYMENT_STRATEGY.md`, `docs/guides/PROJECT_DEFAULTS.md` (разделение AprilHub / AprilProfile).
- [docs+scripts] Раздел **§5.1** «Что должно быть на сервере один раз» и `scripts/bootstrap-server-deploy-once.sh` (идемпотентная подготовка `.env`/`images.env`); скрипт выполнен на dev-хосте `192.168.1.42` (`.env`/`images.env` уже были).

## 4) Изменённые файлы

- `.github/workflows/dev-deploy.yml`
- `docs/DEPLOYMENT_STRATEGY.md`
- `docs/guides/PROJECT_DEFAULTS.md`
- `tasks/046-aprilhub-dev-deploy-git-root/TASK.md`
- `tasks/046-aprilhub-dev-deploy-git-root/REPORT.md`

## 5) Миграции и данные

- Миграции Atlas: нет

## 6) Проверка качества

- Линтер: не запускался для yaml-only
- Сборка: не требовалась для данного изменения

Команды (рекомендуемые на сервере после merge):

```bash
cd /opt/april-worker   # или значение APRIL_DEPLOY_ROOT
git remote -v
git fetch origin
git cat-file -t <SHA_из_failed_run>   # должен вернуть commit
```

## 7) Деплой

- Среда: GitHub Actions self-hosted (`dev`, `profile`)
- Образы: не затронуты

## 8) Риски и ограничения

- Если клон april-worker намеренно лежит не в `/opt/april-worker`, задайте **repository variable** `APRIL_DEPLOY_ROOT` в GitHub на фактический путь.

## 9) Что осталось

- [ ] На стенде подтвердить путь клона и при необходимости задать `APRIL_DEPLOY_ROOT` в настройках репозитория GitHub.
