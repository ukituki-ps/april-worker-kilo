## 1) Итого
- Статус: ✅ выполнено (MVP + последовательные UX hotfix’ы); ниже — дополнение по auto-create
- Задача: Исполнение внешней задачи 023 (AprilHub widget host + e2e smoke)
- Ветка: `develop` (через PR; локально — отдельная feature-ветка под новый PR)
- Коммиты: см. PR ниже
- PR (merged): [#40](https://github.com/ukituki-ps/april-worker/pull/40), [#41](https://github.com/ukituki-ps/april-worker/pull/41), [#42](https://github.com/ukituki-ps/april-worker/pull/42)

## 2) Что сделано
- [frontend] В `hub-shell` добавлен host-driven модуль `Профиль (виджет)` и интеграция в composition registry / навигацию авторизованной зоны.
- [frontend] Реализован виджет `EntityProfileWidget` с контрактом `hostContext`, сохранением через прокси `hub-bff` на AprilProfile Admin API (`/api/v1/admin/profile/api/v1/entities/...`) и callback `onSaveSuccess`.
- [frontend] Hotfix прокси: `apiBaseUrl` должен включать суффикс `/api`, иначе upstream получает путь без `/api/v1/...` и отвечает `404`.
- [frontend] UX ошибок сохранения: парсинг JSON ошибки (`code`, `message`) + более понятные сообщения для типовых кейсов.
- [frontend] Auto-create: при `PUT` с `404` + `code=entity_not_found` виджет делает `POST /v1/entities` и повторяет `PUT` (требуется `VITE_PROFILE_DEFAULT_ENTITY_TYPE_ID`; опционально `VITE_PROFILE_DEMO_ENTITY_ID` для демо-сценария).
- [frontend/tests] Добавлен e2e smoke-кейс в `hub-shell/tests/e2e/smoke.spec.ts`: login -> render widget -> save -> проверка `onSaveSuccess`.
- [tooling] `scripts/run-playwright-aprilhub.sh` экспортирует дефолты `VITE_PROFILE_*`, чтобы smoke стабильно покрывал сценарий `POST -> retry PUT`.
- [docs] Добавлены/обновлены материалы: `docs-site/docs/task-story-023-phase-4-aprilhub-widget-host-e2e-smoke.md`, `docs-site/docs/task-stories-overview.md`, `docs-site/docs/getting-started.md`.
- [task docs] Добавлен детальный план `tasks/024.../PLAN.md`.

## 3) Изменённые файлы
- `hub-shell/src/profile-widget.tsx`
- `hub-shell/src/widgets.tsx`
- `hub-shell/src/composition-registry.ts`
- `hub-shell/src/App.tsx`
- `hub-shell/src/vite-env.d.ts`
- `hub-shell/tests/e2e/smoke.spec.ts`
- `docker-compose.yml`
- `.env.example`
- `scripts/run-playwright-aprilhub.sh`
- `docs-site/docs/task-story-023-phase-4-aprilhub-widget-host-e2e-smoke.md`
- `docs-site/docs/task-stories-overview.md`
- `docs-site/docs/getting-started.md`
- `tasks/024-aprilhub-execute-external-task-023-april-profile-1/PLAN.md`
- `tasks/024-aprilhub-execute-external-task-023-april-profile-1/REPORT.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применимо
- Обратимость: да; откат удалением виджет-модуля и e2e/docs-правок

## 5) Проверка качества
- Линтер: ok (`hub-shell`)
- Сборка: ok в CI; локально возможен `EACCES` при очистке `hub-shell/dist/*`, если артефакты были созданы от root (обход: удалить `dist` из контейнера с root или поправить владельца файлов)
- Unit tests: ok (`hub-shell`)
- Integration tests: не запускались (изменения фронтенд + docs)
- E2E / smoke: ok в CI (GitHub Actions + self-hosted runner); локально зависит от доступности Docker/портов

Команды (фактически выполненные):
```bash
cd hub-shell && npm run lint && npm run test
cd hub-shell && npm run lint && npm run test && npm run build
./scripts/run-playwright-aprilhub.sh
```

## 6) Деплой
- Среда: `develop` (после merge PR #40/#41/#42)
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md`
- Образы: по пайплайну `april-worker` после merge
- Health / readiness: по пайплайну окружения
- Rollback: откат merge PR (или revert)

## 7) Риски и ограничения
- Локальная сборка `hub-shell` может упасть на `vite build`, если в `hub-shell/dist/*` остались root-owned файлы (см. раздел «Проверка качества»).
- Для auto-create нужен корректный `entity_type_id` в окружении (`VITE_PROFILE_DEFAULT_ENTITY_TYPE_ID`), иначе сохранение завершится ошибкой конфигурации.
- До публикации внешнего `@april/profile-ui` в registry используется локальная реализация виджета с совместимым контрактом; нужен follow-up на подключение semver dependency.

## 8) Что осталось
- [ ] Открыть/смержить PR с auto-create + обновлениями Playwright helper script (после публикации изменений в этом репозитории).
- [ ] Обновить отчёт во внешнем репозитории `april-profile-1` ссылками на PR/коммиты после публикации изменений.
