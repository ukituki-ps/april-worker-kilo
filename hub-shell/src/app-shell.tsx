import type { ReactNode } from "react";
import type { ShellUserContext } from "./types";

type ShellNavigationItem = {
  id: string;
  label: string;
  href: string;
};

type Props = {
  context: ShellUserContext | null;
  navigationItems: ShellNavigationItem[];
  activeNavId?: string;
  title: string;
  subtitle: string;
  statusBadgeLabel: string;
  onProfile?: () => void;
  onLogout?: () => void;
  children: ReactNode;
};

export function AppShell({
  context,
  navigationItems,
  activeNavId,
  title,
  subtitle,
  statusBadgeLabel,
  onProfile,
  onLogout,
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
          {context && <span className="shell-user-email">{context.user.email}</span>}
          {onProfile && (
            <button type="button" className="shell-action shell-action-secondary" onClick={onProfile}>
              Профиль
            </button>
          )}
          {onLogout && (
            <button type="button" className="shell-action shell-action-danger" onClick={onLogout}>
              Выйти
            </button>
          )}
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
