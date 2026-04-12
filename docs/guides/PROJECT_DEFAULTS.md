---
sidebar_position: 1
---

# Проектные значения (aprilWorker)

Значения для репозитория **ukituki-ps/april-worker**; при смене хоста или путей обновите таблицу и связанные документы.

| Имя | Значение | Назначение |
| --- | -------- | ---------- |
| `DEV_HOST` | `dev.example.com` | Публичный хост dev-стенда (подставьте свой) |
| `DEPLOY_ROOT` | `/opt/april-worker` | Каталог git-клона на сервере |
| `DEPLOY_USER` | `deploy` | Пользователь ОС для SSH и runner |
| `GITHUB_REPO_SLUG` | `ukituki-ps/april-worker` | Репозиторий в `git@github.com:` |
| `RUNNER_LABEL_EXTRA` | `worker` | Доп. label self-hosted runner (вместе с `dev`) |
| `APRIL_DEPLOY_ROOT` | как `DEPLOY_ROOT` | Имя **repository variable** в GitHub Actions (при необходимости переименуйте) |

Workflow ожидает runner с `runs-on: [self-hosted, dev, worker]`.
