import { useMemo, useState } from "react";
import { Alert } from "@mantine/core";
import { EntityProfileWidget } from "./profile-widget";
import type { ProfileWidgetHostContext, SaveSuccessPayload } from "./profile-widget";
import { useShellToast } from "./shell/shell-toast-context";
import type { ShellUserContext } from "./types";
import { keycloak } from "./keycloak";

type WidgetProps = {
  context: ShellUserContext;
  /** С маршрута: id сущности. `null` — явный сценарий создания без demo-id из env. */
  routeEntityId?: string | null;
};

export function OverviewWidget({ context }: WidgetProps) {
  return (
    <article className="widget-card">
      <h3 id="overview">Обзор</h3>
      <p>Добро пожаловать, {context.user.name || context.user.username}.</p>
      <p>Корреляция запроса: {context.correlationId}</p>
    </article>
  );
}

export function RolesWidget({ context }: WidgetProps) {
  return (
    <article className="widget-card">
      <h3 id="roles">Роли доступа</h3>
      <p>{context.roles.join(", ") || "Роли отсутствуют"}</p>
    </article>
  );
}

export function BrokenWidget(_props: WidgetProps): JSX.Element {
  throw new Error("Widget crash");
}

export function ProfileWidget({ context, routeEntityId }: WidgetProps) {
  const toast = useShellToast();
  const [saveResult, setSaveResult] = useState<SaveSuccessPayload | null>(null);
  const [saveError, setSaveError] = useState<string>("");
  const profileEntityTypeId = useMemo(() => import.meta.env.VITE_PROFILE_DEFAULT_ENTITY_TYPE_ID?.trim() || "", []);
  const profileInitialEntityId = useMemo(() => {
    if (routeEntityId === null) {
      return "";
    }
    if (routeEntityId !== undefined) {
      return routeEntityId;
    }
    return import.meta.env.VITE_PROFILE_DEMO_ENTITY_ID?.trim() || "";
  }, [routeEntityId]);
  const hostContext = useMemo<ProfileWidgetHostContext>(
    () => ({
      tenant: { id: context.orgScope },
      auth: {
        subject: context.user.sub,
        roles: context.roles,
        tokenRef: "keycloak",
      },
      locale: "ru-RU",
      telemetry: {
        requestId: context.correlationId,
      },
    }),
    [context],
  );

  return (
    <div>
      <EntityProfileWidget
        hostContext={hostContext}
        initialEntityId={profileInitialEntityId ? profileInitialEntityId : undefined}
        entityTypeId={profileEntityTypeId}
        apiBaseUrl="/api/v1/admin/profile/api"
        accessToken={keycloak.token}
        onSaveSuccess={(payload) => {
          setSaveResult(payload);
          setSaveError("");
          toast.showSuccess(`Профиль сохранён (версия ${payload.version})`);
        }}
        onError={(payload) => {
          setSaveError(payload.message);
          toast.showError(payload.message);
        }}
      />
      {saveResult ? (
        <p data-testid="profile-widget-save-success">
          onSaveSuccess: {saveResult.entityId} (v{saveResult.version})
        </p>
      ) : null}
      {saveError ? (
        <Alert color="red" data-testid="profile-widget-save-error">
          Ошибка сохранения профиля: {saveError}
        </Alert>
      ) : null}
    </div>
  );
}
