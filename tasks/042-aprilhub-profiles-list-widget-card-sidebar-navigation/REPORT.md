## 1) Итого
- Статус: ✅ выполнено
- Задача: Открытие `Profiles list widget-card` из пункта `Профиль-список` в sidebar AprilHub
- Ветка: `feature/042-profile-list-sidebar-widget-card`
- Коммиты: не создавались
- PR: не создавался

## 2) Что сделано
- [frontend] Добавлен явный маркер карточки `Profiles list` (`data-testid="profiles-list-widget-card"`) для стабильной проверки host-сценария.
- [frontend] Добавлен тест в `hub-shell/src/App.test.tsx`: клик по пункту sidebar `Профиль — список` открывает `Profiles list widget-card`.
- [frontend] Актуализированы моки API в тестах (`authorizedFetch`) для совместимости сценария загрузки виджета.
- [docs] Создан детальный план выполнения `tasks/042.../PLAN.md`.
- [docs] Обновлён `task_list.md`: задача `042` отмечена как выполненная и привязана к `REPORT.md`.

## 3) Изменённые файлы
- `hub-shell/src/widgets.tsx`
- `hub-shell/src/App.test.tsx`
- `task_list.md`
- `tasks/042-aprilhub-profiles-list-widget-card-sidebar-navigation/PLAN.md`
- `tasks/042-aprilhub-profiles-list-widget-card-sidebar-navigation/REPORT.md`
- `tasks/042-aprilhub-profiles-list-widget-card-sidebar-navigation/TASK.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да; откат — удалить изменения во frontend/документации этой задачи

## 5) Проверка качества
- Линтер: ok
- Сборка: не запускалась (в рамках scope не требовалась)
- Unit tests: ok
- Integration tests: ok (frontend integration layer через `App.test.tsx`)
- E2E / smoke: частично (покрыто unit/integration smoke-сценарием в тесте sidebar -> widget-card)

Команды (фактически выполненные):
```bash
npm --prefix hub-shell run lint
npm --prefix hub-shell run test -- --runInBand
npm --prefix hub-shell run test
```

## 6) Деплой
- Среда: нет
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
- Образы: не применялось
- Health / readiness: не применялось
- Rollback: нет

## 7) Риски и ограничения
- Проверка сценария выполнена на уровне тестов `hub-shell`; отдельный браузерный E2E/ручной smoke на dev-стенде не запускался в рамках этой сессии.
- В рабочем дереве присутствовали несвязанные изменения (`design-system/DisignApril`) до старта задачи; не затрагивались.

## 8) Что осталось
- [ ] При необходимости прогнать браузерный smoke на dev-стенде для подтверждения UX-сценария в окружении с реальным Keycloak/BFF.
- [ ] Создать commit и PR с этой задачей при подтверждении от владельца ветки.
