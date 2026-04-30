import { lazy, Suspense, type JSX } from "react";
import type { ProfileWidgetTelemetryEvent } from "./integrations/april-profile-ui";
import type { ShellUserContext } from "./types";
import { keycloak } from "./keycloak";
import { CompositionErrorBoundary } from "./composition-error-boundary";
import { useHubHostContext } from "./shell/hub-host-context";
import { captureRuntimeError } from "./sentry";
import { SharedState } from "./shared-ux";

type WidgetProps = {
  context: ShellUserContext;
};

const ProfilesWidget = lazy(async () => {
  const module = await import("./integrations/april-profile-ui");
  return { default: module.ProfilesWidget };
});

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
  const apiBaseUrl = `${window.location.origin}/api/v1/admin/profile/api`;

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
    <div className="profiles-widget-host">
      <CompositionErrorBoundary moduleName="ProfilesWidget" tenant={context.orgScope} correlationId={context.correlationId}>
        <Suspense fallback={<SharedState state="loading" message="Подключаем модуль профилей…" />}>
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
            apiBaseUrl={apiBaseUrl}
            accessToken={keycloak.token}
            onObservability={handleObservability}
          />
        </Suspense>
      </CompositionErrorBoundary>
    </div>
  );
}
