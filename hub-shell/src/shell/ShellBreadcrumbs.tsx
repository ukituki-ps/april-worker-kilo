import { Anchor, Breadcrumbs, Text } from "@mantine/core";
import type { ShellRouteMatch } from "./shell-paths";

type Props = {
  match: ShellRouteMatch;
};

export function ShellBreadcrumbs({ match }: Props): JSX.Element {
  const items: JSX.Element[] = [
    <Anchor key="hub" href="#/app" size="sm">
      AprilHub
    </Anchor>,
  ];

  if (match.kind === "home") {
    items.push(
      <Text key="cur" size="sm">
<<<<<<< HEAD
        Рабочая зона
=======
        Авторизованный контур
>>>>>>> parent of 41f02aa (Merge pull request #74 from ukituki-ps/feature/045-profiles-sidebar-widget)
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
