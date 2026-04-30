# Micro-task: host-цепочка высоты для `ProfilesWidget`

## Мета

- **id / ветка:** `2026-04-30-micro-profiles-widget-host-fill-height` / `fix/shell-layout-viewport-height`
- **приоритет:** высокий
- **связанные файлы:**
  - `hub-shell/src/shell/AuthorizedHubContent.tsx`
  - `hub-shell/src/widgets.tsx`
  - `hub-shell/src/app.css`

## Цель

Актуализировать host-страницу AprilHub после обновления `ProfilesWidget`: гарантировать, что сумма `shell-layout + header` всегда равна высоте экрана, а внутренний скролл остается изолирован внутри shell-контента/виджета.

## Scope

### Что входит

- Добавить host-классы для полно-высотного layout в маршруте `profiles-list`.
- Добавить контейнер-обертку для `ProfilesWidget` с `overflow: hidden`.
- Проставить CSS-свойства `height/min-height` для корректной работы `heightMode="fill"` в виджете.
- Зафиксировать высоту верхнего контейнера shell по viewport (`100dvh`) и исключить overflow на уровне страницы.
- Прогнать релевантные проверки `hub-shell`.
- Оформить `REPORT.md`.

### Что не входит

- Изменения во внешнем репозитории `april-profile`.
- Изменения логики самого `ProfilesWidget`.
- Деплой на dev.

## Зависимости и ограничения

- Фиксированный стек проекта: React + TypeScript + Vite + Mantine.
- Scope ограничен host-обвязкой `hub-shell`.
- UI-тексты не меняются.

## AGENT_MASTER_PROMPT compliance checklist

- [x] Прочитаны и учтены `docs/AGENT_MASTER_PROMPT.md`, `README.md`, `task_list.md`, `docs/AGENT_ARCHITECTURE_CONTEXT.md`.
- [x] Scope не расширялся.
- [x] Destructive git-команды не использовались.
- [x] Выполнение end-to-end: анализ -> изменения -> проверки -> отчет.

## Acceptance criteria

- [x] Контейнер маршрута `profiles-list` поддерживает полно-высотный режим (`height: 100%`, `min-height: 0`).
- [x] У контейнера `ProfilesWidget` установлен `overflow: hidden` для удержания скролла внутри списка.
- [x] Контейнер `.app-shell` фиксируется по viewport height (`100dvh`) и не допускает роста страницы выше экрана.
- [x] `hub-shell` проходит `lint`, `test`, `build`.
- [x] `REPORT.md` содержит изменения, проверки, риски и follow-up.

## Проверка

```bash
cd hub-shell && npm run lint && npm run test && npm run build
```

## Ожидаемый результат в REPORT

- Измененные файлы и сущность правок host-layout.
- Список команд проверки и итог.
- Риски/ограничения и follow-up.
