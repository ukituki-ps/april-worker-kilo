---
sidebar_position: 1
---

# Проектные значения

При смене хоста или путей обновите таблицу для **вашего** репозитория и связанные документы.

## AprilHub (`ukituki-ps/april-worker-kilo

| Имя | Значение | Назначение |
| --- | -------- | ---------- |
| `DEPLOY_ROOT` | `/opt/april-worker` | Каталог **git-клона этого репозитория** на dev-сервере (должен совпадать с remote workflow, иначе `git checkout` по `github.sha` падает) |
| `GITHUB_REPO_SLUG` | `ukituki-ps/april-worker-kilo
| `RUNNER_LABEL_EXTRA` | `profile` | Доп. label self-hosted runner (для deploy jobs вместе с `dev`) |
| `CI_RUNNER_HOST_IP` | `192.168.1.29` | Хост self-hosted runner для CI |
| `CI_RUNNER_LABELS` | `self-hosted, ci, profile` | Labels для CI jobs в `.github/workflows/ci.yml` |
| `APRIL_DEPLOY_ROOT` | как `DEPLOY_ROOT` | **Repository variable** в GitHub Actions для `.github/workflows/dev-deploy.yml` |

Workflow **Deploy to dev** ожидает runner с `runs-on: [self-hosted, dev, profile]`.

## AprilProfile (`ukituki-ps/april-profile-kilo

| Имя | Значение | Назначение |
| --- | -------- | ---------- |
| `DEV_HOST` | `dev.profile.april.ukituki.tech` | Публичный хост dev-стенда AprilProfile |
| `DEV_HOST_IP` | `192.168.1.42` | IP dev-стенда (Orange Pi) |
| `DEPLOY_ROOT` | `/opt/april-profile` | Каталог git-клона на сервере |
| `DEPLOY_USER` | `deploy` | Пользователь ОС для SSH и runner |
| `GITHUB_REPO_SLUG` | `ukituki-ps/april-profile-kilo
| `RUNNER_LABEL_EXTRA` | `profile` | Доп. label self-hosted runner (для deploy jobs вместе с `dev`) |
| `CI_RUNNER_HOST_IP` | `192.168.1.29` | Хост self-hosted runner для CI |
| `CI_RUNNER_LABELS` | `self-hosted, ci, profile` | Labels для CI jobs в `.github/workflows/ci.yml` |
| `APRIL_DEPLOY_ROOT` | как `DEPLOY_ROOT` | Имя **repository variable** в GitHub Actions (при необходимости переименуйте) |

Workflow deploy ожидает runner с `runs-on: [self-hosted, dev, profile]`.  
Workflow CI ожидает runner с `runs-on: [self-hosted, ci, profile]`.
