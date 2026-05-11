## 1) Итого

- Статус: ✅ выполнено (код на `develop`: `HubMobilePrimaryDock.tsx`, `app-shell.tsx`, Playwright `mobile-chromium`)
- Задача: Внешняя **080** — mobile chrome AprilHub, bump `vendor/april-profile`, Playwright mobile smoke
- Ветка: `develop`
- PR: по процессу команды

## 2) Что сделано (подтверждение на `develop`)

- **[hub-shell]** `HubMobilePrimaryDock.tsx` — глобальный dock с `AprilMobileShellBar`, ссылки «Профили» / «Шаблоны».
- **[hub-shell]** `app-shell.tsx` — `aprilMobileShellBarContentPaddingBottom()` + conditional渲染 `HubMobilePrimaryDock` on mobile viewport (`max-width: 47.99em`).
- **[hub-shell]** Playwright: проект **`mobile-chromium`** (`Pixel 5`), `testMatch` на `profile-widgets-smoke.spec.ts`.
- **[hub-shell]** CSS: toast offset на mobile над dock-панелью.
- **[widgets.tsx]** `ProfilesWidget` — `cardListColumnMobileLayout="off"` на mobile (no double bottom bar, ADR-0006).

## 3) Приёмка

- `HubMobilePrimaryDock.tsx` — ✅ на `develop`
- `app-shell.tsx` — ✅ 4 mobile-ссылки (paddingBottom, import, conditional, render)
- Playwright mobile project — ✅ `mobile-chromium` в `playwright.config.ts`
- `widgets.tsx` — ✅ `cardListColumnMobileLayout` prop передан

## 4) Осталось

- [ ] Push submodule патчей `vendor/april-profile` upstream → `ukituki-ps/april-profile`.
- [ ] CI на `develop` с `NODE_AUTH_TOKEN` — подтвердить зелёный `hub-shell` lint/test/build.
