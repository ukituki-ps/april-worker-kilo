## 1) Итого

- Статус: ✅ выполнено
- Задача: подготовить host-цепочку высоты для корректной работы `ProfilesWidget` в режиме `fill` внутри AprilHub shell.
- Ветка: `develop`
- Коммиты: не выполнялись в рамках текущего отчета
- PR: не создавался

## 2) Что сделано

- [frontend] Для `profiles-list` добавлен полно-высотный route-контейнер (`shell-route-chrome-fill`) в `AuthorizedHubContent`.
- [frontend] `ProfilesWidget` обернут в host-контейнер `profiles-widget-host` в `widgets.tsx`.
- [frontend] В `app.css` добавлены правила:
  - `shell-route-chrome-fill`: `height: 100%`, `min-height: 0`, `grid-template-rows: auto minmax(0, 1fr)`;
  - `profiles-widget-host`: `height: 100%`, `min-height: 0`, `overflow: hidden`.
- [docs] Оформлен micro-task (`TASK.md`) и этот отчет.

## 3) Изменённые файлы

- `hub-shell/src/shell/AuthorizedHubContent.tsx`
- `hub-shell/src/widgets.tsx`
- `hub-shell/src/app.css`
- `tasks/2026-04-30-micro-profiles-widget-host-fill-height/TASK.md`
- `tasks/2026-04-30-micro-profiles-widget-host-fill-height/REPORT.md`

## 4) Миграции и данные

- Миграции Atlas: нет
- Изменения БД: нет
- Обратимость: да (обычный revert изменений host-layout)

## 5) Проверка качества

- Линтер: ok
- Сборка: ok
- Unit tests: ok
- Integration tests: не применимо
- E2E / smoke: не применимо

Команды (фактически выполненные):

```bash
cd hub-shell && npm run lint && npm run test && npm run build
```

## 6) Деплой

- Среда: не выполнялся
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md`
- Образы/rollout: не применялось

## 7) Риски и ограничения

- Без правки внешнего `ProfilesWidget` host-часть может быть корректной, но если в upstream вернут фиксированную высоту, поведение снова изменится.
- Для финальной валидации нужен визуальный smoke на `dev.april.ukituki.tech`.

## 8) Что осталось

- [ ] Визуально проверить поведение списка профилей на `dev.april.ukituki.tech` (что список тянется на доступную высоту и скролл остается внутри виджета).
