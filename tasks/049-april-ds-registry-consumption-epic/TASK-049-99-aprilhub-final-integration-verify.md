# 049-99 — AprilHub: финальная сквозная проверка и сборка эпика registry-DS

## Мета

- **Эпик:** [`049`](./TASK.md)
- **Исполнитель:** агент/инженер, закрывающий эпик после выполнения **049-01 … 049-04** и внешних задач (DisignApril publish + AprilProfile migrate)
- **Тип:** интеграция, smoke, отчёт

## Цель

Подтвердить, что экосистема в согласованном состоянии: **пакеты опубликованы**, **AprilHub** и **AprilProfile** собираются с registry, документация согласована, нет регрессии по классу инцидента **048** (missing named export из-за stale локального `dist` на пути CI/образа).

## Входит в объём

- Чеклист верификации (все пункты зафиксировать в `tasks/049-april-ds-registry-consumption-epic/REPORT.md`):
  - [ ] `npm view @april/ui version` / `@april/tokens` с read-доступом
  - [ ] `hub-shell`: `npm ci && npm run lint && npm run build`
  - [ ] AprilProfile: подтверждение от владельца репо или CI badge / ссылка на PR
  - [ ] DisignApril: подтверждение publish pipeline / тег релиза
  - [ ] При наличии dev-стенда: smoke входа в shell без белого экрана (или Playwright smoke из репо)
- Обновление **`tasks/049-april-ds-registry-consumption-epic/REPORT.md`** по [`docs/AGENT_REPORT_TEMPLATE.md`](../../docs/AGENT_REPORT_TEMPLATE.md)
- Строка в [`task_list.md`](../../task_list.md) для эпика 049 → ✅ при закрытии

## Не входит

- Новая функциональность UI

## Критерии готовности

- [ ] Все подзадачи 049-01…049-04 и внешние постановки выполнены или явно отложены с записью в REPORT
- [ ] `REPORT.md` эпика заполнен
- [ ] `task_list.md` обновлён

## Проверка

Минимум команды из раздела «Входит в объём»; при недоступности внешних репо — зафиксировать блокер в REPORT.

## Результат

Закрытие эпика 049 с единым отчётом и ссылками на PR во всех затронутых репозиториях.
