---
sidebar_position: 4
---

# Дизайн-система April (`@april/tokens`, `@april/ui`)

Исходный код, витрина компонентов и полные соглашения живут в отдельном репозитории:

**[github.com/ukituki-ps/DisignApril](https://github.com/ukituki-ps/DisignApril)** (монорепозиторий на **pnpm**: пакеты `packages/tokens`, `packages/ui`, приложение-галерея `apps/showcase`).

Этот шаблон сервиса **не дублирует** исходники дизайн-системы: для этапа AprilHub `013` используется `git submodule` (`design-system/DisignApril`) и локальные `file:` зависимости в `hub-shell`.

## Интеграция в `april-worker` (этап `013`)

1. Инициализация submodule:

```bash
git submodule update --init --recursive
```

2. В `hub-shell` зависимости подключены как:

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

## Связка с этим репозиторием

- Каркас сервиса (доки, OpenAPI, CI) — здесь; **визуальный слой** — через зависимости от `@april/*` и собственный каталог приложения (например `frontend/`; в корне репозитория есть `frontend/README.md` с подсказками).
- Версии пакетов и инструментов DS — в таблице [`VERSIONS.md`](./VERSIONS.md) и в манифестах репозитория DisignApril.
