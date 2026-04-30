import type { ComponentType } from "react";
import {
  EntityTypesWidget as ExternalEntityTypesWidget,
  ProfilesWidget as ExternalProfilesWidget,
} from "@april/profile-ui-external";

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
  widget: "profiles_list" | "entity_types";
  event: string;
  request_id?: string;
  correlation_id?: string;
  api_request_id?: string;
  meta?: Record<string, string | number | boolean | null | undefined>;
};

export type ProfileWidgetObservabilityHandler = (event: ProfileWidgetTelemetryEvent) => void;

export type ProfilesWidgetProps = {
  hostContext: ProfileWidgetHostContext;
  apiBaseUrl: string;
  accessToken?: string;
  onAction?: (action: ProfilesListAction) => void;
  onError?: (payload: { message: string; requestId?: string; code?: string }) => void;
  onOpenEntity?: (entityId: string) => void;
  onObservability?: ProfileWidgetObservabilityHandler;
};

export const ProfilesWidget = ExternalProfilesWidget as ComponentType<ProfilesWidgetProps>;

export type EntityTypesWidgetProps = {
  hostContext: ProfileWidgetHostContext;
  apiBaseUrl: string;
  accessToken?: string;
  onError?: (payload: { message: string; requestId?: string; code?: string }) => void;
  onObservability?: ProfileWidgetObservabilityHandler;
};

export const EntityTypesWidget = ExternalEntityTypesWidget as ComponentType<EntityTypesWidgetProps>;
