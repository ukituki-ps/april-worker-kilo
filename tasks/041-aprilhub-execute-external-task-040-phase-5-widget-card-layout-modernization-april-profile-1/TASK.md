# Задача 041: исполнение внешней задачи 040-phase-5-widget-card-layout-modernization из april-profile-1

## Мета
- **ID / ветка:** `041-aprilhub-execute-external-task-040-phase-5-widget-card-layout-modernization-april-profile-1`
- **Приоритет:** обычный
- **Тип:** [внешний репозиторий]
- **Связанные документы:**
  - `april-profile-1/tasks/040-phase-5-widget-card-layout-modernization/TASK.md` (источник изменений и критериев по `Profiles list widget`)
  - `april-profile-1/tasks/040-phase-5-widget-card-layout-modernization/REPORT.md` (фактические изменения и ограничения)
  - [`docs-site/docs/task-story-026-phase-4a-hub-profiles-list-host-bff-flow.md`](../../docs-site/docs/task-story-026-phase-4a-hub-profiles-list-host-bff-flow.md)
  - [`docs-site/docs/task-stories-overview.md`](../../docs-site/docs/task-stories-overview.md)
  - [`hub-shell/src/widgets.tsx`](../../hub-shell/src/widgets.tsx)
  - [`task_list.md`](../../task_list.md)

## Цель
Актуализировать в `april-worker` разделы, связанные с `Profiles list widget`, после модернизации карточного layout в задаче `040-phase-5-widget-card-layout-modernization` во внешнем репозитории `april-profile-1`, чтобы документация и эксплуатационные заметки в Hub соответствовали текущему поведению виджета.

## Контекст для агента
- Изменения по phase 5 уже выполнены в `april-profile-1`; в `april-worker` нужно обновить описание интеграционного слоя и пользовательского сценария для `Profiles list widget`.
- Основной кандидат на актуализацию в этом репозитории: история задачи `026` и обзор task stories (`docs-site`), где зафиксированы старые формулировки.
- Если в ходе сверки окажется, что поведение `Profiles list widget` в `hub-shell` расходится с обновлённой документацией внешнего репозитория, зафиксировать это в отчёте как риск/follow-up.

## Входит в объём
- Изучить постановку и итог внешней задачи `040-phase-5-widget-card-layout-modernization` в `april-profile-1`.
- Выделить изменения, влияющие на описание `Profiles list widget` в контексте AprilHub (`layout`, UX-поток, ограничения host-встраивания, smoke-check points).
- Актуализировать релевантный раздел(ы) в `april-worker`:
  - `docs-site/docs/task-story-026-phase-4a-hub-profiles-list-host-bff-flow.md`,
  - `docs-site/docs/task-stories-overview.md` (если требуется уточнение phase/ссылок),
  - другие документы только при явной необходимости, подтверждённой внешней постановкой.
- Зафиксировать итог в отчётах:
  1) в `april-profile-1` в рамках задачи `040-phase-5-widget-card-layout-modernization` (если там нужен дополнительный cross-repo блок),
  2) в `tasks/041-aprilhub-execute-external-task-040-phase-5-widget-card-layout-modernization-april-profile-1/REPORT.md` в `april-worker`.

## Не входит в объём
- Новая функциональная доработка `Profiles list widget` в `hub-shell`, если она не требуется напрямую для синхронизации с внешней задачей.
- Рефакторинг несвязанных виджетов (`instances`, `history`, `conflicts`) без явной зависимости.
- Изменение backend-контрактов AprilHub/AprilProfile вне рамок документирования и минимальной синхронизации.

## Технические ограничения
- Не коммитить секреты и окружение.
- Не расходиться с фактическими артефактами `april-profile-1` по задаче `040-phase-5-widget-card-layout-modernization`.
- Сохранять формат и стиль task-story документации, принятый в `docs-site`.
- Если нужны изменения кода в `hub-shell` для выравнивания с документацией, сначала зафиксировать обоснование в `REPORT.md` и не расширять scope без явного подтверждения.

## Критерии готовности (acceptance)
- [ ] В `april-worker` обновлён раздел(ы), описывающий `Profiles list widget`, с учётом результатов внешней задачи `040-phase-5-widget-card-layout-modernization`.
- [ ] Обновления документации не противоречат текущему поведению `hub-shell` и интеграционному контексту Hub -> AprilProfile.
- [ ] В `REPORT.md` по задаче `041` зафиксированы: какие разделы обновлены, на какие изменения внешней задачи опирались, какие риски/follow-up остались.
- [ ] При необходимости синхронизирован внешний отчёт в `april-profile-1` (или в отчёте явно указано, что внешний отчёт не требовал правок).

## Проверка (команды)
```bash
# Минимум: проверить, что docs-site собирается после правок документации.
npm --prefix docs-site run build

# Если затронут hub-shell (только при явной необходимости), выполнить релевантные проверки:
npm --prefix hub-shell run lint
npm --prefix hub-shell run test -- --runInBand
```

## Результат в отчёте
- Список обновлённых документов/разделов в `april-worker` с кратким описанием, что именно актуализировано.
- Ссылка на внешний источник изменений (`april-profile-1` задача `040-phase-5-widget-card-layout-modernization`).
- Результаты проверок (сборка docs-site и дополнительные проверки при наличии).
- Риски, ограничения и follow-up.
