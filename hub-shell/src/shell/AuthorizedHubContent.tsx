import { useEffect } from "react";
import type { ShellUserContext } from "../types";
import { SharedState } from "../shared-ux";
import { matchShellRoute, shellNavigate, shellPaths } from "./shell-paths";
import { useShellPathname } from "./use-shell-pathname";
import { ShellBreadcrumbs } from "./ShellBreadcrumbs";
import { useHubHostContext } from "./hub-host-context";
import { CompositionErrorBoundary } from "../composition-error-boundary";
import { ProfilesListHostWidget } from "../widgets";

type Props = {
  context: ShellUserContext;
};

function RouteChrome({ children }: { children: React.ReactNode }): JSX.Element {
  const host = useHubHostContext();
  return (
    <div className="shell-route-chrome">
      <ShellBreadcrumbs match={host.route.match} />
      {children}
    </div>
  );
}

export function AuthorizedHubContent({ context }: Props): JSX.Element {
  const pathname = useShellPathname();
  const match = matchShellRoute(pathname);

  useEffect(() => {
    if (match.kind === "redirect") {
      shellNavigate(shellPaths.profilesList);
    }
  }, [match.kind]);

  if (match.kind === "redirect") {
    return <SharedState state="loading" message="Перенаправляем в авторизованный контур…" />;
  }

  if (match.kind === "not-found") {
    return (
      <SharedState
        state="error"
        message={`Маршрут не найден: ${pathname}`}
        action={
          <button type="button" className="shell-text-button" onClick={() => shellNavigate(shellPaths.profilesList)}>
            Перейти в рабочую зону
          </button>
        }
      />
    );
  }

  if (match.kind === "profiles-list") {
    return (
      <RouteChrome>
        <CompositionErrorBoundary moduleName="Profiles list widget" tenant={context.orgScope} correlationId={context.correlationId}>
          <ProfilesListHostWidget context={context} />
        </CompositionErrorBoundary>
      </RouteChrome>
    );
  }

  return <SharedState state="error" message="Неизвестное состояние маршрута." />;
}
