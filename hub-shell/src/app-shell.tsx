import type { ComponentType, ReactNode } from "react";
import { VisuallyHidden } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  ProductHeaderToolbar,
  ProductSidebarNavigation,
  aprilMobileShellBarContentPaddingBottom,
  type ProductHeaderToolbarLabels,
  type ProductSidebarNavEntry,
} from "@april/ui";
import { ProfileAccountMenu, type ProfileAccountMenuProps } from "./shell-header/ProfileAccountMenu";
import type { ShellNavItem } from "./shell/shell-nav-config";
import type { SidebarGlyphProps } from "./shell/shell-sidebar-icons";
import { EntityTypesSidebarIcon, ProfilesSidebarIcon } from "./shell/shell-sidebar-icons";
import { HubMobilePrimaryDock } from "./shell/HubMobilePrimaryDock";

/** Согласовано с `CardListColumn` / DS §8 mobile (`max-width: 47.99em`). */
const HUB_MOBILE_PRIMARY_NAV_MQ = "(max-width: 47.99em)";

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

function sidebarIconForNavId(id: string): ComponentType<SidebarGlyphProps> {
  if (id === "entity-types-list") {
    return EntityTypesSidebarIcon;
  }
  return ProfilesSidebarIcon;
}

function buildSidebarItems(items: ShellNavItem[]): ProductSidebarNavEntry[] {
  return items.map((item) => ({
    id: item.id,
    type: "link" as const,
    label: item.label,
    href: item.href,
    icon: sidebarIconForNavId(item.id),
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
  const isMobilePrimaryNav = useMediaQuery(HUB_MOBILE_PRIMARY_NAV_MQ, false);
  const sidebarItems = buildSidebarItems(navigationItems);
  const firstNavId =
    sidebarItems.find((x): x is Extract<ProductSidebarNavEntry, { type: "link" }> => x.type === "link")?.id ?? "";
  const effectiveNavId = activeNavId ?? firstNavId;
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
      <div
        className="shell-layout shell-layout-fill"
        style={
          isMobilePrimaryNav
            ? { paddingBottom: aprilMobileShellBarContentPaddingBottom(), boxSizing: "border-box" }
            : undefined
        }
      >
        {isMobilePrimaryNav ? null : (
          <ProductSidebarNavigation
            items={sidebarItems}
            activeId={effectiveNavId}
            labels={{
              settings: "Настройки",
              expandSidebar: "Развернуть панель",
              collapseSidebar: "Свернуть панель",
            }}
          />
        )}
        <section className="shell-content">{children}</section>
      </div>
      {isMobilePrimaryNav ? <HubMobilePrimaryDock items={navigationItems} activeId={effectiveNavId} /> : null}
    </main>
  );
}
