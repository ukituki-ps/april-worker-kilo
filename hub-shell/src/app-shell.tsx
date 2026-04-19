import type { ReactNode } from "react";
import { ProfileAccountMenu, type ProfileAccountMenuProps } from "./shell-header/ProfileAccountMenu";

type ShellNavigationItem = {
  id: string;
  label: string;
  href: string;
};

type Props = {
  navigationItems: ShellNavigationItem[];
  activeNavId?: string;
  title: string;
  subtitle: string;
  statusBadgeLabel: string;
  accountMenu: ProfileAccountMenuProps;
  children: ReactNode;
};

export function AppShell({
  navigationItems,
  activeNavId,
  title,
  subtitle,
  statusBadgeLabel,
  accountMenu,
  children,
}: Props) {
  return (
    <main className="app-shell">
      <header className="shell-header">
        <div className="shell-branding">
          <p className="shell-overline">Платформа AprilHub</p>
          <h1>{title}</h1>
          <p className="shell-subtitle">{subtitle}</p>
        </div>
        <div className="shell-header-actions">
          <span className="shell-status">{statusBadgeLabel}</span>
          <ProfileAccountMenu {...accountMenu} />
        </div>
      </header>
      <div className="shell-layout">
        <nav className="shell-nav" aria-label="Основная навигация">
          {navigationItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={`shell-nav-link${item.id === activeNavId ? " shell-nav-link-active" : ""}`}
              aria-current={item.id === activeNavId ? "page" : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <section className="shell-content">{children}</section>
      </div>
    </main>
  );
}
