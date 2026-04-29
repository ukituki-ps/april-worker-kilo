import type { JSX } from "react";
import { CompositionErrorBoundary } from "./composition-error-boundary";
import { keycloak } from "./keycloak";
import { captureRuntimeError } from "./sentry";
import { useHubHostContext } from "./shell/hub-host-context";
import { useShellToast } from "./shell/shell-toast-context";
import { shellNavigate } from "./shell/shell-paths";
import type { ShellUserContext } from "./types";
import { ProfilesWidget, type ProfileWidgetTelemetryEvent, type ProfilesListAction } from "./vendor/april-profile-ui";

type WidgetProps = {
  context: ShellUserContext;
};

export function OverviewWidget({ context }: WidgetProps) {
  return (
    <article className="widget-card" data-testid="shell-overview-widget">
      <h3 id="overview">Обзор</h3>
      <p>Добро пожаловать, {context.user.name || context.user.username}.</p>
      <p>Корреляция запроса: {context.correlationId}</p>
    </article>
  );
}

export function RolesWidget({ context }: WidgetProps) {
  return (
    <article className="widget-card" data-testid="shell-roles-widget">
      <h3 id="roles">Роли доступа</h3>
      <p data-testid="shell-roles-text">{context.roles.join(", ") || "Роли отсутствуют"}</p>
    </article>
  );
}

export function BrokenWidget(_props: WidgetProps): JSX.Element {
  throw new Error("Widget crash");
}

export function ProfilesListHostWidget({ context }: WidgetProps): JSX.Element {
  const host = useHubHostContext();
  const toast = useShellToast();
  const apiBaseUrl = `${window.location.origin}/api/v1/admin/profile/api`;

  const handleAction = (action: ProfilesListAction): void => {
    if (action.type === "created") {
      toast.showSuccess("Профиль успешно создан.");
      return;
    }
    if (action.type === "updated") {
      toast.showSuccess("Профиль успешно обновлен.");
      return;
    }
    toast.showSuccess("Профиль удален.");
  };

  const handleError = (payload: { message: string; requestId?: string; code?: string }): void => {
    const requestSuffix = payload.requestId ? ` (request_id: ${payload.requestId})` : "";
    toast.showError(`${payload.message}${requestSuffix}`);
  };

  const handleOpenEntity = (entityId: string): void => {
    shellNavigate(`/app/profile/entities/${encodeURIComponent(entityId)}/card`);
  };

  const handleObservability = (event: ProfileWidgetTelemetryEvent): void => {
    if (event.event.endsWith("_failed")) {
      captureRuntimeError(new Error(`[profiles-widget] ${event.event}`), {
        mechanism: "manual",
        moduleName: "profiles-widget",
        widget: event.widget,
        tenant: context.orgScope,
        correlationId: event.correlation_id,
        requestId: event.request_id,
        extra: event.meta ? { meta: event.meta } : undefined,
      });
    }
  };

  return (
    <CompositionErrorBoundary moduleName="ProfilesWidget" tenant={context.orgScope} correlationId={context.correlationId}>
      <ProfilesWidget
        hostContext={{
          tenant: { id: host.tenant.id },
          auth: {
            subject: host.auth?.subject,
            roles: host.auth?.roles,
            tokenRef: host.auth?.tokenRef,
          },
          theme: host.theme,
          locale: host.locale,
          telemetry: {
            requestId: host.telemetry?.requestId ?? context.correlationId,
            correlationId: context.correlationId,
          },
        }}
        accessToken={keycloak.token}
        apiBaseUrl={apiBaseUrl}
        onAction={handleAction}
        onError={handleError}
        onOpenEntity={handleOpenEntity}
        onObservability={handleObservability}
      />
    </CompositionErrorBoundary>
  );
}
