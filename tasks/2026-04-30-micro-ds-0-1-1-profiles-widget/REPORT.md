## 1) Итого

- Статус: ✅ выполнено
- Задача: синхронизация AprilHub с новым состоянием дизайн-системы (`0.1.1`) и обновленным `profiles-widget`.

## 2) Что изменено

- Обновлен submodule `design-system/DisignApril`:
  - `5e03e27` -> `93e530d`
  - В этом состоянии `@ukituki-ps/april-ui` собирается как `0.1.1`.
- Обновлен submodule `vendor/april-profile`:
  - `e2cee03` -> `5e3408a`
  - Коммит содержит обновление `profiles-widget` с потреблением DS `0.1.1` и `CardList fill mode`.
- Пересобран `hub-shell` и актуализированы артефакты:
  - `hub-shell/dist/index.html`
  - `hub-shell/dist/assets/april-profile-ui-CpE7u4KQ.js` (новый)
  - `hub-shell/dist/assets/index-BmePDPwz.js` (новый)
  - Удалены устаревшие ассеты предыдущей сборки.

## 3) Выполненные проверки

- Контейнерный quality gate:
  - `docker run --rm -v /home/ukituki/april-worker:/workspace -w /workspace/hub-shell node:20 bash -lc "npm ci && npm run lint && npm run test && npm run build"`
  - Результат: ✅ success (`lint`, `vitest`, `vite build`).

## 4) Риски и ограничения

- Локально на хосте `hub-shell/node_modules/@april/*` имеет владельца `root`, поэтому нативный запуск `npm ci`/`ds:prepare` падает с `EACCES`.
- В рамках задачи валидация выполнялась в чистом контейнере, что устраняет влияние локальных прав и дает воспроизводимый результат.

## 5) Follow-up

- Рекомендуется отдельно выровнять права на `hub-shell/node_modules` на локальном dev-окружении, чтобы локальный quality gate проходил без контейнера.
