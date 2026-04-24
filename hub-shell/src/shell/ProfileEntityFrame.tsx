import { Anchor, Button, Group, Modal, Text, Title } from "@mantine/core";
import { useMemo, useState } from "react";
import { CompositionErrorBoundary } from "../composition-error-boundary";
import { ProfileWidget } from "../widgets";
import type { ShellUserContext } from "../types";
import { shellPaths } from "./shell-paths";
import { ShellBreadcrumbs } from "./ShellBreadcrumbs";
import { useHubHostContext } from "./hub-host-context";
import { useShellToast } from "./shell-toast-context";

type Props = {
  context: ShellUserContext;
  entityId: string;
  tab: "card" | "meta";
};

export function ProfileEntityFrame({ context, entityId, tab }: Props): JSX.Element {
  const host = useHubHostContext();
  const toast = useShellToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const cardHref = useMemo(() => `#${shellPaths.profileEntity(entityId, "card")}`, [entityId]);
  const metaHref = useMemo(() => `#${shellPaths.profileEntity(entityId, "meta")}`, [entityId]);

  return (
    <section data-testid="profile-domain-shell" className="profile-domain-shell">
      <ShellBreadcrumbs match={host.route.match} />
      <Group justify="space-between" mb="md" wrap="wrap">
        <div>
          <Title order={2}>Профиль April</Title>
          <Text size="sm" c="dimmed">
            Карточка сущности и вспомогательные вкладки. Виджет получает контекст только от host.
          </Text>
        </div>
        <Group gap="xs">
          <Button variant="default" type="button" onClick={() => host.navigation.goBack()} data-testid="shell-back-button">
            Назад
          </Button>
          <Button variant="light" type="button" onClick={() => host.navigation.goToOverview()}>
            К обзору
          </Button>
        </Group>
      </Group>

      <Group gap="xs" mb="md" role="tablist" aria-label="Вкладки карточки профиля">
        <Anchor
          href={cardHref}
          role="tab"
          aria-selected={tab === "card"}
          data-active={tab === "card" ? "true" : undefined}
          className={`shell-profile-tab${tab === "card" ? " shell-profile-tab-active" : ""}`}
        >
          Данные
        </Anchor>
        <Anchor
          href={metaHref}
          role="tab"
          aria-selected={tab === "meta"}
          data-active={tab === "meta" ? "true" : undefined}
          className={`shell-profile-tab${tab === "meta" ? " shell-profile-tab-active" : ""}`}
        >
          Связи
        </Anchor>
      </Group>

      {tab === "card" ? (
        <CompositionErrorBoundary moduleName="Профиль (виджет)">
          <ProfileWidget context={context} routeEntityId={entityId === "new" ? null : entityId} />
        </CompositionErrorBoundary>
      ) : (
        <article className="widget-card" data-testid="profile-meta-placeholder">
          <Title order={4}>Заглушка вкладки «Связи»</Title>
          <Text size="sm" mb="md">
            Отдельный маршрут вкладки для той же сущности. Продуктовый контент — в задачах 026+.
          </Text>
          <Button
            type="button"
            color="orange"
            variant="outline"
            onClick={() => setConfirmOpen(true)}
            data-testid="shell-danger-demo-button"
          >
            Демо опасного действия
          </Button>
          <Modal
            opened={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            title="Подтверждение"
            data-testid="shell-confirm-dialog"
          >
            <Text size="sm">
              Подтвердите демонстрационное действие. В продукте здесь будет политика подтверждения для удаления/публикации.
            </Text>
            <Group mt="md" justify="flex-end">
              <Button type="button" variant="default" onClick={() => setConfirmOpen(false)}>
                Отмена
              </Button>
              <Button
                type="button"
                variant="filled"
                color="red"
                onClick={() => {
                  setConfirmOpen(false);
                  toast.showSuccess("Демо-действие подтверждено");
                }}
              >
                Подтвердить
              </Button>
            </Group>
          </Modal>
        </article>
      )}
    </section>
  );
}
