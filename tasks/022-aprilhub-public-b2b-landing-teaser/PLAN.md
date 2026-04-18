# План: публичный B2B-лендинг-тизер April (guest `hub-shell`)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-18
- **Статус плана:** согласован

## Исходные допущения

- В `hub-bff` нет готового API для лидов; форма заявки — **mailto:** с телом письма и опциональным `VITE_LANDING_INQUIRY_EMAIL`.
- Зоны `transition` / `authorized` / `forbidden` не меняются по логике; меняется только guest-ветка.
- Тесты в jsdom требуют полифилла **ResizeObserver** для Mantine `Table.ScrollContainer`.

## Порядок работ (шаги)

1. Вынести контент в `hub-shell/src/landing/content.ts` (типизированный объект).
2. Реализовать `GuestB2BLanding` (секции, sticky-навигация, Mantine, единый `onStartLogin`).
3. Подключить компонент в `App.tsx` (guest), обновить `index.html` (ru, SEO), `app.css`.
4. Обновить unit/e2e/smoke (`App.test.tsx`, `smoke.spec.ts`, `scripts/smoke-aprilhub.sh`).
5. Оформить `REPORT.md`, обновить `task_list.md`.

## Затрагиваемые области

| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | Нет |
| Frontend | `hub-shell` guest-лендинг, новый модуль `src/landing/` |
| БД / Atlas | Нет |
| Инфра / Compose | Нет |
| Документация / OpenAPI | Нет (smoke-скрипт: маркер `<title>`) |

## Риски и откат

- **Риск:** дубли кнопок входа с расходящейся логикой → **Митигация:** один колбэк `onStartLogin` из `App`.
- **Риск:** mailto блокируется в среде пользователя → зафиксировано в отчёте; follow-up — backend для лидов.
- Откат: revert изменений в `hub-shell` и `scripts/smoke-aprilhub.sh`.

## Проверка после выполнения

- `npm --prefix hub-shell run test`
- `npm --prefix hub-shell run build` (на чистом `dist/` без проблем прав)
- `./scripts/smoke-aprilhub.sh` на стенде с ingress

## Примечания

- Обновления плана: 2026-04-18 — первичная версия.
