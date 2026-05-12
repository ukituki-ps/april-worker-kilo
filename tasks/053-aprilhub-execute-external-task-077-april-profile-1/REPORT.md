## 1) Итого

- Статус: ✅ выполнено (локальная установка `hub-shell` без PAT с `read:packages` не тянет GPR — см. §5)
- Задача: Внешняя **077** — `hub-shell`: DS из GitHub Packages, условный `ds:prepare`, lock и CI
- Ветка: `feature/053-hub-shell-ds-gpr-077` (PR в `develop`, не push в защищённые ветки)
- Коммиты: ветка `feature/053-hub-shell-ds-gpr-077`; основной коммит с кодом DS/GPR — `31a5670`, далее — док-коммиты отчёта (актуальный tip см. на GitHub)
- PR: открыть с ветки: https://github.com/ukituki-ps/april-worker-kilo

## 2) Что сделано

- **[frontend / hub-shell]** Зависимости `@april/tokens` и `@april/ui` переведены на **`npm:@ukituki-ps/april-tokens@^0.1.9`** и **`npm:@ukituki-ps/april-ui@^0.1.9`** (как во внешнем `april-profile-1/frontend` после **076**). Добавлен **`@mantine/hooks@^7.17.8`** (peer `@april/ui`).
- **[frontend / hub-shell]** Закоммичены **`hub-shell/.npmrc`** и обновлён **`.npmrc.example`**: scope `@ukituki-ps`, токен только через **`${NODE_AUTH_TOKEN}`** (без секретов в git).
- **[frontend / hub-shell]** **`package-lock.json`**: собран слиянием транзитивного замыкания DS из `april-profile-1/frontend/package-lock.json` (вложенные ключи `node_modules/...`) с зависимостями, специфичными для hub-shell, из предыдущего lock; добавлен **`node_modules/pretty-format/node_modules/react-is`** из profile-lock для согласованности с топ-level `react-is@18.3.1` (транзитив `@rjsf/utils`). Локально **`npm ci` проходит валидацию lock** и доходит до загрузки tarball с GPR.
- **[frontend / hub-shell]** **`scripts/ds-prepare.sh`**: если в `package.json` нет `file:../design-system/DisignApril/packages/{ui,tokens}` — пропускаются сборка DisignApril, sync `dist` и правки stub в submodule; выполняется только **`prepare_tokens_fallback`**.
- **[frontend / hub-shell]** **`scripts/assert-ui-dist-exports.mjs`**: по умолчанию читает **`node_modules/@april/ui/dist/index.js`**, иначе fallback на submodule.
- **[infra / CI]** **`.github/workflows/ci.yml`**: для job `hub-shell` — **`setup-node`** с `registry-url` и `scope: @ukituki-ps`; убран шаг **corepack** (не нужен при GPR-режиме `ds:prepare`). Job **hub-shell-alpine-runtime**: установка без копирования токена в файл вручную (достаточно закоммиченного `.npmrc` + `NODE_AUTH_TOKEN` в env).
- **[docs]** **`docs/guides/DESIGN_SYSTEM.md`**: актуализированы формулировки под задачу **077** / **053** и закоммиченный `.npmrc`.

## 3) Изменённые файлы

- `hub-shell/package.json`
- `hub-shell/package-lock.json`
- `hub-shell/.npmrc`
- `hub-shell/.npmrc.example`
- `hub-shell/scripts/ds-prepare.sh`
- `hub-shell/scripts/assert-ui-dist-exports.mjs`
- `.github/workflows/ci.yml`
- `docs/guides/DESIGN_SYSTEM.md`
- `tasks/053-aprilhub-execute-external-task-077-april-profile-1/PLAN.md`
- `tasks/053-aprilhub-execute-external-task-077-april-profile-1/REPORT.md`
- `task_list.md`

## 4) Миграции и данные

- Миграции Atlas: нет
- Обратимость: да (вернуть `file:` в `package.json` и прежний lock при необходимости отката)

## 5) Проверка качества

- Линтер OpenAPI: ok (`make openapi-lint`)
- Hub BFF unit tests: ok (`cd hub-bff && go test ./...`)
- Docusaurus: ok (`make docs-build`)
- Hub Shell: **`npm ci && npm run lint && npm run test && npm run build`** в этом окружении **не прогонялись до конца** — после разрешения lock `npm ci` падает на **403** к `npm.pkg.github.com` (у `gh auth token` нет scope **`read:packages`**). Ожидается зелёный прогон в **CI** self-hosted с **`GPR_READ_TOKEN`** или **`GITHUB_TOKEN`** с доступом к пакетам org.

Команды (фактически выполненные):

```bash
make openapi-lint
make docs-build
cd hub-bff && go test ./...
cd hub-shell && rm -rf node_modules && NODE_AUTH_TOKEN="$(gh auth token)" npm ci   # до шага загрузки GPR: 403 без read:packages
```

## 6) Деплой

- Среда: нет (не входило в задачу)
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)

## 7) Риски и ограничения

- **Lockfile** собран скриптом слияния с `april-profile-1/frontend`; при смене версий DS или dev-зависимостей hub-shell предпочтительно **`npm install`** с валидным **`NODE_AUTH_TOKEN`** и закоммитить обновлённый lock (или повторить согласованное слияние).
- Локальная разработка без PAT: нужен **`export NODE_AUTH_TOKEN=...`** (`read:packages`), см. [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md) §3.1.

## 8) Что осталось

- [ ] Создать PR в `april-worker`, убедиться в зелёном **hub-shell** job на CI с GPR.
- [ ] При необходимости обновить **mandatory gate** в корневом `README.md` (шаг `check:profile-ui-semver` по-прежнему может отсутствовать в `hub-shell/package.json` — см. заметки в других задачах).
