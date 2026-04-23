/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KEYCLOAK_URL: string;
  readonly VITE_KEYCLOAK_REALM: string;
  readonly VITE_KEYCLOAK_CLIENT_ID: string;
  readonly VITE_API_BASE_URL: string;
  /** Опционально: `entity_type_id` для создания профиля через POST /v1/entities (виджет профиля). */
  readonly VITE_PROFILE_DEFAULT_ENTITY_TYPE_ID?: string;
  /** Опционально: заранее известный `entity_id` для демо/локальной отладки (если пусто — создаётся при первом сохранении). */
  readonly VITE_PROFILE_DEMO_ENTITY_ID?: string;
  /** Опционально: получатель заявки с лендинга (mailto). Если не задан — открывается mailto: без адреса. */
  readonly VITE_LANDING_INQUIRY_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
