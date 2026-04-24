/**
 * Информационная архитектура авторизованной зоны AprilHub (домен «Профиль» и платформа).
 * Канонические пути — без query; параметры сущностей — в сегменте пути.
 *
 * Политика: список сущностей и вкладки одной сущности разведены по отдельным маршрутам;
 * другая сущность или
 * экземпляр профиля — отдельный
 * префикс `/app/profile/instances/:instanceId`.
 */

export const shellPaths = {
  overview: "/app/overview",
  roles: "/app/roles",
  adminControl: "/app/admin-control",
  profilesList: "/app/profile/entities",
  profileEntity: (entityId: string, tab: ProfileEntityTab = "card") =>
    `/app/profile/entities/${encodeURIComponent(entityId)}/${tab}`,
  profileInstance: (instanceId: string) => `/app/profile/instances/${encodeURIComponent(instanceId)}`,
  profileInstanceHistory: (instanceId: string) => `/app/profile/instances/${encodeURIComponent(instanceId)}/history`,
} as const;

export type ProfileEntityTab = "card" | "meta";

export type ShellRouteMatch =
  | { kind: "redirect" }
  | { kind: "overview" }
  | { kind: "roles" }
  | { kind: "admin" }
  | { kind: "profile-list" }
  | { kind: "profile-instance"; instanceId: string }
  | { kind: "profile-instance-history"; instanceId: string }
  | { kind: "profile-entity"; entityId: string; tab: ProfileEntityTab }
  | { kind: "not-found" };

/** Текущий путь из location.hash (без #), всегда начинается с /. */
export function getPathnameFromHash(): string {
  const raw = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  const trimmed = raw.trim() || "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function matchShellRoute(pathname: string): ShellRouteMatch {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (p === "/" || p === "") {
    return { kind: "redirect" };
  }
  if (p === "/app/overview") {
    return { kind: "overview" };
  }
  if (p === "/app/roles") {
    return { kind: "roles" };
  }
  if (p === "/app/admin-control") {
    return { kind: "admin" };
  }
  if (p === "/app/profile/entities") {
    return { kind: "profile-list" };
  }

  const instanceHistoryMatch = /^\/app\/profile\/instances\/([^/]+)\/history\/?$/.exec(p);
  if (instanceHistoryMatch) {
    return { kind: "profile-instance-history", instanceId: decodeURIComponent(instanceHistoryMatch[1]) };
  }

  const instanceMatch = /^\/app\/profile\/instances\/([^/]+)\/?$/.exec(p);
  if (instanceMatch) {
    return { kind: "profile-instance", instanceId: decodeURIComponent(instanceMatch[1]) };
  }

  const entityMatch = /^\/app\/profile\/entities\/([^/]+)\/?(?:([^/]+)\/?)?$/.exec(p);
  if (entityMatch) {
    const entityId = decodeURIComponent(entityMatch[1]);
    const tabSeg = entityMatch[2];
    const tab: ProfileEntityTab = tabSeg === "meta" ? "meta" : "card";
    return { kind: "profile-entity", entityId, tab };
  }

  return { kind: "not-found" };
}

export function shellNavigate(path: string): void {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const nextHash = `#${normalized}`;
  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash;
  }
}

export function subscribeShellPath(listener: () => void): () => void {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
}

/** Дефолтный entityId для пункта меню «Карточка» и smoke (совместимо с e2e-стабом). */
export function defaultProfileEntityIdForNav(): string {
  const fromEnv = import.meta.env.VITE_PROFILE_DEMO_ENTITY_ID?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  return "00000000-0000-0000-0000-000000000001";
}
