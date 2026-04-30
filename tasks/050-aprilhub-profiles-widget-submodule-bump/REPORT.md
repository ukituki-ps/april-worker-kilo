## 1) Итого

- Статус: ⚠️ частично (локальный quality gate `hub-shell` не выполнен из‑за `EACCES` на `hub-shell/node_modules`; ожидается прогон в CI или после исправления прав на машине разработчика)
- Задача: обновление внешнего `profiles-widget` через submodule `vendor/april-profile` и автоматический перезапуск `hub-shell` на dev при bump submodule
- Ветка: `feature/050-aprilhub-profiles-widget-submodule-bump` (создать и запушить для PR)
- Коммиты: `a8a5f0e`
- PR: не создавался

## 2) Что сделано

- [frontend] Обновлён git submodule **`vendor/april-profile`** до **`e2cee03a80b221fa75fe1e8dbfd3c87adfae9bb5`** (ветка `develop` upstream на момент выполнения: `origin/develop`).
- [infra / compose / nginx] В **`deploy.sh`**, функция `sync_frontend_dependencies`: добавлен второй вызов `sync_go_service_on_git_tree_change` для пути **`vendor/april-profile`** и сервиса **`hub-shell`**, чтобы при изменении только указателя submodule контейнер `hub-shell` пересоздавался и Vite подхватывал новые исходники `profile-ui`.
- [docs] Добавлен [`PLAN.md`](./PLAN.md) по шаблону агента.

Проверка совместимости host-слоя: экспорт `ProfilesWidget` / типов в обновлённом пакете сохраняет прежнюю схему (`ProfilesWidgetProps` → OpenAPI provider); правки в [`hub-shell/src/integrations/april-profile-ui.ts`](../../hub-shell/src/integrations/april-profile-ui.ts) не потребовались.

## 3) Изменённые файлы

- `vendor/april-profile` (submodule pointer)
- `deploy.sh`
- `tasks/050-aprilhub-profiles-widget-submodule-bump/PLAN.md`
- `tasks/050-aprilhub-profiles-widget-submodule-bump/REPORT.md`

## 4) Миграции и данные

- Миграции Atlas: нет
- Обратимость: да — revert коммита или возврат submodule на предыдущий SHA

## 5) Проверка качества

- Линтер: fail (локально: `ds:prepare` → `cp` в `node_modules/@april/tokens/css`, отказ в доступе)
- Сборка: не выполнена локально
- Unit tests: не выполнены локально
- E2E / smoke: не выполнялись

Команды (фактически выполненные):

```bash
cd /home/ukituki/april-worker && git submodule update --remote vendor/april-profile
cd /home/ukituki/april-worker/hub-shell && npm ci && npm run ds:prepare && npm run lint && npm run test && npm run build
# npm ci / ds:prepare завершились ошибкой EACCES (часть node_modules принадлежит root)
```

Ожидаемый полный gate (как в [`README.md`](../../README.md)):

```bash
cd hub-shell && npm ci && npm run check:profile-ui-semver && npm run lint && npm run test && npm run build
```

## 6) Деплой

- Среда: не выполнялся
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
- После merge в `develop`: workflow **Deploy to dev** подтянет новый указатель submodule и при следующем деплое **`deploy.sh`** должен выполнить `force-recreate hub-shell`, если изменился git-tree **`vendor/april-profile`** относительно сохранённого state в `.deploy-state/hub-shell-vendor-april-profile.rev`.

## 7) Риски и ограничения

- Локальное окружение с повреждёнными правами на `hub-shell/node_modules` не позволило подтвердить сборку до PR; CI на self-hosted runner должен пройти при чистом `npm ci`.
- При первом деплое после обновления `deploy.sh` файл state `hub-shell-vendor-april-profile.rev` отсутствует — сравнение инициализируется и при расхождении сработает пересоздание (см. логику `sync_go_service_on_git_tree_change`).

## 8) Что осталось

- [ ] Создать ветку `feature/050-aprilhub-profiles-widget-submodule-bump`, закоммитить изменения, открыть PR в `develop`.
- [ ] Убедиться, что CI (`hub-shell` job) зелёный.
- [ ] Опционально: на dev после деплоя визуально проверить `/app/profile/entities` (список профилей через внешний виджет).
