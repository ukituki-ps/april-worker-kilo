import { shellPaths, defaultProfileEntityIdForNav } from "./shell-paths";

export type ShellNavItem = {
  id: string;
  label: string;
  /** Полный href с `#` для hash-маршрутизации. */
  href: string;
  /** Для подсветки активного пункта: префикс path или точное совпадение. */
  activePrefix?: string;
  requiresRole?: string;
};

const toHash = (path: string): string => `#${path}`;

export function buildPrimaryShellNav(): ShellNavItem[] {
  const entityId = defaultProfileEntityIdForNav();
  const profileCardPath = entityId ? shellPaths.profileEntity(entityId, "card") : shellPaths.profilesList;
  const profileInstancePath = entityId ? shellPaths.profileInstance(entityId) : shellPaths.profilesList;
  const profileHistoryPath = entityId ? shellPaths.profileInstanceHistory(entityId) : shellPaths.profilesList;
  return [
    { id: "overview", label: "Обзор платформы", href: toHash(shellPaths.overview), activePrefix: shellPaths.overview },
    { id: "roles", label: "Роли доступа", href: toHash(shellPaths.roles), activePrefix: shellPaths.roles },
    {
      id: "profile-list",
      label: "Профиль — список",
      href: toHash(shellPaths.profilesList),
      activePrefix: "/app/profile/entities",
    },
    {
      id: "profile-entity-card",
      label: "Профиль — карточка",
      href: toHash(profileCardPath),
      activePrefix: profileCardPath,
    },
    {
      id: "profile-instance-demo",
      label: "Профиль — экземпляры",
      href: toHash(profileInstancePath),
      activePrefix: profileInstancePath,
    },
    {
      id: "profile-instance-history-demo",
      label: "Профиль — история экземпляра",
      href: toHash(profileHistoryPath),
      activePrefix: profileHistoryPath,
    },
    {
      id: "profile-admin-conflicts",
      label: "Профиль — конфликты и merge",
      href: toHash(shellPaths.profileAdminConflicts),
      activePrefix: shellPaths.profileAdminConflicts,
      requiresRole: "admin",
    },
    {
      id: "admin-control",
      label: "Админ-контур",
      href: toHash(shellPaths.adminControl),
      activePrefix: shellPaths.adminControl,
      requiresRole: "admin",
    },
  ];
}

export function resolveActiveNavId(pathname: string, items: ShellNavItem[]): string | undefined {
  for (const item of items) {
    const prefix = item.activePrefix ?? item.href.replace(/^#/, "");
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return item.id;
    }
  }
  return undefined;
}

export function filterNavByRoles(items: ShellNavItem[], roles: string[]): ShellNavItem[] {
  return items.filter((item) => !item.requiresRole || roles.includes(item.requiresRole));
}
