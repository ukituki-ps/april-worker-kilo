import Keycloak from "keycloak-js";
import { authConfig } from "./auth";
import { notifyKeycloakTokenRotated } from "./keycloak-token-subscribers";

export const keycloak = new Keycloak({
  url: authConfig.keycloakUrl,
  realm: authConfig.realm,
  clientId: authConfig.clientId,
});

export async function initializeAuth(): Promise<boolean> {
  keycloak.onAuthRefreshSuccess = () => {
    notifyKeycloakTokenRotated();
  };

  keycloak.onTokenExpired = () => {
    void keycloak.updateToken(70).catch(() => {
      void keycloak.login();
    });
  };

  return keycloak.init({
    onLoad: "check-sso",
    pkceMethod: "S256",
    checkLoginIframe: false,
  });
}
