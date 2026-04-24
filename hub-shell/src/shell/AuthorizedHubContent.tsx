import { useEffect } from "react";
import { CompositionErrorBoundary } from "../composition-error-boundary";
import {
  OverviewWidget,
  RolesWidget,
  BrokenWidget,
  ProfilesListHostWidget,
  ProfileInstancesHostWidget,
  InstanceHistoryHostWidget,
  ConflictsMergeHostWidget,
} from "../widgets";
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
        <CompositionErrorBoundary moduleName="Профиль (экземпляры)">
          <ProfileInstancesHostWidget context={context} routeEntityId={match.instanceId} />
        </CompositionErrorBoundary>
      </RouteChrome>
    );
  }

  if (match.kind === "profile-instance-history") {
    return (
      <RouteChrome>
        <CompositionErrorBoundary moduleName="Профиль (история экземпляра)">
          <InstanceHistoryHostWidget context={context} routeEntityId={match.instanceId} />
        </CompositionErrorBoundary>
      </RouteChrome>
    );
  }

  if (match.kind === "profile-list") {
    return (
      <RouteChrome>
        <CompositionErrorBoundary moduleName="Профиль (список)">
          <ProfilesListHostWidget context={context} />
        </CompositionErrorBoundary>
      </RouteChrome>
    );
  }

  if (match.kind === "profile-admin-conflicts") {
    if (!context.roles.includes("admin")) {
      return (
        <RouteChrome>
          <SharedState
            state="forbidden"
            message="Раздел «Конфликты и merge» доступен только при наличии realm-роли admin в токене AprilHub."
          />
        </RouteChrome>
      );
    }
    return (
      <RouteChrome>
        <CompositionErrorBoundary moduleName="Профиль (конфликты и merge)">
          <ConflictsMergeHostWidget context={context} />
        </CompositionErrorBoundary>
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
