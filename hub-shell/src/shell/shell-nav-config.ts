export type ShellNavItem = {
  id: string;
  label: string;
  /** Полный href с `#` для hash-маршрутизации. */
  href: string;
  /** Для подсветки активного пункта: префикс path или точное совпадение. */
  activePrefix?: string;
  requiresRole?: string;
};

export function buildPrimaryShellNav(): ShellNavItem[] {
  return [];
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
