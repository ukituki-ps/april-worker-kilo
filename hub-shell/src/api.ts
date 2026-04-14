import { authConfig } from "./auth";
import { keycloak } from "./keycloak";

export async function apiRequest(path: string, init: RequestInit = {}, canRetry = true): Promise<Response> {
  if (!keycloak.authenticated || !keycloak.token) {
    await keycloak.login();
    throw new Error("Unauthenticated session");
  }

  const response = await fetch(`${authConfig.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${keycloak.token}`,
    },
  });

  if (response.status === 401 && canRetry) {
    const refreshed = await keycloak.updateToken(30).catch(() => false);
    if (!refreshed || !keycloak.token) {
      await keycloak.login();
      throw new Error("Token refresh failed");
    }
    return apiRequest(path, init, false);
  }

  return response;
}
