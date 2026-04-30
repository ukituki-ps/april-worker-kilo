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
- E2E / smoke: частично (runtime-проверка на dev)

Команды (фактически выполненные):

```bash
cd hub-shell && npm run lint && npm run test && npm run build
# ad-hoc runtime probe через Playwright (one-off node heredoc)
node <<'EOF'
# ...скрипт авторизации april-admin и проверки inline height:520px на /#/app/profile/entities...
EOF
```

Результат runtime-проверки на `dev.april.ukituki.tech`:

- под `april-admin` (`password: admin`) маршрут `#/app/profile/entities` открывается штатно;
- host-цепочка применена корректно (`.shell-route-chrome-fill` и `.profiles-widget-host`, `min-height: 0`, `overflow: hidden`);
- внутри виджета присутствует inline-стиль `height: 520px` (минимум один узел `Paper`), т.е. фиксированная высота идет из внешнего `ProfilesWidget`/его режима рендера.

## 6) Деплой

- Среда: не выполнялся
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md`
- Образы/rollout: не применялось

## 7) Риски и ограничения

- Без правки внешнего `ProfilesWidget` host-часть не может убрать фиксированную высоту, если виджет выставляет `height: 520px` во внутреннем контейнере.
- Поведение различается по данным/персоне: под `april-admin` зафиксирован `height: 520px` внутри виджета даже при корректной host-цепочке.

## 8) Что осталось

- [ ] Вынести follow-up в `april-profile`: проверить режим рендера `CardListColumn` под `april-admin` и убрать внутренний fixed-height (`heightMode="fill"` + parent chain в самом виджете).
