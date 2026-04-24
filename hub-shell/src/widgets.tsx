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

const DEFAULT_PROFILE_INSTANCE_IDS = ["demo-instance"];
type ProfileInstanceItem = {
  entityId: string;
  entityTypeId: string;
  version: number;
  preview: string;
};

type ProfileInstancesAction =
  | { type: "created"; item: ProfileInstanceItem }
  | { type: "updated"; item: ProfileInstanceItem }
  | { type: "loaded"; count: number };

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
    .filter(Boolean);
  return parsed.length > 0 ? parsed : DEFAULT_PROFILE_LIST_IDS;
};

const readProfileInstanceIds = (routeInstanceId?: string): string[] => {
  const raw = import.meta.env.VITE_PROFILE_INSTANCE_IDS?.trim();
  const parsed = raw
    ? raw
        .split(",")
        .map((value: string) => value.trim())
        .filter(Boolean)
    : [];
  const fallback = routeInstanceId?.trim() || DEFAULT_PROFILE_INSTANCE_IDS[0];
  if (parsed.length === 0) {
    return [fallback];
  }
  return parsed.includes(fallback) ? parsed : [fallback, ...parsed];
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

export function ProfileInstancesHostWidget({ context, routeEntityId }: WidgetProps): JSX.Element {
  const toast = useShellToast();
  const [lastAction, setLastAction] = useState<ProfileInstancesAction | null>(null);
  const [lastError, setLastError] = useState("");
  const [items, setItems] = useState<ProfileInstanceItem[]>([]);
  const [entityTypeId, setEntityTypeId] = useState(import.meta.env.VITE_PROFILE_DEFAULT_ENTITY_TYPE_ID?.trim() || "");
  const [createLoading, setCreateLoading] = useState(false);
  const profileId = useMemo(
    () => import.meta.env.VITE_PROFILE_DEMO_ENTITY_ID?.trim() || "00000000-0000-0000-0000-000000000001",
    [],
  );
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

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const loaded = await Promise.all(
          instanceIds.map(async (entityId) => {
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
      setCreateLoading(false);
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
    setCreateLoading(true);
    setLastError("");
    try {
      const response = await fetch(`/api/v1/admin/profile/api/v1/entities/${targetEntityId}`, {
        method: "PUT",
        headers: {
          ...(keycloak.token ? { Authorization: `Bearer ${keycloak.token}` } : {}),
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
      setCreateLoading(false);
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
        <button type="button" onClick={() => void handleCreate()} disabled={createLoading}>
          Create instance
        </button>
        <button type="button" onClick={() => void handleUpdateFirst()} disabled={createLoading}>
          Update first instance
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

export function InstanceHistoryHostWidget({ context, routeEntityId }: WidgetProps): JSX.Element {
  const toast = useShellToast();
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState<InstanceHistoryVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [compareMode, setCompareMode] = useState<"current" | "previous">("previous");
  const [lastError, setLastError] = useState("");
  const instanceId = routeEntityId?.trim() || "demo-instance";
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
      setLoading(true);
      setLastError("");
      try {
        const currentResponse = await fetch(`/api/v1/admin/profile/api/v1/entities/${instanceId}`, {
          headers: {
            ...(keycloak.token ? { Authorization: `Bearer ${keycloak.token}` } : {}),
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
          return fetch(`/api/v1/admin/profile/api/v1/entities/${instanceId}/versions/${version}`, {
            headers: {
              ...(keycloak.token ? { Authorization: `Bearer ${keycloak.token}` } : {}),
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
