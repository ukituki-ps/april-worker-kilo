<!--
  ИНСТРУКЦИЯ: скопировать содержимое в репозиторий DisignApril (ukituki-ps/DisignApril),
  например как tasks/049-npm-publish-april-packages/TASK.md
  (номер подпапки выберите по правилам того репозитория).
-->

## Мета

- **Связь с эпиком AprilHub:** `april-worker` → `tasks/049-april-ds-registry-consumption-epic/`
- **Приоритет:** обычный

## Цель

Настроить **публикацию** пакетов `packages/ui` (`@april/ui`) и `packages/tokens` (`@april/tokens`) в **приватный npm registry** (рекомендуется **GitHub Packages** для scope `@april`), с **семантическим версионированием** и воспроизводимым CI.

## Контекст

Потребители (AprilHub `hub-shell`, AprilProfile UI) переходят с `file:` на версии из registry; источником опубликованного артефакта является **этот** монорепозиторий.

## Входит в объём

- Поля `name`, `version`, `files`, `exports`, `publishConfig` для публикуемых пакетов
- GitHub Actions workflow: сборка (`pnpm build`) + `npm publish` (или `pnpm publish`) на **tag** или **workflow_dispatch** с версией
- Документация в DisignApril: как выпустить версию, breaking / changelog policy
- Первый опубликованный релиз (согласовать стартовые версии с AprilHub до merge lock там)

## Не входит

- Изменения в приложениях-витринах, кроме необходимого для CI

## Технические ограничения

- Секреты только через GitHub Secrets / `GITHUB_TOKEN` с минимальными правами
- В опубликованный tarball не включать лишние PII/секреты

## Критерии готовности

- [ ] Успешная публикация `@april/tokens` и `@april/ui` в выбранный registry
- [ ] Документ «как выпустить патч/минор» в репозитории DisignApril
- [ ] Зафиксированы координаты для потребителей: URL registry, scope, пример `.npmrc`

## Проверка

```bash
# локально после настройки .npmrc с read-токеном
npm view @april/ui versions --json
npm view @april/tokens versions --json
```

## Результат в отчёте

`REPORT.md` в подпапке задачи DisignApril по шаблону того репозитория; в описании PR на AprilHub указать опубликованные версии.
