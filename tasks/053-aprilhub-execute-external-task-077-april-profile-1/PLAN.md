# План: задача 053 / внешняя 077 (hub-shell → GPR)

1. Разобрать `april-profile-1/tasks/077-*/TASK.md`, зависимости 075/076, критерии acceptance.
2. `hub-shell/package.json`: алиасы `npm:@ukituki-ps/april-{tokens,ui}@^0.1.9`, peer `@mantine/hooks`.
3. `hub-shell/.npmrc` + `.npmrc.example`: GPR через `${NODE_AUTH_TOKEN}`.
4. `package-lock.json`: согласовать с lock `april-profile-1/frontend` (транзитив DS + hub-only зависимости), без `file:` на DisignApril.
5. `scripts/ds-prepare.sh`: при отсутствии `file:` на submodule — только fallback tokens, без `pnpm build` и без sync dist.
6. `assert-ui-dist-exports.mjs`: проверка экспортов по `node_modules/@april/ui` при установке из registry.
7. CI: `setup-node` scope GPR, alpine preflight без дублирования токена в `.npmrc`; убрать лишний corepack для hub-shell job.
8. Документация: `docs/guides/DESIGN_SYSTEM.md`.
9. Проверки: `make openapi-lint`, `hub-bff` tests; hub-shell — в CI с `GPR_READ_TOKEN` / `GITHUB_TOKEN` + read packages.
10. Двойной отчёт: `REPORT.md` здесь и во внешнем `april-profile-1`.
