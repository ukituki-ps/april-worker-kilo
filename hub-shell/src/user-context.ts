import type { ShellUserContext, UserProfile } from "./types";

export function buildShellUserContext(user: UserProfile): ShellUserContext {
  return {
    user,
    roles: user.roles,
    orgScope: "default",
    correlationId: `shell-${user.sub}`,
  };
}
