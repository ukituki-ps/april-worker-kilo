import { useEffect, useState } from "react";
import { Alert } from "@mantine/core";
import { authorizedFetch } from "../api";

export type ExternalProfilesListItem = {
  entityId: string;
  entityTypeId: string;
  version: number;
  updatedAt?: string;
  preview: string;
};

export type ProfilesListAction =
  | { type: "created"; item: ExternalProfilesListItem }
  | { type: "updated"; item: ExternalProfilesListItem }
  | { type: "deleted"; entityId: string };

export type ProfileWidgetHostContext = {
  tenant: { id: string };
  auth?: {
    subject?: string;
    roles?: string[];
    tokenRef?: string;
  };
  locale?: string;
  telemetry?: {
    requestId: string;
    traceId?: string;
    spanId?: string;
  };
};

export type ProfilesWidgetProps = {
  hostContext: ProfileWidgetHostContext;
  apiBaseUrl: string;
  accessToken?: string;
  entityIds: string[];
  pageSize?: number;
  onAction?: (action: ProfilesListAction) => void;
  onError?: (payload: { message: string; requestId?: string }) => void;
};

export function ProfilesWidget({ hostContext, apiBaseUrl, entityIds, onError }: ProfilesWidgetProps): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState<ExternalProfilesListItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        if (entityIds.length === 0) {
          if (!cancelled) {
            setItems([]);
          }
          return;
        }
        const skippedNotFound: string[] = [];
        const loaded = await Promise.all<ExternalProfilesListItem | null>(
          entityIds.map(async (entityId) => {
            const response = await authorizedFetch(`${apiBaseUrl}/v1/entities/${entityId}`, {
              headers: { "Content-Type": "application/json" },
            });
            if (!response.ok) {
              if (response.status === 404) {
                skippedNotFound.push(entityId);
                return null;
              }
              throw new Error(`profile operation failed: ${response.status}`);
            }
            const snapshot = (await response.json()) as {
              entity_id: string;
              entity_type_id?: string;
              version: number;
              created_at?: string;
              document?: Record<string, unknown>;
            };
            const item: ExternalProfilesListItem = {
              entityId: snapshot.entity_id,
              entityTypeId: snapshot.entity_type_id ?? "unknown",
              version: snapshot.version,
              preview: JSON.stringify(snapshot.document ?? {}),
            };
            if (snapshot.created_at) {
              item.updatedAt = snapshot.created_at;
            }
            return item;
          }),
        );
        if (!cancelled) {
          setItems(loaded.filter((item): item is ExternalProfilesListItem => item !== null));
        }
        if (skippedNotFound.length > 0) {
          onError?.({
            message: `Некоторые профили не найдены (404): ${skippedNotFound.join(", ")}`,
            requestId: hostContext.telemetry?.requestId,
          });
        }
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "profile operation failed";
        if (!cancelled) {
          setError(message);
        }
        onError?.({ message, requestId: hostContext.telemetry?.requestId });
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, entityIds, hostContext.telemetry?.requestId, onError]);

  return (
    <article className="widget-card" data-testid="profiles-widget-card">
      <h3>Profiles list widget</h3>
      <p>Tenant: {hostContext.tenant.id}</p>
      {loading ? <p data-testid="profiles-widget-loading">Loading profiles...</p> : null}
      {error ? <Alert color="red">{error}</Alert> : null}
      <ul>
        {items.map((item) => (
          <li key={item.entityId}>{item.entityId}</li>
        ))}
      </ul>
    </article>
  );
}
