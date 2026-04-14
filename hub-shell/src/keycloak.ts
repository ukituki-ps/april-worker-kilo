import Keycloak from "keycloak-js";
import { authConfig } from "./auth";

export const keycloak = new Keycloak({
  url: authConfig.keycloakUrl,
  realm: authConfig.realm,
  clientId: authConfig.clientId,
});

export async function initializeAuth(): Promise<boolean> {
  return keycloak.init({
    onLoad: "check-sso",
    pkceMethod: "S256",
    checkLoginIframe: false,
  });
}
