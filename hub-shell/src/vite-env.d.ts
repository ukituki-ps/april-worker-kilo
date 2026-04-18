/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KEYCLOAK_URL: string;
  readonly VITE_KEYCLOAK_REALM: string;
  readonly VITE_KEYCLOAK_CLIENT_ID: string;
  readonly VITE_API_BASE_URL: string;
  /** Опционально: получатель заявки с лендинга (mailto). Если не задан — открывается mailto: без адреса. */
  readonly VITE_LANDING_INQUIRY_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
