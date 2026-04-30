## 1) Итого

- Статус: ⚠️ частично (локализована и уменьшена причина лишних `canceled`, но для полной incident-корреляции нужны доступы к Sentry/Loki/Prometheus)
- Задача: triage/fix сценария `entity-types-widget`: `2 canceled` + `1x 200` при открытии
- Ветка: `develop`
- Коммиты: не создавались
- PR: не создавался

## 2) Инцидент и корреляция

- Инцидент: повторные отменённые запросы `GET /api/v1/admin/profile/api/v1/entity-types` при открытии `entity-types-widget` в `dev`.
- Route: экран списка типов сущностей (`entity-types-list`) в `hub-shell`.
- Environment: `dev`.
- Tenant: `00000000-0000-0000-0000-000000000001` (из контекста токена).
- Role set (Keycloak): присутствуют `admin`, `manager`, `user` (агрегированный набор).
- `requestId`/`correlationId`: требуется извлечь из Sentry issue / Loki, в предоставленном фрагменте сети эти значения не даны.

## 3) Наблюдения Sentry → Loki → Prometheus

- Sentry: URL issue не предоставлен, прямой runtime stacktrace/issue tags (`requestId`, `correlationId`) недоступны.
- Loki: без `requestId`/`correlationId` и доступа к стенду невозможно выполнить точную сквозную корреляцию по сервисам.
- Prometheus/Grafana: по этой сессии нет данных о росте `5xx/503`/latency; инфраструктурная деградация не подтверждена.

## 4) Классификация root cause (предварительная)

- Слой: **frontend/widget lifecycle**.
- Причина:
  - в `EntityTypesWidgetCore` используется `AbortController` с отменой предыдущего запроса;
  - в `hub-shell` активен `React.StrictMode` (dev), что даёт дополнительный mount/unmount и как минимум один `canceled`;
  - дополнительно `hostContext` передавался как новый объект на ререндер, что могло запускать ещё один перезапрос с отменой.

## 5) Изменения

- [frontend] Стабилизирован проп `hostContext` в `hub-shell/src/widgets.tsx` через `useMemo`.
- [frontend] Убрана лишняя триггерная причина повторного `loadFamilies()` при ререндерах host-компонента.
- [docs] Обновлён отчёт triage по этой задаче.

## 6) Изменённые файлы

- `hub-shell/src/widgets.tsx`
- `tasks/2026-04-30-micro-entity-types-widget-sync-aprilprofile/REPORT.md`

## 7) Проверка качества

- Линтер: `ReadLints` для `hub-shell/src/widgets.tsx` — `ok`
- Сборка: не запускалась в этой micro-итерации
- Unit tests: не запускались в этой micro-итерации
- Integration tests: n/a
- E2E / smoke: n/a

Команды (фактически выполненные):

```bash
git status --short
git diff -- hub-shell/src/widgets.tsx
```

## 8) Риски и ограничения

- Без обязательной триады `Sentry issue -> Loki -> Prometheus` классификация остаётся предварительной.
- В dev всё ещё возможен один `canceled` из-за `React.StrictMode` (нормальное поведение в development).

## 9) Что осталось

- [ ] Дособрать обязательную корреляцию по конкретному инциденту: Sentry issue URL + `requestId`/`correlationId` -> Loki -> Prometheus.
- [ ] После получения observability-данных подтвердить финальную owner-классификацию (UI/BFF/downstream/infra).
