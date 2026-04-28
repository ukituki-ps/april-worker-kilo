import { useEffect, useMemo, useState } from "react";
import { Alert } from "@mantine/core";
import { authorizedFetch } from "./api";
import { keycloak } from "./keycloak";
import { EntityProfileWidget } from "./profile-widget";
import type { ProfileWidgetHostContext, SaveSuccessPayload } from "./profile-widget";
import { useShellToast } from "./shell/shell-toast-context";
import type { ShellUserContext } from "./types";

type WidgetProps = {
  context: ShellUserContext;
  /** С маршрута: id сущности. `null` — явный сценарий создания без demo-id из env. */
  routeEntityId?: string | null;
};

const LEGACY_DEMO_ENTITY_ID = "00000000-0000-0000-0000-000000000001";
const DEFAULT_PROFILE_LIST_IDS: string[] = [];
type ProfilesListItem = {
  entityId: string;
  entityTypeId: string;
  version: number;
  preview: string;
};

type ProfilesListAction =
  | { type: "created"; item: ProfilesListItem }
  | { type: "loaded"; count: number }
  | { type: "deleted"; entityId: string };

const DEFAULT_PROFILE_INSTANCE_IDS: string[] = [];
type ProfileInstanceItem = {
  entityId: string;
  entityTypeId: string;
  version: number;
  preview: string;
};

type ProfileInstancesAction =
  | { type: "created"; item: ProfileInstanceItem }
  | { type: "updated"; item: ProfileInstanceItem }
  | { type: "loaded"; count: number }
  | { type: "deleted"; entityId: string };

type InstanceHistoryVersion = {
  version: number;
  createdAt: string;
  actor: string;
  source: string;
  document: Record<string, unknown>;
};

type InstanceHistoryDiffRow = {
  path: string;
  beforeValue: string;
  afterValue: string;
};

const readProfileListIds = (): string[] => {
  const raw = import.meta.env.VITE_PROFILE_LIST_ENTITY_IDS?.trim();
  if (!raw) {
    return DEFAULT_PROFILE_LIST_IDS;
  }
  const parsed = raw
    .split(",")
    .map((value) => value.trim())
    .filter((value: string) => Boolean(value) && value !== LEGACY_DEMO_ENTITY_ID);
  return parsed.length > 0 ? parsed : DEFAULT_PROFILE_LIST_IDS;
};

const readProfileInstanceIds = (routeInstanceId?: string): string[] => {
  const raw = import.meta.env.VITE_PROFILE_INSTANCE_IDS?.trim();
  const parsed = raw
    ? raw
        .split(",")
        .map((value: string) => value.trim())
        .filter((value: string) => Boolean(value) && value !== LEGACY_DEMO_ENTITY_ID)
    : [];
  const routeIdRaw = routeInstanceId?.trim();
  const routeId = routeIdRaw && routeIdRaw !== LEGACY_DEMO_ENTITY_ID ? routeIdRaw : undefined;
  if (routeId) {
    return parsed.includes(routeId) ? parsed : [routeId, ...parsed];
  }
  return parsed.length > 0 ? parsed : DEFAULT_PROFILE_INSTANCE_IDS;
};

const safeStringify = (value: unknown): string => {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const prettyJson = (value: unknown): string => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "{}";
  }
};

const flattenDocument = (input: unknown, prefix = ""): Map<string, string> => {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    const terminalPath = prefix === "" ? "$" : prefix;
    return new Map([[terminalPath, safeStringify(input)]]);
  }

  const objectValue = input as Record<string, unknown>;
  const keys = Object.keys(objectValue).sort();
  if (keys.length === 0) {
    const emptyPath = prefix === "" ? "$" : prefix;
    return new Map([[emptyPath, "{}"]]);
  }

  const output = new Map<string, string>();
  keys.forEach((key) => {
    const childPath = prefix ? `${prefix}.${key}` : key;
    const childMap = flattenDocument(objectValue[key], childPath);
    childMap.forEach((value, path) => output.set(path, value));
  });
  return output;
};

const buildDiff = (beforeDoc: unknown, afterDoc: unknown): InstanceHistoryDiffRow[] => {
  const before = flattenDocument(beforeDoc);
  const after = flattenDocument(afterDoc);
  const allPaths = [...new Set([...before.keys(), ...after.keys()])].sort();
  return allPaths
    .filter((path) => before.get(path) !== after.get(path))
    .map((path) => ({
      path,
      beforeValue: before.get(path) ?? "undefined",
      afterValue: after.get(path) ?? "undefined",
    }));
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
  const toast = useShellToast();
  const [lastAction, setLastAction] = useState<ProfilesListAction | null>(null);
  const [lastError, setLastError] = useState("");
  const [items, setItems] = useState<ProfilesListItem[]>([]);
  const [entityTypeId, setEntityTypeId] = useState(import.meta.env.VITE_PROFILE_DEFAULT_ENTITY_TYPE_ID?.trim() || "");
  const [actionLoading, setActionLoading] = useState(false);
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
  const fetchWithTelemetry = (input: string, init: RequestInit = {}) =>
    authorizedFetch(input, init, {
      moduleName: "ProfilesListHostWidget",
      widget: "profiles-list",
      tenant: context.orgScope,
      correlationId: context.correlationId,
    });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (entityIds.length === 0) {
        setItems([]);
        setLastAction({ type: "loaded", count: 0 });
        return;
      }
      try {
        const loaded = await Promise.all(
          entityIds.map(async (entityId) => {
            const response = await fetchWithTelemetry(`/api/v1/admin/profile/api/v1/entities/${entityId}`, {
              headers: {
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
    setActionLoading(true);
    setLastError("");
    try {
      const response = await fetchWithTelemetry("/api/v1/admin/profile/api/v1/entities", {
        method: "POST",
        headers: {
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
      setActionLoading(false);
    }
  };

  const handleDeleteFirstProfile = async (): Promise<void> => {
    const target = items[0];
    if (!target) {
      const message = "Нет профиля для удаления";
      setLastError(message);
      toast.showError(message);
      return;
    }
    setActionLoading(true);
    setLastError("");
    try {
      const response = await fetchWithTelemetry(`/api/v1/admin/profile/api/v1/entities/${encodeURIComponent(target.entityId)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`delete failed: ${response.status}`);
      }
      setItems((prev) => prev.filter((item) => item.entityId !== target.entityId));
      setLastAction({ type: "deleted", entityId: target.entityId });
      toast.showSuccess("Profiles list action: deleted");
    } catch (error) {
      const message = error instanceof Error ? error.message : "profiles list delete failed";
      setLastError(message);
      toast.showError(message);
    } finally {
      setActionLoading(false);
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
        <button type="button" onClick={() => void handleCreate()} disabled={actionLoading}>
          Create profile
        </button>
        <button type="button" onClick={() => void handleDeleteFirstProfile()} disabled={actionLoading}>
          Delete first profile
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

export function ProfileInstancesHostWidget({ context, routeEntityId }: WidgetProps): JSX.Element {
  const toast = useShellToast();
  const [lastAction, setLastAction] = useState<ProfileInstancesAction | null>(null);
  const [lastError, setLastError] = useState("");
  const [items, setItems] = useState<ProfileInstanceItem[]>([]);
  const [entityTypeId, setEntityTypeId] = useState(import.meta.env.VITE_PROFILE_DEFAULT_ENTITY_TYPE_ID?.trim() || "");
  const [actionLoading, setActionLoading] = useState(false);
  const profileId = useMemo(() => {
    const configured = import.meta.env.VITE_PROFILE_DEMO_ENTITY_ID?.trim() || "";
    return configured === LEGACY_DEMO_ENTITY_ID ? "" : configured;
  }, []);
  const instanceIds = useMemo(() => readProfileInstanceIds(routeEntityId ?? undefined), [routeEntityId]);
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
  const fetchWithTelemetry = (input: string, init: RequestInit = {}) =>
    authorizedFetch(input, init, {
      moduleName: "ProfileInstancesHostWidget",
      widget: "profile-instances",
      tenant: context.orgScope,
      correlationId: context.correlationId,
    });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (instanceIds.length === 0) {
        setItems([]);
        setLastAction({ type: "loaded", count: 0 });
        return;
      }
      try {
        const loaded = await Promise.all(
          instanceIds.map(async (entityId) => {
            const response = await fetchWithTelemetry(`/api/v1/admin/profile/api/v1/entities/${entityId}`, {
              headers: {
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
            } satisfies ProfileInstanceItem;
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
        const message = error instanceof Error ? error.message : "instances load failed";
        setLastError(message);
        toast.showError(message);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [instanceIds, toast]);

  const handleCreate = async (): Promise<void> => {
    if (!entityTypeId.trim()) {
      const message = "Entity type ID is required";
      setLastError(message);
      toast.showError(message);
      return;
    }
    setActionLoading(true);
    setLastError("");
    try {
      const response = await fetchWithTelemetry("/api/v1/admin/profile/api/v1/entities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entity_type_id: entityTypeId.trim(),
          document: {
            tenant_id: hostContext.tenant.id,
            profile_id: profileId,
            source: "hub-shell-instances",
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
      const createdItem: ProfileInstanceItem = {
        entityId: snapshot.entity_id,
        entityTypeId: snapshot.entity_type_id ?? entityTypeId.trim(),
        version: snapshot.version,
        preview: JSON.stringify(snapshot.document ?? {}),
      };
      setItems((prev) => [createdItem, ...prev]);
      setLastAction({ type: "created", item: createdItem });
      toast.showSuccess("Instances action: created");
    } catch (error) {
      const message = error instanceof Error ? error.message : "instances create failed";
      setLastError(message);
      toast.showError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteFirstInstance = async (): Promise<void> => {
    const target = items[0];
    if (!target) {
      const message = "Нет экземпляра для удаления";
      setLastError(message);
      toast.showError(message);
      return;
    }
    setActionLoading(true);
    setLastError("");
    try {
      const response = await fetchWithTelemetry(`/api/v1/admin/profile/api/v1/entities/${encodeURIComponent(target.entityId)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`delete failed: ${response.status}`);
      }
      setItems((prev) => prev.filter((item) => item.entityId !== target.entityId));
      setLastAction({ type: "deleted", entityId: target.entityId });
      toast.showSuccess("Instances action: deleted");
    } catch (error) {
      const message = error instanceof Error ? error.message : "instances delete failed";
      setLastError(message);
      toast.showError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateFirst = async (): Promise<void> => {
    const fallback = items[0];
    const targetEntityId = routeEntityId?.trim() || fallback?.entityId;
    if (!targetEntityId) {
      const message = "Нет экземпляра для обновления";
      setLastError(message);
      toast.showError(message);
      return;
    }
    setActionLoading(true);
    setLastError("");
    try {
      const response = await fetchWithTelemetry(`/api/v1/admin/profile/api/v1/entities/${targetEntityId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document: {
            tenant_id: hostContext.tenant.id,
            profile_id: profileId,
            source: "hub-shell-instances-update",
            updated_at: new Date().toISOString(),
          },
        }),
      });
      if (!response.ok) {
        throw new Error(`update failed: ${response.status}`);
      }
      const snapshot = (await response.json()) as {
        entity_id: string;
        entity_type_id?: string;
        version: number;
        document?: Record<string, unknown>;
      };
      const updatedItem: ProfileInstanceItem = {
        entityId: snapshot.entity_id,
        entityTypeId: snapshot.entity_type_id ?? fallback?.entityTypeId ?? entityTypeId.trim() ?? "unknown",
        version: snapshot.version,
        preview: JSON.stringify(snapshot.document ?? {}),
      };
      setItems((prev) => [updatedItem, ...prev.filter((item) => item.entityId !== updatedItem.entityId)]);
      setLastAction({ type: "updated", item: updatedItem });
      toast.showSuccess("Instances action: updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "instances update failed";
      setLastError(message);
      toast.showError(message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <article className="widget-card" data-testid="profile-instances-widget-card">
        <h3>Profile instances widget</h3>
        <p>Tenant: {hostContext.tenant.id}</p>
        <p>Profile ID: {profileId}</p>
        <label htmlFor="profile-instances-entity-type-id">Entity type ID</label>
        <input
          id="profile-instances-entity-type-id"
          aria-label="Entity type ID"
          value={entityTypeId}
          onChange={(event) => setEntityTypeId(event.currentTarget.value)}
        />
        <button type="button" onClick={() => void handleCreate()} disabled={actionLoading}>
          Create instance
        </button>
        <button type="button" onClick={() => void handleUpdateFirst()} disabled={actionLoading}>
          Update first instance
        </button>
        <button type="button" onClick={() => void handleDeleteFirstInstance()} disabled={actionLoading}>
          Delete first instance
        </button>
        <ul>
          {items.map((item) => (
            <li key={item.entityId}>
              {item.entityId} (v{item.version})
            </li>
          ))}
        </ul>
      </article>
      {lastAction ? <p data-testid="profile-instances-last-action">Последнее действие: {lastAction.type}</p> : null}
      {lastError ? (
        <Alert color="red" data-testid="profile-instances-last-error">
          Ошибка списка экземпляров: {lastError}
        </Alert>
      ) : null}
    </div>
  );
}

/** BFF-префикс до OpenAPI AprilProfile (см. `docs/WIDGET_CONTRACTS.md`, задача 032). */
const PROFILE_BFF_OPENAPI_PREFIX = "/api/v1/admin/profile/api";

type ProfileFieldConflictRow = {
  id: string;
  entity_id: string;
  status: string;
  namespace: string;
  field_key: string;
  reason: string;
  created_at: string;
  existing_value?: unknown;
  incoming_value?: unknown;
};

type ProfileConflictListPayload = {
  items: ProfileFieldConflictRow[];
};

export function ConflictsMergeHostWidget({ context }: WidgetProps): JSX.Element {
  const toast = useShellToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ProfileFieldConflictRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string>("");
  const [lastError, setLastError] = useState("");
  const [resolveLoading, setResolveLoading] = useState(false);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeSource, setMergeSource] = useState(
    () => import.meta.env.VITE_PROFILE_MERGE_SOURCE_ENTITY_ID?.trim() || "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  );
  const [mergeTarget, setMergeTarget] = useState(
    () =>
      import.meta.env.VITE_PROFILE_MERGE_TARGET_ENTITY_ID?.trim() ||
      "00000000-0000-0000-0000-000000000001",
  );
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
  const fetchWithTelemetry = (input: string, init: RequestInit = {}) =>
    authorizedFetch(input, init, {
      moduleName: "ConflictsMergeHostWidget",
      widget: "conflicts-merge",
      tenant: context.orgScope,
      correlationId: context.correlationId,
    });

  const conflictsUrl = `${PROFILE_BFF_OPENAPI_PREFIX}/v1/admin/profile-conflicts`;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLastError("");
      try {
        const response = await fetchWithTelemetry(conflictsUrl, {
          headers: {
            Accept: "application/json",
          },
        });
        if (!response.ok) {
          throw new Error(`Загрузка очереди: ${response.status}`);
        }
        const payload = (await response.json()) as ProfileConflictListPayload;
        if (cancelled) {
          return;
        }
        const list = Array.isArray(payload.items) ? payload.items : [];
        setItems(list);
        const firstOpen = list.find((row) => row.status === "open");
        setSelectedId(firstOpen?.id ?? list[0]?.id ?? null);
      } catch (error) {
        if (cancelled) {
          return;
        }
        const message = error instanceof Error ? error.message : "conflicts load failed";
        setLastError(message);
        toast.showError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const selected = items.find((row) => row.id === selectedId) ?? null;

  const handleResolve = async (): Promise<void> => {
    if (!selected || selected.status !== "open") {
      const message = "Выберите открытый конфликт для разрешения";
      setLastError(message);
      toast.showError(message);
      return;
    }
    const resolution = selected.existing_value ?? selected.incoming_value ?? null;
    setResolveLoading(true);
    setLastError("");
    try {
      const response = await fetchWithTelemetry(
        `${PROFILE_BFF_OPENAPI_PREFIX}/v1/admin/profile-conflicts/${encodeURIComponent(selected.id)}/resolve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resolution,
            notes: `hub-shell-resolve:${hostContext.telemetry?.requestId ?? context.correlationId}`,
          }),
        },
      );
      if (!response.ok) {
        throw new Error(`Разрешение конфликта: ${response.status}`);
      }
      const snapshot = (await response.json()) as { entity_id?: string; version?: number };
      setLastAction(`resolve:${snapshot.entity_id ?? selected.entity_id}:v${String(snapshot.version ?? "?")}`);
      toast.showSuccess("Конфликт разрешён");
      setItems((prev) => prev.filter((row) => row.id !== selected.id));
      setSelectedId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "resolve failed";
      setLastError(message);
      toast.showError(message);
    } finally {
      setResolveLoading(false);
    }
  };

  const handleMerge = async (): Promise<void> => {
    if (!mergeSource.trim() || !mergeTarget.trim()) {
      const message = "Укажите UUID исходной и целевой сущности";
      setLastError(message);
      toast.showError(message);
      return;
    }
    setMergeLoading(true);
    setLastError("");
    try {
      const response = await fetchWithTelemetry(`${PROFILE_BFF_OPENAPI_PREFIX}/v1/admin/entities/merge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_entity_id: mergeSource.trim(),
          target_entity_id: mergeTarget.trim(),
        }),
      });
      if (!response.ok) {
        throw new Error(`Merge: ${response.status}`);
      }
      const body = (await response.json()) as {
        target_entity_id?: string;
        target_version?: number;
        source_entity_id?: string;
      };
      setLastAction(
        `merge:source=${body.source_entity_id ?? mergeSource}:target=${body.target_entity_id ?? mergeTarget}:v${String(body.target_version ?? "?")}`,
      );
      toast.showSuccess("Merge выполнен");
    } catch (error) {
      const message = error instanceof Error ? error.message : "merge failed";
      setLastError(message);
      toast.showError(message);
    } finally {
      setMergeLoading(false);
    }
  };

  return (
    <div>
      <article className="widget-card" data-testid="conflicts-merge-host-card">
        <h3>Очередь конфликтов и merge дубликатов</h3>
        <p>Tenant: {hostContext.tenant.id}</p>
        <p>
          Запросы идут через Hub BFF (`{PROFILE_BFF_OPENAPI_PREFIX}/v1/admin/...`). На стороне AprilProfile дополнительно
          проверяется realm-роль из `KEYCLOAK_ADMIN_REALM_ROLE` (часто <code>april-profile-admin</code>) — см. отчёт
          задачи 032.
        </p>
        {loading ? <p data-testid="conflicts-merge-loading">Загрузка очереди…</p> : null}
        {!loading && items.length === 0 ? (
          <p data-testid="conflicts-merge-empty">Открытых конфликтов нет.</p>
        ) : null}
        {items.length > 0 ? (
          <table data-testid="conflicts-merge-table">
            <thead>
              <tr>
                <th>Выбор</th>
                <th>Сущность</th>
                <th>Поле</th>
                <th>Статус</th>
                <th>Причина</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input
                      type="radio"
                      name="conflict-row"
                      checked={selectedId === row.id}
                      onChange={() => setSelectedId(row.id)}
                      aria-label={`Конфликт ${row.id}`}
                    />
                  </td>
                  <td>{row.entity_id}</td>
                  <td>
                    {row.namespace}/{row.field_key}
                  </td>
                  <td>{row.status}</td>
                  <td>{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        <div style={{ marginTop: "1rem" }}>
          <button
            type="button"
            data-testid="conflicts-merge-resolve-btn"
            onClick={() => void handleResolve()}
            disabled={resolveLoading || !selected || selected.status !== "open"}
          >
            Разрешить выбранный конфликт
          </button>
        </div>
        <h4 style={{ marginTop: "1.5rem" }}>Merge дубликатов (source → target)</h4>
        <label htmlFor="conflicts-merge-source">Source entity_id</label>
        <input
          id="conflicts-merge-source"
          aria-label="Source entity_id"
          value={mergeSource}
          onChange={(e) => setMergeSource(e.currentTarget.value)}
        />
        <label htmlFor="conflicts-merge-target">Target entity_id</label>
        <input
          id="conflicts-merge-target"
          aria-label="Target entity_id"
          value={mergeTarget}
          onChange={(e) => setMergeTarget(e.currentTarget.value)}
        />
        <button type="button" data-testid="conflicts-merge-submit-btn" onClick={() => void handleMerge()} disabled={mergeLoading}>
          Выполнить merge
        </button>
        {lastAction ? <p data-testid="conflicts-merge-last-action">{lastAction}</p> : null}
        {lastError ? (
          <Alert color="red" data-testid="conflicts-merge-last-error">
            {lastError}
          </Alert>
        ) : null}
      </article>
    </div>
  );
}

export function InstanceHistoryHostWidget({ context, routeEntityId }: WidgetProps): JSX.Element {
  const toast = useShellToast();
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState<InstanceHistoryVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [compareMode, setCompareMode] = useState<"current" | "previous">("previous");
  const [lastError, setLastError] = useState("");
  const instanceId = useMemo(() => {
    const routeId = routeEntityId?.trim();
    if (routeId && routeId !== LEGACY_DEMO_ENTITY_ID) {
      return routeId;
    }
    const configured = import.meta.env.VITE_PROFILE_DEMO_ENTITY_ID?.trim() || "";
    if (configured && configured !== LEGACY_DEMO_ENTITY_ID) {
      return configured;
    }
    return "";
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
  const fetchWithTelemetry = (input: string, init: RequestInit = {}) =>
    authorizedFetch(input, init, {
      moduleName: "InstanceHistoryHostWidget",
      widget: "instance-history",
      tenant: context.orgScope,
      correlationId: context.correlationId,
    });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!instanceId) {
        setVersions([]);
        setSelectedVersion(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setLastError("");
      try {
        const currentResponse = await fetchWithTelemetry(`/api/v1/admin/profile/api/v1/entities/${instanceId}`, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!currentResponse.ok) {
          throw new Error(`history load failed: ${currentResponse.status}`);
        }
        const current = (await currentResponse.json()) as {
          version: number;
        };
        const requests = Array.from({ length: current.version }, (_, index) => {
          const version = index + 1;
          return fetchWithTelemetry(`/api/v1/admin/profile/api/v1/entities/${instanceId}/versions/${version}`, {
            headers: {
              "Content-Type": "application/json",
            },
          }).then(async (response) => {
            if (!response.ok) {
              throw new Error(`history version load failed: ${response.status}`);
            }
            const payload = (await response.json()) as {
              version: number;
              created_at: string;
              document?: Record<string, unknown>;
              external_refs?: Array<{ source_system?: string }>;
            };
            const meta =
              payload.document && typeof payload.document._meta === "object" && payload.document._meta !== null
                ? (payload.document._meta as Record<string, unknown>)
                : undefined;
            const actor = typeof meta?.updated_by === "string" ? meta.updated_by : "unknown";
            return {
              version: payload.version,
              createdAt: payload.created_at,
              actor,
              source: payload.external_refs?.[0]?.source_system ?? "api",
              document: payload.document ?? {},
            } satisfies InstanceHistoryVersion;
          });
        });
        const loaded = (await Promise.all(requests)).sort((a, b) => b.version - a.version);
        if (cancelled) {
          return;
        }
        setVersions(loaded);
        setSelectedVersion(loaded[0]?.version ?? null);
      } catch (error) {
        if (cancelled) {
          return;
        }
        const message = error instanceof Error ? error.message : "history load failed";
        setLastError(message);
        toast.showError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [instanceId, toast]);

  const selected = versions.find((item) => item.version === selectedVersion) ?? null;
  const current = versions[0] ?? null;
  const previous = selected ? versions.find((item) => item.version === selected.version - 1) ?? null : null;
  const compareTarget = compareMode === "current" ? current : previous;
  const diffRows = selected && compareTarget ? buildDiff(compareTarget.document, selected.document) : [];

  return (
    <div>
      <article className="widget-card" data-testid="instance-history-widget-card">
        <h3>История экземпляра</h3>
        <p>Entity ID: {instanceId}</p>
        <p>Tenant: {hostContext.tenant.id}</p>
        <p>Restore недоступен в текущем API-контракте. История доступна в режиме read-only.</p>
        {loading ? <p data-testid="instance-history-loading">Загрузка истории…</p> : null}
        {versions.length === 0 && !loading ? <p data-testid="instance-history-empty">Версии не найдены.</p> : null}
        {versions.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Версия</th>
                <th>Создано</th>
                <th>Actor</th>
                <th>Source</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {versions.map((item) => (
                <tr key={item.version}>
                  <td>v{item.version}</td>
                  <td>{item.createdAt}</td>
                  <td>{item.actor}</td>
                  <td>{item.source}</td>
                  <td>
                    <button type="button" onClick={() => setSelectedVersion(item.version)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        {selected ? (
          <div data-testid="instance-history-selected-version">
            <p>Выбрана версия: v{selected.version}</p>
            <label htmlFor="instance-history-compare-mode">Сравнение</label>
            <select
              id="instance-history-compare-mode"
              aria-label="Сравнение"
              value={compareMode}
              onChange={(event) => setCompareMode(event.currentTarget.value === "current" ? "current" : "previous")}
            >
              <option value="previous">С предыдущей версией</option>
              <option value="current">С текущей версией</option>
            </select>
            <pre data-testid="instance-history-snapshot">{prettyJson(selected.document)}</pre>
            {compareTarget ? (
              diffRows.length > 0 ? (
                <table data-testid="instance-history-diff-table">
                  <thead>
                    <tr>
                      <th>Path</th>
                      <th>Before</th>
                      <th>After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diffRows.map((row) => (
                      <tr key={row.path}>
                        <td>{row.path}</td>
                        <td>{row.beforeValue}</td>
                        <td>{row.afterValue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p data-testid="instance-history-diff-empty">Изменений относительно выбранного сравнения нет.</p>
              )
            ) : (
              <p data-testid="instance-history-diff-unavailable">
                Сравнение недоступно: для выбранной версии нет базы сравнения.
              </p>
            )}
          </div>
        ) : null}
      </article>
      {lastError ? (
        <Alert color="red" data-testid="instance-history-last-error">
          Ошибка истории экземпляра: {lastError}
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
