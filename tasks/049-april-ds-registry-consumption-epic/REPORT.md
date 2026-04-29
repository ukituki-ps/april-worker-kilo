# Эпик 049 — объединённый отчёт

- **Эпик 049:** частично — зафиксирована **финальная верификация** по [`TASK-049-99`](./TASK-049-99-aprilhub-final-integration-verify.md); **полное закрытие** по [`TASK.md`](./TASK.md) (registry-only lock, подтверждённые публикации, AprilProfile/DisignApril) **ещё не зафиксировано**. Артефакты **049-01**, **049-02**, **049-03**, **049-04** вливаются в `develop` согласованной цепочкой.
- **049-01:** [`TASK-049-01-aprilhub-architecture-adr.md`](./TASK-049-01-aprilhub-architecture-adr.md), ADR: [`docs/architecture/ADR-april-design-system-npm-distribution.md`](../../docs/architecture/ADR-april-design-system-npm-distribution.md).
- **049-02:** [`TASK-049-02-aprilhub-documentation.md`](./TASK-049-02-aprilhub-documentation.md) — registry-first описание для разработчиков и деплой-док (`DESIGN_SYSTEM`, `DEPLOYMENT_STRATEGY`, `VERSIONS`, `AGENT_ARCHITECTURE_CONTEXT`).
- **049-99:** AprilHub — финальная сквозная проверка (таблица ниже).

## 1) Чеклист верификации (049-99)

| Пункт | Результат |
|--------|-----------|
| **`npm view` версий пакетов DS с read-доступом** | `@april/ui` / `@april/tokens` на **registry.npmjs.org отсутствуют** (404) — ожидаемо для приватной модели. Для **GitHub Packages** канонические имена в пайплайне публикации — **`@ukituki-ps/april-ui`**, **`@ukituki-ps/april-tokens`** (см. [`.github/workflows/publish-april-ds-gpr.yml`](../../.github/workflows/publish-april-ds-gpr.yml)). Запрос `npm view @ukituki-ps/april-ui version --registry=https://npm.pkg.github.com` **без токена** → **401** (нужен `NODE_AUTH_TOKEN` / PAT `read:packages`). Подтверждение опубликованной версии в GPR **в этом прогоне не получено** (токен не использовался). |
| **`hub-shell`: `npm ci && npm run lint && npm run build`** | На хосте: **`npm ci`** завершился **EACCES** на существующем `node_modules` (права на рабочей машине). **Эквивалент CI:** в контейнере `node:20-alpine` с монтированием репозитория команды **`npm ci && npm run lint && npm run build`** завершились **успешно** (модель **`file:`** + submodule **DisignApril**, `ds:prepare` собирает `dist`, **ds:check-exports** зелёный — см. класс инцидента **048**). |
| **AprilProfile** | Репозиторий **`april-profile-1` в этом workspace отсутствует**; статус CI/PR миграции на GPR **не подтверждён**. Требуется ссылка от владельца или проход CI во внешнем репо. |
| **DisignApril / publish pipeline** | В **`april-worker`** есть workflow **`Publish @april DS to GitHub Packages`** (`workflow_dispatch`); факт успешного релиза/тега **не верифицирован** здесь (нужен запуск и секрет **`GPR_PUBLISH_TOKEN`** на стороне GitHub). |
| **Dev-стенд / белый экран** | Ручной smoke с этого окружения **не выполнялся**. Косвенно: локальная production-сборка `hub-shell` **успешна**; регрессия **048** при актуальном `ds:prepare` **не воспроизведена** в контейнерной проверке. |

## 2) Что сделано по подзадачам

### ADR (049-01)

- [docs] ADR [`docs/architecture/ADR-april-design-system-npm-distribution.md`](../../docs/architecture/ADR-april-design-system-npm-distribution.md).
- [docs] Ссылки в [`docs/architecture/README.md`](../../docs/architecture/README.md).

### Гайды и деплой (049-02)

- [docs] [`docs/guides/DESIGN_SYSTEM.md`](../../docs/guides/DESIGN_SYSTEM.md): модель **GitHub Packages + lockfile**; раздел целевой интеграции; исторический контент **`file:` / submodule `013`** сохранён с явной пометкой; ссылки на ADR и **049-03**.
- [docs] [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md): **§3.1 GitHub Packages** — `NODE_AUTH_TOKEN`, CI / `docker build`, отсутствие токена на типичном dev-сервере при pull готовых образов, чеклист внедрения.
- [docs] [`docs/guides/VERSIONS.md`](../../docs/guides/VERSIONS.md): строка April DS согласована с registry + ADR.
- [docs] [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](../../docs/AGENT_ARCHITECTURE_CONTEXT.md): ссылка на ADR по дистрибуции `@april/*`.

### Ранее: CI / compose / отчётность (049-04 — по факту ветки)

- **[infra / CI]** `permissions: packages: read`, `NODE_AUTH_TOKEN: ${{ secrets.GPR_READ_TOKEN || secrets.GITHUB_TOKEN }}` в `ci.yml`, `bootstrap-ci.yml`, `ci-cache-warmup.yml`, `testing-extensions-nightly.yml`; проброс в **hub-shell-alpine-runtime** (`docker run -e NODE_AUTH_TOKEN`).
- **[compose / docs]** `docker-compose.yml` (`hub-shell`: `NODE_AUTH_TOKEN`), `.env.example`, `docs/DEPLOYMENT_STRATEGY.md` §3.1 — см. ключевой коммит **`1da019a`** после вливания ветки `feature/049-04-aprilhub-ci-compose-deploy`.

## 3) Изменённые файлы (накопительно)

- `task_list.md`
- `tasks/049-april-ds-registry-consumption-epic/REPORT.md`
- `tasks/049-april-ds-registry-consumption-epic/TASK.md`
- `tasks/049-april-ds-registry-consumption-epic/TASK-049-01-aprilhub-architecture-adr.md`
- `tasks/049-april-ds-registry-consumption-epic/TASK-049-02-aprilhub-documentation.md`
- `tasks/049-april-ds-registry-consumption-epic/TASK-049-99-aprilhub-final-integration-verify.md`
- `docs/architecture/ADR-april-design-system-npm-distribution.md`
- `docs/architecture/README.md`
- `docs/guides/DESIGN_SYSTEM.md`
- `docs/DEPLOYMENT_STRATEGY.md`
- `docs/guides/VERSIONS.md`
- `docs/AGENT_ARCHITECTURE_CONTEXT.md`

## 4) Миграции и данные

- Миграции Atlas: нет / таблицы не затрагиваются
- Обратимость: да (markdown)

## 5) Проверка качества

- **`hub-shell`:** линтер и production-сборка — ok в контейнере `node:20-alpine` (см. 049-99).
- **Док-сайт:** `make docs-build` (ожидается ok — Docusaurus подтягивает `docs/guides`).
- Отдельные unit/E2E в рамках отчётных прогонов эпика: не блокировали закрытие подзадач по документам.

```bash
# Ожидаемо: пакеты не на npmjs
npm view @april/ui version

# GPR без токена — 401
npm view @ukituki-ps/april-ui version --registry=https://npm.pkg.github.com

# hub-shell в контейнере
docker run --rm -v "$(pwd):/workspace" -w /workspace/hub-shell node:20-alpine \
  sh -lc "npm ci && npm run lint && npm run build"

make docs-build
```

## 6) Деплой

- Применённые выкладки в этих подзадачах: только git; образы напрямую не менялись.
- Согласование: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md).

## 7) Риски и ограничения

- До **049-03** `hub-shell` может оставаться на **`file:`** + submodule; документация разводит текущее и целевое состояние.
- Без **`GPR_READ_TOKEN`** / PAT нельзя подтвердить версии в GPR через `npm view`.
- ADR задаёт GPR как цель эпика; смена провайдера потребует пересмотра ADR и гайдов.

## 8) Что осталось

- [ ] **049-03:** lock + зависимости `hub-shell` из GPR (+ CI при необходимости).
- [ ] Опубликовать пакеты (**DisignApril** / **`publish-april-ds-gpr`**) и зафиксировать версии в lock.
- [ ] Подтвердить AprilProfile и read-доступ к GPR в CI/CD.
- [ ] По необходимости: smoke на dev, Playwright.
- [ ] Закрыть эпик в `TASK.md`, когда выполнены критерии registry-only потребления.
