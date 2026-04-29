import { Alert, Button, Group, Loader, Stack, Text, Title } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";

export type ProfileWidgetHostContext = {
  tenant: { id: string };
  auth?: {
    subject?: string;
    roles?: string[];
    tokenRef?: string;
  };
  theme?: "light" | "dark" | "system";
  locale?: string;
  telemetry?: {
    requestId: string;
    correlationId?: string;
    traceId?: string;
    spanId?: string;
  };
};

export type ProfilesListAction =
  | { type: "created"; item: { entityId: string } }
  | { type: "updated"; item: { entityId: string } }
  | { type: "deleted"; entityId: string };

export type ProfileWidgetTelemetryEvent = {
  widget: "profiles_list";
  event: "view_loaded" | "list_requested" | "list_succeeded" | "list_failed";
  request_id?: string;
  correlation_id?: string;
  api_request_id?: string;
  meta?: Record<string, string | number | boolean | null | undefined>;
};

type ProfileListItem = {
  entity_id: string;
  preview?: string;
};

type ProfilesWidgetProps = {
  hostContext: ProfileWidgetHostContext;
  apiBaseUrl: string;
  accessToken?: string;
  onAction?: (action: ProfilesListAction) => void;
  onError?: (payload: { message: string; requestId?: string; code?: string }) => void;
  onOpenEntity?: (entityId: string) => void;
  onObservability?: (event: ProfileWidgetTelemetryEvent) => void;
};

export function ProfilesWidget({
  hostContext,
  apiBaseUrl,
  accessToken,
  onError,
  onOpenEntity,
  onObservability,
}: ProfilesWidgetProps): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ProfileListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | undefined>();
  const telemetryIds = useMemo(
    () => ({
      request_id: hostContext.telemetry?.requestId,
      correlation_id: hostContext.telemetry?.correlationId ?? hostContext.telemetry?.requestId,
    }),
    [hostContext.telemetry],
  );

  useEffect(() => {
    const controller = new AbortController();
    const load = async (): Promise<void> => {
      setLoading(true);
      onObservability?.({ widget: "profiles_list", event: "list_requested", ...telemetryIds });
      try {
        const response = await fetch(`${apiBaseUrl}/v1/entities`, {
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            ...(hostContext.telemetry?.requestId ? { "x-request-id": hostContext.telemetry.requestId } : {}),
            ...(hostContext.telemetry?.correlationId ? { "x-correlation-id": hostContext.telemetry.correlationId } : {}),
          },
        });
        if (!response.ok) {
          let body: unknown;
          try {
            body = await response.json();
          } catch {
            body = null;
          }
          const payload = (body ?? {}) as { message?: string; request_id?: string };
          const message = payload.message ?? `Request failed with status ${response.status}`;
          setError(message);
          setRequestId(payload.request_id);
          onError?.({ message, requestId: payload.request_id, code: String(response.status) });
          onObservability?.({
            widget: "profiles_list",
            event: "list_failed",
            ...telemetryIds,
            api_request_id: payload.request_id,
            meta: { status: response.status },
          });
          return;
        }
        const body = (await response.json()) as { items?: ProfileListItem[] };
        setItems(body.items ?? []);
        setError(null);
        setRequestId(undefined);
        onObservability?.({ widget: "profiles_list", event: "list_succeeded", ...telemetryIds, meta: { count: (body.items ?? []).length } });
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        const message = err instanceof Error ? err.message : "Не удалось загрузить список профилей.";
        setError(message);
        onError?.({ message, code: "network" });
        onObservability?.({ widget: "profiles_list", event: "list_failed", ...telemetryIds, meta: { error: "network" } });
      } finally {
        setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [accessToken, apiBaseUrl, hostContext.telemetry, onError, onObservability, telemetryIds]);

  return (
    <section>
      <Group justify="space-between" mb="sm">
        <Title order={3}>Profiles list widget</Title>
        <Text size="sm" c="dimmed">
          tenant: {hostContext.tenant.id}
        </Text>
      </Group>
      {loading ? <Loader size="sm" /> : null}
      {error ? (
        <Alert color="red" data-testid="profiles-list-last-error">
          {error}
          {requestId ? ` (request_id: ${requestId})` : ""}
        </Alert>
      ) : null}
      <Stack mt="sm">
        {items.map((item) => (
          <Button key={item.entity_id} variant="light" onClick={() => onOpenEntity?.(item.entity_id)}>
            {item.preview || item.entity_id}
          </Button>
        ))}
      </Stack>
    </section>
  );
}
