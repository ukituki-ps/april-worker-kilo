## 1) Итого
- Статус: ✅ выполнено
- Задача: Authorized zone standard shell layout (`header + sidebar + content frame`) с dashboard baseline
- Ветка: `fix/disignapril-submodule-init`
- Коммиты: `213ace7`
- PR: не создавался

## 2) Что сделано
- [frontend] В `hub-shell` внедрён устойчивый каркас авторизованной зоны: `header + sidebar + content frame`, сохранён существующий state-flow без `react-router`.
- [frontend] Состояния `authorized`, `loading`, `forbidden`, `error` приведены к единому UX-каркасу.
- [frontend] Русифицированы ключевые тексты навигации и composition-слоя (названия модулей, loading/error/forbidden сообщения).
- [frontend] Обновлены стили `app.css` под baseline layout (branding-header, active nav states, responsive поведение).
- [tests] Обновлён `App.test.tsx` под новый layout и русскоязычные UI-маркеры.
- [infra / smoke] Исправлена причина падения smoke по теме Keycloak:
  - подключён каталог тем в `keycloak` сервисе (`docker-compose.yml`);
  - проверка CSS в `scripts/smoke-aprilhub.sh` сделана устойчивой к динамическим Keycloak resource URL.
- [infra / smoke] Скорректирован маркер shell entrypoint в smoke: проверка стабильного `<title>AprilHub Shell</title>`.
- [frontend / tooling] Добавлен безопасный `ds:prepare` для `hub-shell`: при read-only `design-system/DisignApril` скрипт пропускает пересборку дизайн-системы и не блокирует build/test.
- [infra / smoke] Скрипт smoke адаптирован под локальный стенд на `8080`: при доступном ingress использует текущее окружение без поднятия отдельного compose-профиля.
- [docs] Создан `PLAN.md`, отчёт приведён к актуальному состоянию.

## 3) Изменённые файлы
- `hub-shell/src/App.tsx`
- `hub-shell/src/app-shell.tsx`
- `hub-shell/src/app.css`
- `hub-shell/src/App.test.tsx`
- `hub-shell/package.json`
- `hub-shell/scripts/ds-prepare.sh`
- `hub-shell/src/composition-layer.tsx`
- `hub-shell/src/composition-loader.tsx`
- `hub-shell/src/composition-error-boundary.tsx`
- `hub-shell/src/composition-registry.ts`
- `hub-shell/src/widgets.tsx`
- `scripts/smoke-aprilhub.sh`
- `docker-compose.yml`
- `task_list.md`
- `tasks/015-aprilhub-authorized-shell-standard-layout/PLAN.md`
- `tasks/015-aprilhub-authorized-shell-standard-layout/REPORT.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применимо
- Обратимость: да, через откат изменений frontend/smoke/compose/docs

## 5) Проверка качества
- Линтер: ok (`ReadLints`, диагностик нет)
- Сборка: ok (`npm --prefix hub-shell run build`)
- Unit tests: ok (`npm --prefix hub-shell run test`, `npx vitest run` в `hub-shell`)
- Integration tests: не запускались
- E2E / smoke: ok (`./scripts/smoke-aprilhub.sh`)

Команды (фактически выполненные):
```bash
npm --prefix hub-shell run build
npm --prefix hub-shell run test
npx tsc --noEmit -p tsconfig.json   # cwd: hub-shell
npx vitest run                      # cwd: hub-shell
./scripts/smoke-aprilhub.sh
```

## 6) Деплой
- Среда: нет
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md`
- Образы: не применялось
- Health / readiness: smoke по ingress/API/Keycloak-login-theme пройден
- Rollback: нет

## 7) Риски и ограничения
- Layout реализован как baseline-скелет; наполнение контентных модулей реальными бизнес-данными требует отдельного follow-up.

## 8) Что осталось
- [ ] Оформить PR с результатами этапа `015` и приложить test plan.
