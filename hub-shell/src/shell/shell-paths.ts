export const shellPaths = {
  home: "/app",
  profilesList: "/app/profile/entities",
  entityTypesList: "/app/profile/entity-types",
} as const;

export type ShellRouteMatch =
  | { kind: "redirect" }
  | { kind: "profiles-list" }
  | { kind: "entity-types-list" }
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
  if (p === shellPaths.home || p === shellPaths.profilesList) {
    return { kind: "profiles-list" };
  }
  if (p === shellPaths.entityTypesList) {
    return { kind: "entity-types-list" };
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

