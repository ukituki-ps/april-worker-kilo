export type AuthConfig = {
  keycloakUrl: string;
  realm: string;
  clientId: string;
  apiBaseUrl: string;
};

export const authConfig: AuthConfig = {
  keycloakUrl: import.meta.env.VITE_KEYCLOAK_URL ?? "",
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? "april",
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "aprilhub-shell",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081",
};
