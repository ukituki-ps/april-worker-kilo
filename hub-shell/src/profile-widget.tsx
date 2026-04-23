import { useMemo, useState } from "react";
import { Alert, Button, Stack, Text } from "@mantine/core";

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

export type SaveSuccessPayload = {
  entityId: string;
  version: number;
};

type EntityProfileWidgetProps = {
  hostContext: ProfileWidgetHostContext;
  entityId: string;
  apiBaseUrl: string;
  accessToken?: string;
  onSaveSuccess?: (payload: SaveSuccessPayload) => void;
  onError?: (payload: { message: string; requestId?: string }) => void;
};

type Snapshot = {
  entity_id: string;
  version: number;
  document: Record<string, unknown>;
};

const prettyJson = (value: unknown): string => JSON.stringify(value ?? {}, null, 2);

export function EntityProfileWidget({
  hostContext,
  entityId,
  apiBaseUrl,
  accessToken,
  onSaveSuccess,
  onError,
}: EntityProfileWidgetProps): JSX.Element {
  const [version, setVersion] = useState<number>(1);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string>("");

  const document = useMemo<Snapshot["document"]>(
    () => ({
      tenant_id: hostContext.tenant.id,
      source: "hub-shell",
      updated_by: hostContext.auth?.subject ?? "unknown",
    }),
    [hostContext.auth?.subject, hostContext.tenant.id],
  );

  const handleSave = async () => {
    setSaveState("saving");
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/v1/entities/${entityId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...(hostContext.telemetry?.requestId ? { "X-Request-Id": hostContext.telemetry.requestId } : {}),
        },
        body: JSON.stringify({ document }),
      });
      if (!response.ok) {
        throw new Error(`profile save failed: ${response.status}`);
      }
      const payload = (await response.json()) as Snapshot;
      setVersion(payload.version);
      setSaveState("saved");
      onSaveSuccess?.({ entityId: payload.entity_id, version: payload.version });
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "profile save failed";
      setError(message);
      setSaveState("idle");
      onError?.({ message, requestId: hostContext.telemetry?.requestId });
    }
  };

  return (
    <article className="widget-card" data-testid="profile-widget-card">
      <Stack gap="sm">
        <h3 id="profile-widget">Профиль (виджет)</h3>
        <Text size="sm">Tenant: {hostContext.tenant.id}</Text>
        <Text size="sm">Entity: {entityId}</Text>
        <Text size="xs" c="dimmed">
          Payload: {prettyJson(document)}
        </Text>
        <Button onClick={() => void handleSave()} loading={saveState === "saving"}>
          Сохранить профиль
        </Button>
        {saveState === "saved" ? (
          <Text size="sm" c="green">
            Профиль сохранён. Версия: {version}
          </Text>
        ) : null}
        {error ? <Alert color="red">{error}</Alert> : null}
      </Stack>
    </article>
  );
}
