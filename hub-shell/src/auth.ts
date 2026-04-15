export type AuthConfig = {
  keycloakUrl: string;
  realm: string;
  clientId: string;
  apiBaseUrl: string;
};

function resolveRuntimeUrl(value: string, fallback: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    return fallback;
  }
  if (normalized.startsWith("/")) {
    return `${window.location.origin}${normalized}`;
  }
  return normalized;
}

export const authConfig: AuthConfig = {
  keycloakUrl: resolveRuntimeUrl(import.meta.env.VITE_KEYCLOAK_URL ?? "/auth", `${window.location.origin}/auth`),
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? "april",
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "aprilhub-shell",
  apiBaseUrl: resolveRuntimeUrl(import.meta.env.VITE_API_BASE_URL ?? "/api", `${window.location.origin}/api`),
};
