import { useEffect } from "react";
import { CompositionErrorBoundary } from "../composition-error-boundary";
import { OverviewWidget, RolesWidget, BrokenWidget } from "../widgets";
import type { ShellUserContext } from "../types";
import { SharedState } from "../shared-ux";
import { matchShellRoute, shellNavigate, shellPaths } from "./shell-paths";
import { useShellPathname } from "./use-shell-pathname";
import { ProfileEntityFrame } from "./ProfileEntityFrame";
import { ShellBreadcrumbs } from "./ShellBreadcrumbs";
import { useHubHostContext } from "./hub-host-context";

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
      shellNavigate(shellPaths.overview);
    }
  }, [match.kind]);

  if (match.kind === "redirect") {
    return <SharedState state="loading" message="Перенаправляем в раздел «Обзор»…" />;
  }

  if (match.kind === "not-found") {
    return (
      <SharedState
        state="error"
        message={`Маршрут не найден: ${pathname}`}
        action={
          <button type="button" className="shell-text-button" onClick={() => shellNavigate(shellPaths.overview)}>
            Перейти к обзору
          </button>
        }
      />
    );
  }

  if (match.kind === "overview") {
    return (
      <RouteChrome>
        <OverviewWidget context={context} />
      </RouteChrome>
    );
  }

  if (match.kind === "roles") {
    return (
      <RouteChrome>
        <RolesWidget context={context} />
      </RouteChrome>
    );
  }

  if (match.kind === "profile-instance") {
    return (
      <RouteChrome>
        <SharedState
          state="empty"
          message={`Раздел экземпляра профиля (instanceId=${match.instanceId}) зарезервирован под задачу 028. Deep-link: ${pathname}`}
        />
      </RouteChrome>
    );
  }

  if (match.kind === "profile-entity") {
    return <ProfileEntityFrame context={context} entityId={match.entityId} tab={match.tab} />;
  }

  if (match.kind === "admin") {
    if (!context.roles.includes("admin")) {
      return (
        <RouteChrome>
          <SharedState state="forbidden" message="Раздел администрирования доступен только роли admin." />
        </RouteChrome>
      );
    }
    return (
      <RouteChrome>
        <CompositionErrorBoundary moduleName="Админ-контур">
          <BrokenWidget context={context} />
        </CompositionErrorBoundary>
      </RouteChrome>
    );
  }

  return <SharedState state="error" message="Неизвестное состояние маршрута." />;
}
