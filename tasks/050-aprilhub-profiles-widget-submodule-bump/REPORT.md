## 1) Итого

- Статус: ✅ выполнено (PR открыт; CI **Hub Shell lint, test and build** и **Hub Shell alpine runtime preflight** зелёные на последнем push)
- Задача: обновление внешнего `profiles-widget` через submodule `vendor/april-profile`, перезапуск `hub-shell` на dev при bump submodule, совместимость сборки с новым `profile-ui`
- Ветка: `feature/050-aprilhub-profiles-widget-submodule-bump`
- Коммиты (ключевые): bump submodule + `deploy.sh` — история ветки до `67a637f`; исправление сборки — **`c734204`** (`fix(hub-shell): bundle @tabler/icons-react for vendored profile-ui`)
- PR: https://github.com/ukituki-ps/april-worker-kilo

## 2) Что сделано

- [frontend] Обновлён git submodule **`vendor/april-profile`** до **`e2cee03a80b221fa75fe1e8dbfd3c87adfae9bb5`** (`origin/develop` на момент bump).
- [frontend] После bump **`profile-ui`** стал импортировать **`@tabler/icons-react`**; из исходников под `vendor/` Vite не резолвил bare module. Добавлены зависимость **`@tabler/icons-react`** в [`hub-shell/package.json`](../../hub-shell/package.json), обновлён **`hub-shell/package-lock.json`**, в [`hub-shell/vite.config.ts`](../../hub-shell/vite.config.ts) — **alias** на `node_modules/@tabler/icons-react` (тот же приём, что для `@mantine/*`).
- [infra / compose / nginx] В **`deploy.sh`**, `sync_frontend_dependencies`: второй **`sync_go_service_on_git_tree_change`** для **`vendor/april-profile`** → **`force-recreate`** **`hub-shell`** при смене только submodule.
- [docs] [`PLAN.md`](./PLAN.md), постановка [`TASK.md`](./TASK.md).

Проверка host-слоя [`hub-shell/src/integrations/april-profile-ui.ts`](../../hub-shell/src/integrations/april-profile-ui.ts): правок контракта не потребовалось.

## 3) Изменённые файлы

- `vendor/april-profile` (submodule pointer)
- `deploy.sh`
- `hub-shell/package.json`, `hub-shell/package-lock.json`, `hub-shell/vite.config.ts`
- `tasks/050-aprilhub-profiles-widget-submodule-bump/{TASK,PLAN,REPORT}.md`
- `task_list.md` (индекс задачи 050)

## 4) Миграции и данные

- Миграции Atlas: нет
- Обратимость: да — revert PR или возврат submodule на предыдущий SHA

## 5) Проверка качества

- Линтер / `tsc` / сборка Vite: **ok** в CI (job **Hub Shell lint, test and build** на run после push `c734204`)
- Unit tests (Vitest): **ok** (тот же job)
- Hub Shell alpine preflight: **ok**
- Локально на машине агента ранее был **EACCES** на `node_modules`; воспроизводимая проверка: **`docker run` node:20 + `npm ci && npm run build`** в смонтированном репозитории — **ok** после alias + зависимости

Команды (эталон для ручной проверки):

```bash
cd hub-shell && npm ci && npm run check:profile-ui-semver && npm run lint && npm run test && npm run build
```

Проверка CI по PR:

```bash
gh pr checks 102
```

## 6) Деплой

- Среда: не выполнялся из этого отчёта (merge в `develop` → типовой **Deploy to dev** по [`DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md))
- После merge: обновлённый **`deploy.sh`** должен пересоздавать **`hub-shell`**, если изменился git-tree **`vendor/april-profile`**

## 7) Риски и ограничения

- Новые peer-подобные зависимости во **`profile-ui`**, объявленные только во внешнем `package.json`, при vendored source нужно дублировать в **`hub-shell`** или добавлять alias — иначе **Vite build** падает; при следующих bump стоит смотреть diff зависимостей `profile-ui`.
- Первый деплой после появления state-файла для нового шага в `deploy.sh`: см. логику `sync_go_service_on_git_tree_change`.

## 8) Что осталось

- [ ] Смержить PR **#102** в **`develop`** (после ревью)
- [ ] Опционально: на dev после деплоя проверить **`/app/profile/entities`** (внешний виджет списка профилей)
