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
  profilesList: "/app/profile/entities",
} as const;

export type ShellRouteMatch =
  | { kind: "redirect" }
  | { kind: "profile-list" }
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
  if (p === "/app/profile/entities") {
    return { kind: "profile-list" };
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

