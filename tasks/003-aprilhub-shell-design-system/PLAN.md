# План: Hub Shell Composition Runtime + дизайн-системный UX (Этап 003)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-14
- **Статус плана:** актуализирован (реализация завершена)

## Исходные допущения
- Auth-runtime этапа `002` стабилен: `hub-shell` умеет login/logout, `hub-bff` отдаёт `/api/v1/me`, есть role-based `403`.
- В рамках `000-aprilhub-full-service-roadmap` этап `003` включает не только UI, но и composition runtime: App Shell Core, Registry, Loader, Composition Layer, Shared UX Layer.
- Для визуального слоя используется зафиксированная дизайн-система April (токены, UI-паттерны и принципы из `docs/guides/DESIGN_SYSTEM.md`).
- Keycloak остаётся внешним IdP: login-форма принадлежит Keycloak, а `hub-shell` отвечает за pre/post-login UX и интеграционный контур.
- Этап `003` не должен блокироваться глубоким Keycloak-тюнингом: если full-branding невозможен быстро, фиксируется отдельный follow-up.

## Порядок работ (шаги)
1. **Уточнить runtime-модель shell**
   Зафиксировать минимальный контракт App Shell Core, Registry, Loader, Composition Layer и Shared UX Layer.
2. **Собрать App Shell Core + user context bootstrap**
   Реализовать layout-каркас и единый bootstrap контекста пользователя/ролей для авторизованной зоны.
3. **Реализовать Registry/Loader/Composition Layer MVP**
   Подключить декларативный реестр модулей, безопасную загрузку и базовую композицию контента.
4. **Добавить Shared UX Layer + error boundaries**
   Унифицировать состояния loading/empty/error/forbidden и частичную деградацию модулей.
5. **Доработать UX трёх зон**
   Гостевая зона, Keycloak transitions, авторизованная зона — в едином дизайн-системном стиле.
6. **Покрыть тестами критичные runtime+UX пути**
   Проверить auth-gate, authorized shell, fallback/error boundaries, forbidden и отсутствие redirect-loop.
7. **Обновить документацию и отчёт**
   Зафиксировать способ локальной проверки composition runtime, ограничения MVP и follow-up к `004/008/010`.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Frontend (`hub-shell`) | App Shell Core, Registry/Loader/Composition Layer, auth-gate UI, access denied, shared UX states |
| IAM/Keycloak integration | UX переходы login/logout/session-expired, базовый branding plan |
| Backend (`hub-bff`) | Без существенных изменений (кроме возможных минимальных UI-support endpoint корректировок) |
| Документация | runbook локальной проверки composition+UX сценариев, ограничения и follow-up |
| Тестирование | frontend unit/smoke тесты ключевых runtime и UX состояний |

## Риски и откат
- **Риск:** визуальные правки сломают стабильный auth-runtime из `002`.  
  **Митигация:** не менять протокол auth, отдельно проверять сценарии `401/403` после UI-изменений.
- **Риск:** runtime-композиция приведёт к нестабильности рендера при частичных отказах модулей.  
  **Митигация:** обязательные fallback/error boundaries и smoke на degraded сценариях.
- **Риск:** незавершённый Keycloak branding затянет этап.  
  **Митигация:** MVP-границы и явный follow-up на глубокую кастомизацию Keycloak theme.
- **Риск:** несогласованность UX между guest/auth зоны.  
  **Митигация:** единая state-модель и smoke-checklist переходов.
- **Откат:** rollback на предыдущий layout/entrypoint `hub-shell` без изменений IAM и backend контрактов.

## Проверка после выполнения
- `cd hub-shell && npm run lint && npm run build`
- `cd hub-shell && npm run test` (если тест-раннер добавлен)
- `docker compose --profile aprilhub up -d`
- Ручной smoke:
  - guest/login gate (до логина),
  - login через Keycloak -> authorized app shell + bootstrap context,
  - composition через registry/loader для базовых модулей,
  - отказ части модулей -> fallback/error boundaries,
  - insufficient role -> access denied screen,
  - logout/session-expired -> возврат в guest/login без циклов.

## Примечания
- При изменении scope синхронно обновлять `TASK.md` и этот `PLAN.md`.
- Если потребуется изменение архитектурных границ shell composition, вынести решение в ADR/follow-up.
- Обновление 2026-04-14: реализованы App Shell Core, registry/loader/composition, shared UX states и unit/smoke-ориентированный frontend test harness на Vitest.
