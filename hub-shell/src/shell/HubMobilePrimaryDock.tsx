import { AprilMobileShellBar } from "@april/ui";
import { Button, Group } from "@mantine/core";
import type { ShellNavItem } from "./shell-nav-config";

type Props = {
  items: ShellNavItem[];
  activeId: string;
};

/**
 * Глобальный dock AprilHub на узком viewport (ADR-0006 / чеклист интеграции):
 * одна нижняя капсула уровня приложения; список профилей в host не поднимает вторую
 * `AprilMobileShellBar` у `CardListColumn` (`cardListColumnMobileLayout="off"`).
 */
export function HubMobilePrimaryDock({ items, activeId }: Props): JSX.Element {
  return (
    <AprilMobileShellBar
      position="fixed"
      withSearch={false}
      center={
        <Group gap={6} justify="center" wrap="nowrap">
          {items.map((item) => {
            const active = item.id === activeId;
            return (
              <Button
                key={item.id}
                component="a"
                href={item.href}
                size="compact-sm"
                radius="xl"
                variant="default"
                styles={{
                  root: active
                    ? {
                        backgroundColor: "var(--mantine-color-white)",
                        color: "var(--mantine-color-teal-9)",
                        border: "1px solid rgba(0, 0, 0, 0.06)",
                      }
                    : {
                        backgroundColor: "transparent",
                        color: "rgba(255, 255, 255, 0.92)",
                        border: "1px solid rgba(255, 255, 255, 0.45)",
                      },
                }}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Button>
            );
          })}
        </Group>
      }
    />
  );
}
