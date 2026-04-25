## 1) Итого
- Статус: ✅ выполнено
- Задача: подготовка внедрения Sentry в AprilProfile (`april-profile-1`, внешняя)
- Ветка: `develop` (без отдельной ветки)
- Коммиты: не создавались
- PR: не создавался

## 2) Что сделано
- [external docs] В `april-profile-1` создана карточка `tasks/036-phase-4b-profile-sentry-rollout-preparation/TASK.md`.
- [external docs] В `april-profile-1` создан runbook `docs/runbooks/APRILPROFILE_SENTRY_ROLLOUT_PREPARATION.md`.
- [external docs] В `april-profile-1/.env.example` добавлен шаблон `SENTRY_*` переменных без секретов.
- [external docs] В `april-profile-1/docs/OBSERVABILITY.md` добавлен раздел про Sentry preparation baseline.
- [external docs-site] Добавлена страница `docs-site/docs/task-story-036-phase-4b-profile-sentry-rollout-preparation.md` и обновлён `task-stories-overview.md`.
- [cross-repo] В `april-profile-1` оформлен зеркальный отчёт: `tasks/036-phase-4b-profile-sentry-rollout-preparation/REPORT.md`.

## 3) Изменённые файлы
- `april-profile-1/tasks/036-phase-4b-profile-sentry-rollout-preparation/TASK.md`
- `april-profile-1/tasks/036-phase-4b-profile-sentry-rollout-preparation/REPORT.md`
- `april-profile-1/docs/runbooks/APRILPROFILE_SENTRY_ROLLOUT_PREPARATION.md`
- `april-profile-1/docs/OBSERVABILITY.md`
- `april-profile-1/.env.example`
- `april-profile-1/docs-site/docs/task-story-036-phase-4b-profile-sentry-rollout-preparation.md`
- `april-profile-1/docs-site/docs/task-stories-overview.md`
- `april-profile-1/task_list.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Изменения БД: нет
- Обратимость: да (revert документационных изменений)

## 5) Проверка качества
- Линтер: не применялось (docs-only scope)
- Сборка: ok (`make docs-build` в `april-profile-1`)
- Unit tests: не применялось
- Integration tests: не применялось
- E2E / smoke: не применялось (smoke описан в runbook для runtime-задачи)

Команды (фактически выполненные):
```bash
cd /home/ukituki/april-profile-1
make docs-build
```

## 6) Деплой
- Среда: нет
- Согласовано с документацией деплоя AprilProfile: `april-profile-1/docs/DEPLOYMENT_STRATEGY.md`
- Rollback: описан в `APRILPROFILE_SENTRY_ROLLOUT_PREPARATION.md`

## 7) Риски и ограничения
- Runtime-интеграция SDK ещё не выполнена; это scope задачи `038`.
- Финальные sampling/filtering параметры нужно уточнять после первых продовых/стендовых данных.
- Политику передачи `tenant_id` в Sentry нужно дополнительно зафиксировать с security owner.

## 8) Что осталось
- [ ] Выполнить `038` (runtime Sentry integration в `april-profile-1`).
- [ ] Пройти smoke с синтетическими ошибками и подтвердить корреляцию `requestId/correlationId`.
- [ ] Добавить ссылки на PR/коммиты реализации после выполнения `038`.
