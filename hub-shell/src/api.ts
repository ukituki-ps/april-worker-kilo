import { authConfig } from "./auth";
import { keycloak } from "./keycloak";
import { captureHttpError } from "./sentry";

export type ApiTelemetryContext = {
  moduleName?: string;
  widget?: string;
  tenant?: string;
  route?: string;
  requestId?: string;
  correlationId?: string;
};

type AuthorizedFetchOptions = ApiTelemetryContext & {
  canRetry?: boolean;
};

function shouldCaptureHttpStatus(status: number): boolean {
  return status === 400 || status === 404 || status === 503 || status >= 500;
}

function normalizePath(input: string): string {
  try {
    return new URL(input, window.location.origin).pathname;
  } catch {
    return input;
  }
}

function mergeHeaders(initHeaders: RequestInit["headers"], telemetry?: ApiTelemetryContext): Headers {
  const headers = new Headers(initHeaders ?? {});
  headers.set("Authorization", `Bearer ${keycloak.token}`);
  if (telemetry?.requestId) {
    headers.set("X-Request-Id", telemetry.requestId);
  }
  if (telemetry?.correlationId) {
    headers.set("X-Correlation-Id", telemetry.correlationId);
  }
  return headers;
}

export async function apiRequest(path: string, init: RequestInit = {}, canRetry = true): Promise<Response> {
  return authorizedFetch(`${authConfig.apiBaseUrl}${path}`, init, {
    canRetry,
    moduleName: "hub-shell",
    route: path,
  });
}

export async function authorizedFetch(
  input: string,
  init: RequestInit = {},
  options: AuthorizedFetchOptions = {},
): Promise<Response> {
  if (!keycloak.authenticated || !keycloak.token) {
    await keycloak.login();
    throw new Error("Unauthenticated session");
  }

  const response = await fetch(input, {
    ...init,
    headers: mergeHeaders(init.headers, options),
  });

  if (response.status === 401 && (options.canRetry ?? true)) {
    const refreshed = await keycloak.updateToken(30).catch(() => false);
    if (!refreshed || !keycloak.token) {
      await keycloak.login();
      throw new Error("Token refresh failed");
    }
    return authorizedFetch(input, init, { ...options, canRetry: false });
  }

  if (shouldCaptureHttpStatus(response.status)) {
    captureHttpError({
      method: init.method ?? "GET",
      path: normalizePath(input),
      status: response.status,
      moduleName: options.moduleName ?? "hub-shell",
      widget: options.widget,
      tenant: options.tenant,
      route: options.route,
      requestId: response.headers.get("x-request-id") ?? options.requestId,
      correlationId: response.headers.get("x-correlation-id") ?? options.correlationId,
    });
  }

  return response;
}
