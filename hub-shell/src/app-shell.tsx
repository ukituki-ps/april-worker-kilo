import type { ReactNode } from "react";
import { VisuallyHidden } from "@mantine/core";
import {
  ProductHeaderToolbar,
  ProductSidebarNavigation,
  type ProductHeaderToolbarLabels,
  type ProductSidebarNavEntry,
} from "@april/ui";
import { ProfileAccountMenu, type ProfileAccountMenuProps } from "./shell-header/ProfileAccountMenu";
import type { ShellNavItem } from "./shell/shell-nav-config";
import { ProfilesSidebarIcon } from "./shell/shell-sidebar-icons";

type Props = {
  navigationItems: ShellNavItem[];
  activeNavId?: string;
  title: string;
  subtitle: string;
  statusBadgeLabel: string;
  accountMenu: ProfileAccountMenuProps;
  children: ReactNode;
};

const HEADER_LABELS_RU: ProductHeaderToolbarLabels = {
  searchPlaceholder: "Поиск задач, контактов, документов…",
  messages: "Сообщения",
  notifications: "Уведомления",
  help: "Справка",
};

function buildSidebarItems(items: ShellNavItem[]): ProductSidebarNavEntry[] {
  return items.map((item) => ({
    id: item.id,
    type: "link" as const,
    label: item.label,
    href: item.href,
    icon: ProfilesSidebarIcon,
  }));
}

export function AppShell({
  navigationItems,
  activeNavId,
  title,
  subtitle,
  statusBadgeLabel,
  accountMenu,
  children,
}: Props) {
  const sidebarItems = buildSidebarItems(navigationItems);
  const firstNavId =
    sidebarItems.find((x): x is Extract<ProductSidebarNavEntry, { type: "link" }> => x.type === "link")?.id ?? "";
  const brandSubtitleParts = [statusBadgeLabel.trim(), subtitle.trim()].filter(Boolean);
  const brandSubtitle =
    brandSubtitleParts.length > 0 ? brandSubtitleParts.join(" · ") : undefined;

  return (
    <main className="app-shell">
      <VisuallyHidden>
        <h1>{title}</h1>
      </VisuallyHidden>
      <header className="shell-header-bar">
        <ProductHeaderToolbar
          appName="AprilHub"
          appSubtitle={brandSubtitle}
          userSlot={<ProfileAccountMenu {...accountMenu} />}
          labels={HEADER_LABELS_RU}
        />
      </header>
      <div className="shell-layout shell-layout-fill">
        <ProductSidebarNavigation
          items={sidebarItems}
          activeId={activeNavId ?? firstNavId}
          labels={{
            settings: "Настройки",
            expandSidebar: "Развернуть панель",
            collapseSidebar: "Свернуть панель",
          }}
        />
        <section className="shell-content">{children}</section>
      </div>
    </main>
  );
}
