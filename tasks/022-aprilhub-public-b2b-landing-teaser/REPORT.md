## 1) Итого

- Статус: ✅ выполнено
- Задача: Публичный B2B-лендинг-тизер платформы April (неавторизованная зона `hub-shell`)
- Ветка: `feature/022-aprilhub-public-b2b-landing-teaser` (рекомендуется создать локально при merge)
- Коммиты: см. `git log` на ветке `feature/022-aprilhub-public-b2b-landing-teaser` (основной коммит реализации)
- PR: не создавался

## 2) Что сделано

- [frontend] Guest-зона заменена на полноценный B2B-тизер: Hero, ICP (3 колонки), проблема рынка, карта из **5 контуров** + отдельный блок **AprilEDC**, этапы (таблица), статус (легенда + таблица плейсхолдеров), внедрение с ролями заказчика, безопасность (без мёртвых внешних ссылок), прозрачность развития, FAQ (6+ пунктов), финальный CTA + форма, footer с датой обновления.
- [frontend] Sticky якорное меню (Зачем · Карта · … · Контакты) и отдельная кнопка **«Вход»**; все сценарии входа вызывают **один** колбэк `onStartLogin` → `keycloak.login()` из `App.tsx`.
- [frontend] Контент вынесен в `hub-shell/src/landing/content.ts`; форма — клиентская валидация + **`mailto:`** (`hub-shell/src/landing/mailto-lead.ts`), опциональный получатель `VITE_LANDING_INQUIRY_EMAIL` (см. `hub-shell/src/vite-env.d.ts`).
- [frontend] `hub-shell/index.html`: `lang="ru"`, `<title>` и meta description для публичного лендинга.
- [frontend] Полифилл **ResizeObserver** в `hub-shell/src/test/setup.ts` для Mantine в Vitest/jsdom.
- [frontend] Корень приложения: **`AprilProviders`** из `@april/ui` вместо голого `MantineProvider` — тема Mantine через **`createAprilTheme()`** (дизайн-система April). В **`hub-shell/vite.config.ts`**: `resolve.dedupe` для `react`/`react-dom` и **alias** на `@mantine/core` и `@mantine/hooks` из `hub-shell/node_modules`, чтобы Vitest не тянул второй React/Mantine из pnpm внутри submodule `DisignApril`.
- [infra / smoke] `scripts/smoke-aprilhub.sh`: обновлён маркер `<title>` под новый лендинг.

## 3) Изменённые файлы

- `hub-shell/index.html`
- `hub-shell/src/App.tsx`
- `hub-shell/src/app.css`
- `hub-shell/src/vite-env.d.ts`
- `hub-shell/src/test/setup.ts`
- `hub-shell/src/landing/content.ts`
- `hub-shell/src/landing/mailto-lead.ts`
- `hub-shell/src/landing/GuestB2BLanding.tsx`
- `hub-shell/src/App.test.tsx`
- `hub-shell/src/main.tsx`
- `hub-shell/vite.config.ts`
- `hub-shell/tests/e2e/smoke.spec.ts`
- `scripts/smoke-aprilhub.sh`
- `tasks/022-aprilhub-public-b2b-landing-teaser/PLAN.md`
- `tasks/022-aprilhub-public-b2b-landing-teaser/REPORT.md`

## 4) Миграции и данные

- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да (revert коммита)

## 5) Проверка качества

- Линтер: ok (`tsc --noEmit`)
- Сборка: частично — `tsc` проходит; `vite build` на данной машине завершился с **EACCES** при очистке/записи `hub-shell/dist/` (локальные права на каталог). Рекомендуется прогнать `npm --prefix hub-shell run build` в чистом окружении/после `chown` на `dist`.
- Unit tests: ok (`npm --prefix hub-shell run test`)
- Integration tests: не применялось
- E2E / smoke: unit и сценарии обновлены; полный `npm --prefix hub-shell run e2e` не запускался (нужен Keycloak/стенд)

Команды (фактически выполненные):

```bash
cd hub-shell && npx tsc --noEmit && npm run test
```

## 6) Деплой

- Среда: нет
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
- Образы: не применялось
- Health / readiness: не применялось
- Rollback: нет

## 7) Риски и ограничения

- **Форма лидов:** без backend; поведение — открытие почтового клиента через `mailto:`. Для продакшена нужен согласованный endpoint в `hub-bff` + политика ПДн.
- **Дублирование SEO:** строки в `index.html` и `content.ts` должны оставаться согласованными при ручных правках (отдельная задача — единый источник или inject при сборке).
- **Сборка Vite:** при ошибках прав на `dist/` — исправить владельца каталога или удалить `dist` с подходящими правами.

## 8) Что осталось

- [ ] Backend для приёма лидов (приоритет продукта) и хранение согласий
- [ ] Юридические страницы/политики — публикация в репо или docs-site, затем ссылки с лендинга
- [ ] Подставить реальные контакты в footer вместо плейсхолдеров
- [ ] Прогнать `npm --prefix hub-shell run build` и e2e на CI/стенде
