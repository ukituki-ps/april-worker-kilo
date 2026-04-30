## 1) Итого

- Статус: ✅ выполнено
- Задача: закрыть дефект фиксированной высоты `ProfilesWidget` (`height: 520px`) на `#/app/profile/entities` и подтвердить стабильную работу host/layout-цепочки на dev-стенде.
- Ветка: `develop`
- Коммиты: не выполнялись в рамках текущего отчета
- PR: не создавался

## 2) Что сделано

- [frontend] Для `profiles-list` добавлен полно-высотный route-контейнер (`shell-route-chrome-fill`) в `AuthorizedHubContent`.
- [frontend] `ProfilesWidget` обернут в host-контейнер `profiles-widget-host` в `widgets.tsx`.
- [frontend] В `app.css` добавлены правила:
  - `shell-route-chrome-fill`: `height: 100%`, `min-height: 0`, `grid-template-rows: auto minmax(0, 1fr)`;
  - `profiles-widget-host`: `height: 100%`, `min-height: 0`, `overflow: hidden`.
- [frontend] Дополнительно стабилизирован базовый shell-контейнер: `.app-shell` переведен на viewport lock (`height/min-height: 100dvh`, fallback `100vh`) + `overflow: hidden`, чтобы `header + shell-layout` всегда укладывались в высоту экрана.
- [runtime/ssh] Выполнена диагностика на `192.168.1.42`: подтверждено, что `ProfilesWidgetCore` в runtime передает `heightMode: "fill"`, а фикс `520` приходил из несогласованного `@april/ui` dist.
- [infra] Устранен restart-loop `april-worker-april-showcase-1`: исправлены ownership-права (`.pnpm-store` и `design-system/DisignApril` под UID контейнера), контейнер стабилизирован.
- [runtime] После приведения runtime-артефактов проверено, что dev-контур больше не воспроизводит дефект `height: 520px` на целевом экране (подтверждено пользователем).
- [docs] Обновлен итоговый отчет micro-task.

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
- E2E / smoke: ok (dev runtime + ручная верификация)

Команды (фактически выполненные):

```bash
cd hub-shell && npm run lint && npm run test && npm run build
# ssh-диагностика dev-стенда и контейнеров
ssh 192.168.1.42 "docker ps"
ssh 192.168.1.42 "docker logs --tail 120 april-worker-hub-shell-1"
ssh 192.168.1.42 "docker logs --tail 120 april-worker-april-showcase-1"
# runtime-проверка Vite-served модулей внутри контейнера
ssh 192.168.1.42 "docker exec april-worker-hub-shell-1 sh -lc 'wget -qO- http://127.0.0.1:4173/@fs/workspace/vendor/april-profile/frontend/packages/profile-ui/src/components/ProfilesWidgetCore.tsx'"
ssh 192.168.1.42 "docker exec april-worker-hub-shell-1 sh -lc 'wget -qO- http://127.0.0.1:4173/@fs/workspace/design-system/DisignApril/packages/ui/dist/index.js'"
```

Результат runtime-проверки на `dev.april.ukituki.tech`:

- маршрут `#/app/profile/entities` открывается штатно;
- host-цепочка применена корректно (`.shell-route-chrome-fill` и `.profiles-widget-host`, `min-height: 0`, `overflow: hidden`);
- симптом `height: 520px` устранен, список работает в fill-режиме со стабильным внутренним скроллом;
- `april-worker-april-showcase-1` выведен из restart-loop (infra-ошибка прав устранена).

## 6) Деплой

- Среда: dev (`192.168.1.42`), runtime-исправления и перезапуск контейнеров выполнены
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md`
- Образы/rollout: без публикации новых image; изменения применены на действующем стенде

## 7) Риски и ограничения

- Runtime-зависимость от согласованности `vendor/profile-ui` и `design-system/DisignApril` сохраняется: при рассинхроне артефактов проблема может повториться.
- В контейнерной среде критичны корректные ownership-права на bind-mounted каталоги (`.pnpm-store`, `design-system/.../node_modules`).
- В браузерах без корректной поддержки `dvh` используется fallback `100vh`; в некоторых мобильных сценариях возможны незначительные расхождения при появлении/скрытии системных панелей.

## 8) Что осталось

- [x] Micro-task закрыт.
- [ ] (optional follow-up) Зафиксировать в отдельной infra-задаче автоматическую проверку/repair прав для bind-mounted pnpm/DS директорий на dev-стенде.
