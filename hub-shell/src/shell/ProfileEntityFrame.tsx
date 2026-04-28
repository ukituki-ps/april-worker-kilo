import { Button, Group, Text, Title } from "@mantine/core";
import type { ShellUserContext } from "../types";
import { ShellBreadcrumbs } from "./ShellBreadcrumbs";
import { useHubHostContext } from "./hub-host-context";

type Props = {
  context: ShellUserContext;
  entityId: string;
  tab: "card" | "meta";
};

export function ProfileEntityFrame({ context, entityId, tab }: Props): JSX.Element {
  const host = useHubHostContext();

  return (
    <section data-testid="profile-domain-shell" className="profile-domain-shell">
      <ShellBreadcrumbs match={host.route.match} />
      <Group justify="space-between" mb="md" wrap="wrap">
        <div>
          <Title order={2}>Профиль April</Title>
          <Text size="sm" c="dimmed">
            Маршрут карточки профиля выведен из активного runtime-контракта.
          </Text>
        </div>
        <Group gap="xs">
          <Button variant="default" type="button" onClick={() => host.navigation.goBack()} data-testid="shell-back-button">
            Назад
          </Button>
          <Button variant="light" type="button" onClick={() => host.navigation.goToProfilesList()}>
            К списку профилей
          </Button>
        </Group>
      </Group>
      <article className="widget-card">
        <Title order={4}>Legacy-путь отключен</Title>
        <Text size="sm">
          Запрошен устаревший маршрут ({entityId}/{tab}). Используйте раздел `Профиль — список`.
        </Text>
      </article>
    </section>
  );
}
