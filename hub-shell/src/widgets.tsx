import { useEffect, useMemo, useState } from "react";
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

const DEFAULT_PROFILE_LIST_IDS = ["00000000-0000-0000-0000-000000000001"];
type ProfilesListItem = {
  entityId: string;
  entityTypeId: string;
  version: number;
  preview: string;
};

type ProfilesListAction =
  | { type: "created"; item: ProfilesListItem }
  | { type: "loaded"; count: number };

const readProfileListIds = (): string[] => {
  const raw = import.meta.env.VITE_PROFILE_LIST_ENTITY_IDS?.trim();
  if (!raw) {
    return DEFAULT_PROFILE_LIST_IDS;
  }
  const parsed = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : DEFAULT_PROFILE_LIST_IDS;
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

export function ProfilesListHostWidget({ context }: WidgetProps): JSX.Element {
  const toast = useShellToast();
  const [lastAction, setLastAction] = useState<ProfilesListAction | null>(null);
  const [lastError, setLastError] = useState("");
  const [items, setItems] = useState<ProfilesListItem[]>([]);
  const [entityTypeId, setEntityTypeId] = useState(import.meta.env.VITE_PROFILE_DEFAULT_ENTITY_TYPE_ID?.trim() || "");
  const [createLoading, setCreateLoading] = useState(false);
  const entityIds = useMemo(() => readProfileListIds(), []);
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

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const loaded = await Promise.all(
          entityIds.map(async (entityId) => {
            const response = await fetch(`/api/v1/admin/profile/api/v1/entities/${entityId}`, {
              headers: {
                ...(keycloak.token ? { Authorization: `Bearer ${keycloak.token}` } : {}),
                "Content-Type": "application/json",
              },
            });
            if (!response.ok) {
              throw new Error(`load failed: ${response.status}`);
            }
            const snapshot = (await response.json()) as {
              entity_id: string;
              entity_type_id?: string;
              version: number;
              document?: Record<string, unknown>;
            };
            return {
              entityId: snapshot.entity_id,
              entityTypeId: snapshot.entity_type_id ?? "unknown",
              version: snapshot.version,
              preview: JSON.stringify(snapshot.document ?? {}),
            } satisfies ProfilesListItem;
          }),
        );
        if (cancelled) {
          return;
        }
        setItems(loaded);
        setLastAction({ type: "loaded", count: loaded.length });
      } catch (error) {
        if (cancelled) {
          return;
        }
        const message = error instanceof Error ? error.message : "profiles list load failed";
        setLastError(message);
        toast.showError(message);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [entityIds, toast]);

  const handleCreate = async (): Promise<void> => {
    if (!entityTypeId.trim()) {
      const message = "Entity type ID is required";
      setLastError(message);
      toast.showError(message);
      return;
    }
    setCreateLoading(true);
    setLastError("");
    try {
      const response = await fetch("/api/v1/admin/profile/api/v1/entities", {
        method: "POST",
        headers: {
          ...(keycloak.token ? { Authorization: `Bearer ${keycloak.token}` } : {}),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entity_type_id: entityTypeId.trim(),
          document: {
            tenant_id: hostContext.tenant.id,
            source: "hub-shell-list",
          },
        }),
      });
      if (!response.ok) {
        throw new Error(`create failed: ${response.status}`);
      }
      const snapshot = (await response.json()) as {
        entity_id: string;
        entity_type_id?: string;
        version: number;
        document?: Record<string, unknown>;
      };
      const createdItem: ProfilesListItem = {
        entityId: snapshot.entity_id,
        entityTypeId: snapshot.entity_type_id ?? entityTypeId.trim(),
        version: snapshot.version,
        preview: JSON.stringify(snapshot.document ?? {}),
      };
      setItems((prev) => [createdItem, ...prev]);
      setLastAction({ type: "created", item: createdItem });
      toast.showSuccess("Profiles list action: created");
    } catch (error) {
      const message = error instanceof Error ? error.message : "profiles list create failed";
      setLastError(message);
      toast.showError(message);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div>
      <article className="widget-card">
        <h3>Profiles list widget</h3>
        <p>Tenant: {hostContext.tenant.id}</p>
        <label htmlFor="profiles-list-entity-type-id">Entity type ID</label>
        <input
          id="profiles-list-entity-type-id"
          aria-label="Entity type ID"
          value={entityTypeId}
          onChange={(event) => setEntityTypeId(event.currentTarget.value)}
        />
        <button type="button" onClick={() => void handleCreate()} disabled={createLoading}>
          Create profile
        </button>
        <ul>
          {items.map((item) => (
            <li key={item.entityId}>{item.entityId}</li>
          ))}
        </ul>
      </article>
      {lastAction ? <p data-testid="profiles-list-last-action">Последнее действие: {lastAction.type}</p> : null}
      {lastError ? (
        <Alert color="red" data-testid="profiles-list-last-error">
          Ошибка списка профилей: {lastError}
        </Alert>
      ) : null}
    </div>
  );
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
