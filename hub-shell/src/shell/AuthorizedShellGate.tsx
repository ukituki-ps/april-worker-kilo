import { useMemo, type ReactNode } from "react";
import { AppShell } from "../app-shell";
import type { ProfileAccountMenuProps } from "../shell-header/ProfileAccountMenu";
import { SharedState } from "../shared-ux";
import type { ShellUserContext } from "../types";
import { AuthorizedHubContent } from "./AuthorizedHubContent";
import { buildPrimaryShellNav, filterNavByRoles, resolveActiveNavId } from "./shell-nav-config";
import { HubHostContextProvider } from "./hub-host-context";
import { ShellToastProvider } from "./shell-toast-context";
import { useShellPathname } from "./use-shell-pathname";

export type AuthorizedShellGateProps = {
  context: ShellUserContext;
  error: string;
  title: string;
  subtitle: string;
  statusBadgeLabel: string;
  accountMenu: ProfileAccountMenuProps;
};

export function AuthorizedShellGate({
  context,
  error,
  title,
  subtitle,
  statusBadgeLabel,
  accountMenu,
}: AuthorizedShellGateProps): JSX.Element {
  const pathname = useShellPathname();
  const navigationItems = useMemo(() => filterNavByRoles(buildPrimaryShellNav(), context.roles), [context.roles]);
  const activeNavId = resolveActiveNavId(pathname, navigationItems);

  const shellBody: ReactNode = (
    <>
      <AuthorizedHubContent context={context} />
      {error ? <SharedState state="error" message={error} /> : null}
    </>
  );

  return (
    <HubHostContextProvider context={context}>
      <ShellToastProvider>
        <AppShell
          navigationItems={navigationItems}
          activeNavId={activeNavId}
          title={title}
          subtitle={subtitle}
          statusBadgeLabel={statusBadgeLabel}
          accountMenu={accountMenu}
        >
          {shellBody}
        </AppShell>
      </ShellToastProvider>
    </HubHostContextProvider>
  );
}
