import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Stack, Text } from "@mantine/core";
import { authorizedFetch } from "./api";

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
  /** Опционально: если задано, первый save попытается обновить существующую сущность. */
  initialEntityId?: string;
  /** Обязательно для сценария auto-create при отсутствии сущности. */
  entityTypeId: string;
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

type ApiErrorPayload = {
  code?: string;
  message?: string;
};

const prettyJson = (value: unknown): string => JSON.stringify(value ?? {}, null, 2);

const toUserErrorMessage = (status: number, payload: ApiErrorPayload): string => {
  if (status === 404 && payload.code === "entity_not_found") {
    return "Сущность профиля не найдена. Попробуем создать профиль через POST /v1/entities и повторить сохранение.";
  }
  if (status === 404 && payload.code === "entity_type_not_found") {
    return "Тип сущности не найден. Проверьте VITE_PROFILE_DEFAULT_ENTITY_TYPE_ID и наличие опубликованного типа в AprilProfile.";
  }
  if (status === 409 && payload.code === "entity_type_not_published") {
    return "Тип сущности не опубликован. Опубликуйте тип в AprilProfile перед созданием профиля.";
  }
  if (status === 409 && payload.code === "authority_all_blocked") {
    return "Сохранение отклонено политикой authority для всех переданных полей.";
  }
  if (payload.message) {
    return payload.message;
  }
  return `profile save failed: ${status}`;
};

const readErrorPayload = async (response: Response): Promise<ApiErrorPayload> => {
  try {
    return (await response.json()) as ApiErrorPayload;
  } catch {
    return {};
  }
};

export function EntityProfileWidget({
  hostContext,
  initialEntityId,
  entityTypeId,
  apiBaseUrl,
  accessToken,
  onSaveSuccess,
  onError,
}: EntityProfileWidgetProps): JSX.Element {
  const [version, setVersion] = useState<number>(1);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string>("");
  const [activeEntityId, setActiveEntityId] = useState<string | undefined>(initialEntityId);

  useEffect(() => {
    setActiveEntityId(initialEntityId);
  }, [initialEntityId]);

  const document = useMemo<Snapshot["document"]>(
    () => ({
      tenant_id: hostContext.tenant.id,
      source: "hub-shell",
      updated_by: hostContext.auth?.subject ?? "unknown",
    }),
    [hostContext.auth?.subject, hostContext.tenant.id],
  );

  const authHeaders = (): Record<string, string> => ({
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(hostContext.telemetry?.requestId ? { "X-Request-Id": hostContext.telemetry.requestId } : {}),
  });
  const fetchWithTelemetry = (input: string, init: RequestInit = {}) =>
    authorizedFetch(input, init, {
      moduleName: "EntityProfileWidget",
      widget: "profile-widget",
      tenant: hostContext.tenant.id,
      requestId: hostContext.telemetry?.requestId,
    });

  const createEntity = async (): Promise<string> => {
    const response = await fetchWithTelemetry(`${apiBaseUrl}/v1/entities`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        entity_type_id: entityTypeId,
        document,
      }),
    });
    if (!response.ok) {
      const payload = await readErrorPayload(response);
      throw new Error(toUserErrorMessage(response.status, payload));
    }
    const created = (await response.json()) as Snapshot;
    return created.entity_id;
  };

  const putEntity = async (
    targetEntityId: string,
  ): Promise<{ ok: true; snapshot: Snapshot } | { ok: false; status: number; payload: ApiErrorPayload }> => {
    const response = await fetchWithTelemetry(`${apiBaseUrl}/v1/entities/${targetEntityId}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ document }),
    });
    if (!response.ok) {
      const payload = await readErrorPayload(response);
      return { ok: false, status: response.status, payload };
    }
    return { ok: true, snapshot: (await response.json()) as Snapshot };
  };

  const handleSave = async () => {
    setSaveState("saving");
    setError("");
    try {
      if (!entityTypeId.trim()) {
        throw new Error("Не задан entity type id. Укажите VITE_PROFILE_DEFAULT_ENTITY_TYPE_ID.");
      }

      let entityIdForPut = activeEntityId;
      let putResult = activeEntityId
        ? await putEntity(activeEntityId)
        : ({ ok: false, status: 404, payload: { code: "entity_not_found" } } as const);

      if (!putResult.ok && putResult.status === 404 && putResult.payload.code === "entity_not_found") {
        const createdId = await createEntity();
        setActiveEntityId(createdId);
        entityIdForPut = createdId;
        putResult = await putEntity(createdId);
      }

      if (!putResult.ok) {
        throw new Error(toUserErrorMessage(putResult.status, putResult.payload));
      }

      const snapshot = putResult.snapshot;
      if (snapshot.entity_id && snapshot.entity_id !== entityIdForPut) {
        setActiveEntityId(snapshot.entity_id);
      }
      setVersion(snapshot.version);
      setSaveState("saved");
      onSaveSuccess?.({ entityId: snapshot.entity_id, version: snapshot.version });
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
        <Text size="sm">Entity type: {entityTypeId}</Text>
        <Text size="sm">Entity: {activeEntityId ?? "— (будет создан при сохранении)"}</Text>
        <Text size="xs" c="dimmed">
          Payload: {prettyJson({ document })}
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
