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

  if (match.kind === "profiles-list") {
    items.push(
      <Text key="cur" size="sm">
        Профили
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
