---
sidebar_position: 4
---

# Дизайн-система April (`@april/tokens`, `@april/ui`)

Исходный код, витрина компонентов и полные соглашения живут в отдельном репозитории:

**[github.com/ukituki-ps/DisignApril](https://github.com/ukituki-ps/DisignApril)** (монорепозиторий на **pnpm**: пакеты `packages/tokens`, `packages/ui`, приложение-галерея `apps/showcase`).

**Каноническая модель для AprilHub (`hub-shell`) на CI, stage и production** после эпика **`049`**: пакеты **`@april/tokens`** и **`@april/ui`** устанавливаются из **приватного npm registry** (GitHub Packages, scope `@april`) по **semver**, зафиксированному в **`hub-shell/package-lock.json`**. Источник истины для runtime в браузере — опубликованный tarball версии, а не локальная сборка `dist` в submodule. Архитектурное решение и политика semver / отката: [ADR «дистрибуция дизайн-системы April через npm»](https://github.com/ukituki-ps/april-worker/blob/develop/docs/architecture/ADR-april-design-system-npm-distribution.md) (в репозитории: `docs/architecture/ADR-april-design-system-npm-distribution.md`).

Переход `package.json` / CI с `file:` на registry выполняется в задаче **`049-03`**; до её merge в репозитории может сохраняться описанная ниже **историческая** схема этапа `013`.

## Целевая интеграция: registry + lockfile (hub-shell)

1. **Registry для scope `@april`:** `https://npm.pkg.github.com` (см. ADR). В репозитории — шаблон **`.npmrc`** без секретов (после **`049-03`**: `hub-shell/.npmrc.example`); в CI и при `docker build` задаётся **`NODE_AUTH_TOKEN`** (PAT или `GITHUB_TOKEN` с **`read:packages`**) так, чтобы `npm ci` мог скачать `@april/*`. Подробности секретов и деплоя: [`docs/DEPLOYMENT_STRATEGY.md`](https://github.com/ukituki-ps/april-worker/blob/develop/docs/DEPLOYMENT_STRATEGY.md) (раздел **«3.1. GitHub Packages»**).

2. **Зависимости:** в `hub-shell/package.json` — диапазоны semver (`^x.y.z` или зафиксированные версии по политике команды); **точные версии транзитивного дерева** — в `package-lock.json` после `npm install` / `npm ci`.

3. **Bump дизайн-системы:** новая версия публикуется из **DisignApril** → в `april-worker` отдельный PR на обновление `package.json` / `package-lock.json` (и при необходимости образов по SHA) → обязательный quality gate из корневого [`README.md`](https://github.com/ukituki-ps/april-worker/blob/develop/README.md). Submodule **не** заменяет этот шаг для продуктового shell.

4. **Submodule `design-system/DisignApril` после `049`:** остаётся для **витрины** (`april-showcase`, маршрут `/showcase/`), **локальной разработки** рядом с DS и **подготовки релиза** пакетов в DisignApril; не считается единственным источником runtime для production-сборки `hub-shell`.

## Историческая интеграция этапа `013` (submodule + `file:`)

Ниже — модель, принятая на этапе **`013`** AprilHub до полного перехода на registry; она **сохраняется** как рабочий путь для разработчиков и для веток, где **`049-03`** ещё не применён.

Этот репозиторий **не дублирует** исходники дизайн-системы вне submodule: используется **`git submodule`** (`design-system/DisignApril`) и локальные зависимости **`file:`** в `hub-shell`.

1. Инициализация submodule:

```bash
git submodule update --init --recursive
```

2. В `hub-shell` зависимости подключены как (до **`049-03`**):

- `@april/tokens -> file:../design-system/DisignApril/packages/tokens`
- `@april/ui -> file:../design-system/DisignApril/packages/ui`

3. Перед `dev/build/test` в `hub-shell` автоматически запускается подготовка DS:

```bash
npm --prefix hub-shell run ds:prepare
```

Команда включает `pnpm install --frozen-lockfile` и `pnpm build` в `design-system/DisignApril`.

## Пакеты

| Пакет | Назначение |
| ----- | ---------- |
| `@april/tokens` | Токены (цвета, плотность, логотип), CSS-переменные для сервисов без React (`import '@april/tokens/css'`) |
| `@april/ui` | Тема Mantine, `AprilProviders`, контекст плотности; зависимости включают `@mantine/core`, при необходимости React Flow |

Подробности по токенам, бренду и паттернам — в **`DESIGN_SYSTEM.md`** в репозитории DisignApril.

## Продакшен: минимальный shell

Импортируйте стили Mantine, при работе с диаграммами на `@xyflow/react` — стиль React Flow, оберните приложение в провайдеры:

```tsx
import '@mantine/core/styles.css';
import '@xyflow/react/dist/style.css'; // если в сервисе есть flow-экраны
import { AprilProviders } from '@april/ui';

export function App() {
  return (
    <AprilProviders>
      {/* маршрутизатор и экраны вашего сервиса */}
    </AprilProviders>
  );
}
```

## Важно: не тяните витрину в релиз

Компонент **`UIKit`** и связанные демо-секции в `@april/ui` предназначены для **разработки и ревью**, не для пользовательского бандла. В продакшене не импортируйте `UIKit` — используйте витрину локально (`pnpm dev` в DisignApril) или на внутреннем стенде.

## Showcase runtime в dev-контуре

- В `docker-compose.yml` добавлен сервис `april-showcase` (Vite runtime из `DisignApril/apps/showcase`).
- В `infra/nginx/default.conf` настроен ingress path `/showcase/`.
- Smoke-проверка `scripts/smoke-aprilhub.sh` валидирует доступность `http://localhost:${DOCS_HTTP_PORT:-8080}/showcase/`.
- Для сборки showcase по-прежнему нужен **актуальный submodule** и сборка внутри DisignApril (см. `ds:prepare` / compose-образ витрины) — это **отдельный** контур от установки `@april/*` для `hub-shell` из registry после эпика **`049`**.

## Связка с этим репозиторием

- Каркас сервиса (доки, OpenAPI, CI) — здесь; **визуальный слой** — через зависимости от `@april/*` и собственный каталог приложения (например `frontend/`; в корне репозитория есть `frontend/README.md` с подсказками).
- Версии инструментов и матрица синхронизации CI — в [`VERSIONS.md`](./VERSIONS.md); версии **опубликованных** пакетов `@april/*` для hub-shell — в `hub-shell/package-lock.json` (после **`049-03`**).
