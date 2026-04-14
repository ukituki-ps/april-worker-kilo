import type { ReactNode } from "react";
import type { ShellUserContext } from "./types";

type Props = {
  context: ShellUserContext;
  onLogout: () => void;
  children: ReactNode;
};

export function AppShell({ context, onLogout, children }: Props) {
  return (
    <main className="app-shell">
      <header className="shell-header">
        <h1>AprilHub Shell</h1>
        <div className="shell-user">
          <span>{context.user.email}</span>
          <button type="button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>
      <div className="shell-layout">
        <nav className="shell-nav" aria-label="Primary">
          <a href="#overview">Overview</a>
          <a href="#roles">Roles</a>
          <a href="#admin">Admin</a>
        </nav>
        <section className="shell-content">{children}</section>
      </div>
    </main>
  );
}
