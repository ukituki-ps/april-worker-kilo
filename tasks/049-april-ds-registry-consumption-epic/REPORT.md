## 1) Итого

- **Эпик 049:** частично — зафиксирована **финальная верификация** по [`TASK-049-99`](./TASK-049-99-aprilhub-final-integration-verify.md); **полное закрытие** по [`TASK.md`](./TASK.md) (registry-only lock, подтверждённые публикации, AprilProfile/DisignApril) **ещё не зафиксировано**. Параллельно в `develop` вливаются артефакты **049-01** (ADR), **049-02** (гайды), **049-03/04** (hub-shell / CI / отчёты).
- **049-99:** AprilHub: финальная сквозная проверка и сборка эпика registry-DS (таблица ниже).
- **049-01:** ADR и граница «исходники DisignApril vs npm-пакеты» — см. раздел «ADR (049-01)» и [`TASK-049-01-aprilhub-architecture-adr.md`](./TASK-049-01-aprilhub-architecture-adr.md).

## 2) Что сделано

### Чеклист верификации (049-99)

| Пункт | Результат |
|--------|-----------|
| **`npm view` версий пакетов DS с read-доступом** | `@april/ui` / `@april/tokens` на **registry.npmjs.org отсутствуют** (404) — ожидаемо для приватной модели. Для **GitHub Packages** канонические имена в пайплайне публикации — **`@ukituki-ps/april-ui`**, **`@ukituki-ps/april-tokens`** (см. [`.github/workflows/publish-april-ds-gpr.yml`](../../.github/workflows/publish-april-ds-gpr.yml)). Запрос `npm view @ukituki-ps/april-ui version --registry=https://npm.pkg.github.com` **без токена** → **401** (нужен `NODE_AUTH_TOKEN` / PAT `read:packages`). Подтверждение опубликованной версии в GPR **в этом прогоне не получено** (токен не использовался). |
| **`hub-shell`: `npm ci && npm run lint && npm run build`** | На хосте: **`npm ci`** завершился **EACCES** на существующем `node_modules` (права на рабочей машине). **Эквивалент CI:** в контейнере `node:20-alpine` с монтированием репозитория команды **`npm ci && npm run lint && npm run build`** завершились **успешно** (модель **`file:`** + submodule **DisignApril**, `ds:prepare` собирает `dist`, **ds:check-exports** зелёный — см. класс инцидента **048**). |
| **AprilProfile** | Репозиторий **`april-profile-1` в этом workspace отсутствует**; статус CI/PR миграции на GPR **не подтверждён**. Требуется ссылка от владельца или проход CI во внешнем репо. |
| **DisignApril / publish pipeline** | В **`april-worker`** есть workflow **`Publish @april DS to GitHub Packages`** (`workflow_dispatch`); факт успешного релиза/тега **не верифицирован** здесь (нужен запуск и секрет **`GPR_PUBLISH_TOKEN`** на стороне GitHub). |
| **Dev-стенд / белый экран** | Ручной smoke с этого окружения **не выполнялся**. Косвенно: локальная production-сборка `hub-shell` **успешна**; регрессия **048** при актуальном `ds:prepare` **не воспроизведена** в контейнерной проверке. |

### Ранее по эпику в этом репозиторию (049-04 — CI / compose / документация)

- **[infra / CI]** `permissions: packages: read`, `NODE_AUTH_TOKEN: ${{ secrets.GPR_READ_TOKEN || secrets.GITHUB_TOKEN }}` в `ci.yml`, `bootstrap-ci.yml`, `ci-cache-warmup.yml`, `testing-extensions-nightly.yml`; проброс в **hub-shell-alpine-runtime** (`docker run -e NODE_AUTH_TOKEN`).
- **[compose / docs]** `docker-compose.yml` (`hub-shell`: `NODE_AUTH_TOKEN`), `.env.example`, `docs/DEPLOYMENT_STRATEGY.md` §3.1.
- Подробнее: ветка `feature/049-04-aprilhub-ci-compose-deploy`, ключевой коммит **`1da019a`**, compare: https://github.com/ukituki-ps/april-worker/compare/develop...feature/049-04-aprilhub-ci-compose-deploy

### ADR (049-01)

- [docs] ADR [`docs/architecture/ADR-april-design-system-npm-distribution.md`](../../docs/architecture/ADR-april-design-system-npm-distribution.md): контекст (`file:` + submodule, инциденты stale `dist`), решение (**registry URL** `https://npm.pkg.github.com`, **scope** `@april`), semver/breaking, роль submodule, релизы, откат, альтернативы, миграция.
- [docs] В [`docs/architecture/README.md`](../../docs/architecture/README.md) добавлены ссылки на ADR.
- [tasks] В [`TASK-049-01-aprilhub-architecture-adr.md`](./TASK-049-01-aprilhub-architecture-adr.md) отмечен выполненный критерий по содержанию ADR.

## 3) Изменённые файлы

- `task_list.md` (прогоны 049-99)
- `tasks/049-april-ds-registry-consumption-epic/REPORT.md`
- `tasks/049-april-ds-registry-consumption-epic/TASK.md`
- `tasks/049-april-ds-registry-consumption-epic/TASK-049-99-aprilhub-final-integration-verify.md`
- `docs/architecture/ADR-april-design-system-npm-distribution.md`
- `docs/architecture/README.md`
- `tasks/049-april-ds-registry-consumption-epic/TASK-049-01-aprilhub-architecture-adr.md`

## 4) Миграции и данные

- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да (документированные правки markdown / списков задач)

## 5) Проверка качества

- Линтер hub-shell: ok (в контейнере `node:20-alpine`, см. 049-99)
- Сборка hub-shell: ok (в контейнере)
- Для правок **только ADR/markdown (049-01):** отдельный прогон линтера `hub-shell` не требовался
- Unit tests: не запускались отдельно в этой задаче (`npm run test` не входил в минимальный чеклист 049-99)
- E2E / smoke: не запускались (опционально в постановке)

Команды (фактически выполненные):

```bash
# Ожидаемо: пакеты не на npmjs
npm view @april/ui version
npm view @april/tokens version

# GPR (без токена — 401)
npm view @ukituki-ps/april-ui version --registry=https://npm.pkg.github.com

# hub-shell: чистая сборка как в CI (обход EACCES на хосте)
docker run --rm -v "$(pwd):/workspace" -w /workspace/hub-shell node:20-alpine \
  sh -lc "npm ci && npm run lint && npm run build"
```

## 6) Деплой

- Среда: нет
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
- Образы: не применялось
- Rollback: нет

## 7) Риски и ограничения

- До перехода **`hub-shell`** на зависимости из lock (`semver` из GPR) эпик остаётся на **`file:`** + submodule — цель **049** по фиксации артефакта только через registry **не достигнута**.
- Без **`GPR_READ_TOKEN`** / PAT в проверяющей среде нельзя подтвердить версии в GPR через `npm view`.
- Текст ADR ссылается на GitHub Packages как на согласованный целевой registry эпика `049`; смена провайдера потребует правки ADR.
- Каноническое описание потребления для разработчиков — [`docs/guides/DESIGN_SYSTEM.md`](../../docs/guides/DESIGN_SYSTEM.md) (обновляется в **049-02**); ADR не должен противоречить гайду.

## 8) Что осталось

- [ ] Завершить **049-03**: lock + `package.json` hub-shell на **`@ukituki-ps/april-*`** из GPR (или согласованные алиасы).
- [ ] Опубликовать пакеты (**DisignApril** / workflow **`publish-april-ds-gpr`**) и зафиксировать версии.
- [ ] Подтвердить миграцию **AprilProfile** (PR / CI).
- [ ] Повторить **`npm view`** с read-токеном и зелёный **CI** на PR после смены зависимостей.
- [ ] При необходимости: smoke на dev и/или **Playwright** из репозитория.
- [ ] Задача [`049-02`](./TASK-049-02-aprilhub-documentation.md): обновить `DESIGN_SYSTEM.md` под registry-модель (если ещё не сделано вливаемым коммитом).
