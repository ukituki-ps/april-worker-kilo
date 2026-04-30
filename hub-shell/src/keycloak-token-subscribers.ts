/** Синхронизация React-дерева с ротацией access token в keycloak-js (без собственного ререндера Keycloak). */
const listeners = new Set<() => void>();

export function subscribeKeycloakTokenRotation(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyKeycloakTokenRotated(): void {
  for (const listener of listeners) {
    listener();
  }
}
