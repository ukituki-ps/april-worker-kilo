import { lazy, Suspense, useCallback, useEffect, useMemo, useState, type JSX } from "react";
import type { ProfileWidgetTelemetryEvent } from "./integrations/april-profile-ui";
import type { ShellUserContext } from "./types";
import { keycloak } from "./keycloak";
import { subscribeKeycloakTokenRotation } from "./keycloak-token-subscribers";
import { CompositionErrorBoundary } from "./composition-error-boundary";
import { useHubHostContext } from "./shell/hub-host-context";
import { captureRuntimeError } from "./sentry";
import { SharedState } from "./shared-ux";

type WidgetProps = {
  context: ShellUserContext;
};

/** Прокидывает актуальный Bearer в profile-ui: ref в виджете обновляется только при ререндере после ротации токена в keycloak-js. */
function useProfileWidgetAccessToken(): string | undefined {
  const [accessToken, setAccessToken] = useState(() => keycloak.token);

  useEffect(() => {
    return subscribeKeycloakTokenRotation(() => {
      setAccessToken(keycloak.token);
    });
  }, []);

  return accessToken;
}

const ProfilesWidget = lazy(async () => {
  const module = await import("./integrations/april-profile-ui");
  return { default: module.ProfilesWidget };
});

const EntityTypesWidget = lazy(async () => {
  const module = await import("./integrations/april-profile-ui");
  return { default: module.EntityTypesWidget };
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

export function EntityTypesListHostWidget({ context }: WidgetProps): JSX.Element {
  const host = useHubHostContext();
  const accessToken = useProfileWidgetAccessToken();
  const apiBaseUrl = useMemo(
    () => `${window.location.origin}/api/v1/admin/profile/api`,
    [],
  );
  const widgetHostContext = useMemo(
    () => ({
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
    }),
    [
      context.correlationId,
      host.auth?.roles,
      host.auth?.subject,
      host.auth?.tokenRef,
      host.locale,
      host.telemetry?.requestId,
      host.tenant.id,
      host.theme,
    ],
  );

  const handleObservability = useCallback((event: ProfileWidgetTelemetryEvent): void => {
    if (event.event.endsWith("_failed")) {
      captureRuntimeError(new Error(`[entity-types-widget] ${event.event}`), {
        mechanism: "manual",
        moduleName: "entity-types-widget",
        widget: event.widget,
        tenant: context.orgScope,
        correlationId: event.correlation_id,
        requestId: event.request_id,
        extra: event.meta ? { meta: event.meta } : undefined,
      });
    }
  }, [context.orgScope]);

  return (
    <div className="entity-types-widget-host">
      <CompositionErrorBoundary moduleName="EntityTypesWidget" tenant={context.orgScope} correlationId={context.correlationId}>
        <Suspense fallback={<SharedState state="loading" message="Подключаем модуль шаблонов…" />}>
          <EntityTypesWidget
            hostContext={widgetHostContext}
            apiBaseUrl={apiBaseUrl}
            accessToken={accessToken}
            onObservability={handleObservability}
          />
        </Suspense>
      </CompositionErrorBoundary>
    </div>
  );
}

export function ProfilesListHostWidget({ context }: WidgetProps): JSX.Element {
  const host = useHubHostContext();
  const accessToken = useProfileWidgetAccessToken();
  const apiBaseUrl = useMemo(
    () => `${window.location.origin}/api/v1/admin/profile/api`,
    [],
  );
  const widgetHostContext = useMemo(
    () => ({
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
    }),
    [
      context.correlationId,
      host.auth?.roles,
      host.auth?.subject,
      host.auth?.tokenRef,
      host.locale,
      host.telemetry?.requestId,
      host.tenant.id,
      host.theme,
    ],
  );

  const handleObservability = useCallback((event: ProfileWidgetTelemetryEvent): void => {
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
  }, [context.orgScope]);

  return (
    <div className="profiles-widget-host">
      <CompositionErrorBoundary moduleName="ProfilesWidget" tenant={context.orgScope} correlationId={context.correlationId}>
        <Suspense fallback={<SharedState state="loading" message="Подключаем модуль профилей…" />}>
          <ProfilesWidget
            hostContext={widgetHostContext}
            apiBaseUrl={apiBaseUrl}
            accessToken={accessToken}
            onObservability={handleObservability}
          />
        </Suspense>
      </CompositionErrorBoundary>
    </div>
  );
}
