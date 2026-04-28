# План: единый Grafana-дэшборд ошибок фронтенда и бэкенда (AprilHub + AprilProfile)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-28
- **Статус плана:** согласован для реализации

## Исходные допущения
- Central observability stack уже развёрнут в `infra/observability/` и использует Grafana + Prometheus + Loki.
- В репозитории уже есть multi-stand dashboard-ы и они работают как reference по переменным (`env`, `stand`, `host`, `service`).
- Задача `040` фокусируется на dashboard/provisioning и документации triage-потока, без изменения бизнес-кода `hub-bff`/`hub-shell`.
- Для frontend-runtime сигналов в Grafana используется операционный слой логов (Loki), а не прямой доступ к Sentry API.

## Порядок работ (шаги)
1. Подготовить `PLAN.md` и зафиксировать scope/проверки.
2. Добавить новый dashboard JSON в `infra/observability/grafana/dashboards/` с единым обзором ошибок (`frontend`, `hub-bff`, `downstream`).
3. Включить в дэшборд фильтры и drill-down сценарии (через переменные и logs-stream панели с корреляционным поиском).
4. Обновить документацию observability (индекс, список dashboard-ов, runbook по использованию нового экрана).
5. Проверить валидность JSON и compose-конфигурации observability-контура.
6. Оформить `REPORT.md` по шаблону с перечнем артефактов, проверок и ограничений.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | Не меняется |
| Frontend | Не меняется |
| БД / Atlas | Не требуется |
| Инфра / Compose | Новый Grafana dashboard provisioning JSON |
| Документация / OpenAPI | Обновление observability index + runbook по дэшборду |

## Риски и откат
- **Риск:** метки (`service`, `stand`, `env`) могут быть неполными на части стендов.  
  **Митигация:** фильтры включают `All`, а ключевые панели используют устойчивые fallback-запросы.
- **Риск:** расхождение паттернов логов между сервисами (`ERROR`, `error`, `exception`).  
  **Митигация:** использовать regex-поиск по нескольким ключевым шаблонам.
- **Риск:** рост нагрузки на Loki из-за тяжёлых запросов.  
  **Митигация:** ограничить lookback/агрегации `count_over_time` и избегать неограниченных raw-query в основных графиках.
- **Откат:** удалить/откатить новый dashboard JSON и связанные doc-изменения; существующие dashboard-ы и provisioning остаются рабочими.

## Проверка после выполнения
- `python -m json.tool infra/observability/grafana/dashboards/aprilhub-unified-error-overview.json > /tmp/aprilhub-unified-error-overview.pretty.json`
- `cd infra/observability && docker compose config`
- Ручной smoke в Grafana: открыть новый dashboard, проверить переменные и загрузку ключевых панелей.

## Примечания
- Если в ходе валидации появится потребность в корректировке telemetry labels, это выносится в follow-up (вне scope `040`).
