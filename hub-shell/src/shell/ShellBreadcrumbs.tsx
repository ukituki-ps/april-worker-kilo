import { Anchor, Breadcrumbs, Text } from "@mantine/core";
import type { ShellRouteMatch } from "./shell-paths";
import { shellPaths } from "./shell-paths";

type Props = {
  match: ShellRouteMatch;
};

export function ShellBreadcrumbs({ match }: Props): JSX.Element {
  const items: JSX.Element[] = [
    <Anchor key="hub" href="#/app/overview" size="sm">
      AprilHub
    </Anchor>,
  ];

  if (match.kind === "overview") {
    items.push(
      <Text key="cur" size="sm">
        Обзор
      </Text>,
    );
  } else if (match.kind === "roles") {
    items.push(
      <Text key="cur" size="sm">
        Роли доступа
      </Text>,
    );
  } else if (match.kind === "admin") {
    items.push(
      <Text key="cur" size="sm">
        Админ-контур
      </Text>,
    );
  } else if (match.kind === "profile-list") {
    items.push(
      <Text key="cur" size="sm">
        Профиль / Список
      </Text>,
    );
  } else if (match.kind === "profile-entity") {
    items.push(
      <Anchor key="prof" href={`#${shellPaths.profilesList}`} size="sm">
        Профиль
      </Anchor>,
    );
    items.push(
      <Text key="cur" size="sm">
        Сущность {match.entityId.slice(0, 8)}… / {match.tab === "card" ? "Данные" : "Связи"}
      </Text>,
    );
  } else if (match.kind === "profile-instance") {
    items.push(
      <Anchor key="prof" href={`#${shellPaths.profilesList}`} size="sm">
        Профиль
      </Anchor>,
    );
    items.push(
      <Text key="cur" size="sm">
        Экземпляр {match.instanceId}
      </Text>,
    );
  } else {
    items.push(
      <Text key="cur" size="sm">
        Раздел
      </Text>,
    );
  }

  return (
    <Breadcrumbs mb="sm" separator="→" aria-label="Навигационная цепочка">
      {items}
    </Breadcrumbs>
  );
}
