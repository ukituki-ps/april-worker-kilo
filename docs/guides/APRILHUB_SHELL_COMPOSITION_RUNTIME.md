# AprilHub Shell Composition Runtime (Этап 003)

Краткий runbook для локального запуска и проверки UX-сценариев `hub-shell`:

## 1. Подготовка

```bash
cd hub-shell
npm install
```

Проверьте env-конфигурацию:
- `VITE_KEYCLOAK_URL`
- `VITE_KEYCLOAK_REALM`
- `VITE_KEYCLOAK_CLIENT_ID`
- `VITE_API_BASE_URL`

## 2. Локальные quality gates

```bash
cd hub-shell
npm run lint
npm run build
npm run test
```

## 3. Runtime smoke

```bash
docker compose --profile aprilhub up -d
```

Проверить в браузере:
1. **Guest zone**: до логина отображается login gate.
2. **Keycloak transition**: после клика Login показывается transition state, затем authorized shell.
3. **Authorized zone**: отрисовываются App Shell Core (header/nav/content) и composition widgets.
4. **Partial failure**: при ошибке одного виджета остальные части shell продолжают работать (error boundary).
5. **Forbidden**: при `403` от bootstrap endpoint показывается консистентный access denied state.
6. **Logout/session-expired**: выход или невалидная сессия переводят UI обратно в guest zone без redirect-loop.

## 4. Ограничения MVP этапа 003

- Реестр модулей статический и локальный (без удалённого каталога модулей).
- Loader реализован как abstraction для локально зарегистрированных виджетов.
- Fallback и error boundaries работают на уровне shell-модулей; расширенная телеметрия деградаций перенесена в этап `006`.
