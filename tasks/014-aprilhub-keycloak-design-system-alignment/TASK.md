# Задача: Keycloak UI/Theming Alignment with April Design System (Этап 014)

## Мета
- **ID / ветка:** `014-aprilhub-keycloak-design-system-alignment`
- **Приоритет:** высокий
- **Связанные документы:** `task_list.md`, `tasks/013-aprilhub-guest-landing-entrypoint/TASK.md`, `tasks/012-aprilhub-unified-ingress-auth-hardening/REPORT.md`, `infra/keycloak/realm/april-realm.json`, `docs/AGENT_ARCHITECTURE_CONTEXT.md`, `docs/DEPLOYMENT_STRATEGY.md`

## Цель
Привести пользовательский интерфейс Keycloak (login и связанные auth-экраны) к визуальным стандартам AprilHub, чтобы переход из guest-зоны в авторизацию выглядел как единый продуктовый сценарий без визуального разрыва.

## Контекст для агента
- После этапа `013` вход в auth flow происходит с нового лендинга и становится центральным UX-сценарием.
- Базовый Keycloak theme может визуально расходиться с дизайн-системой `hub-shell`, что снижает целостность продукта.
- Необходимо сохранить совместимость с текущим realm/client-конфигом и ingress путями, зафиксированными на `012`.

## Входит в объём
- Определить целевой объём кастомизации Keycloak theme для dev/runtime контура:
  - login page,
  - error/info states (минимально необходимые auth screens),
  - кнопки/поля/типографика/цвета в рамках дизайн-системы AprilHub.
- Реализовать и подключить theme в `infra/keycloak`/compose-конфигурации по принятому в репозитории паттерну.
- Проверить и при необходимости актуализировать realm-настройки (только в части использования темы и UI-связанных параметров).
- Проверить end-to-end сценарий: guest landing -> branded Keycloak login -> возврат в `hub-shell`.
- Обновить эксплуатационную документацию по применению темы (если требуется) и оформить `PLAN.md`/`REPORT.md`.

## Не входит в объём
- Изменение OIDC протокольной логики, ролей, токенов и backend валидации JWT.
- Добавление новых бизнес-функций Keycloak (federation, custom authenticators) вне UI/theming scope.
- Переработка авторизованного layout `hub-shell` (scope этапа `015`).

## Технические ограничения
- Source of truth для IAM/RBAC остаётся Keycloak; интеграция должна быть обратимо-конфигурационной.
- Не коммитить секреты админ-доступа и runtime токены.
- Не ломать сценарии deploy/rollback из `docs/DEPLOYMENT_STRATEGY.md`.
- Изменения ограничить UI/theming уровнем без влияния на OpenAPI и backend контракты.
- Пользовательские элементы Keycloak theme (заголовки, подсказки, кнопки, сообщения об ошибках) должны быть на русском языке.

## Критерии готовности (acceptance)
- [ ] Keycloak login и связанные auth-экраны визуально согласованы с дизайн-системой AprilHub.
- [ ] Theme подключается в текущем compose/runtime без ручных временных патчей.
- [ ] Сценарий перехода `guest -> Keycloak -> authorized` проходит end-to-end с новым оформлением.
- [ ] Realm/config изменения (если есть) документированы и воспроизводимы.
- [ ] В `REPORT.md` зафиксированы состав theme-кастомизаций, проверки и ограничения/follow-up.

## Проверка (команды)
```bash
docker compose --profile aprilhub config
docker compose up -d keycloak
./scripts/smoke-aprilhub.sh
```

## Результат в отчёте
После выполнения оформить `REPORT.md`: какие экраны Keycloak кастомизированы, как подключена тема, какие e2e/smoke проверки выполнены и что запланировано на этап `015`.
