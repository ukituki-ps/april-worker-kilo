import { useCallback, useSyncExternalStore } from "react";
import { getPathnameFromHash, shellNavigate, subscribeShellPath } from "./shell-paths";

export function useShellPathname(): string {
  return useSyncExternalStore(subscribeShellPath, getPathnameFromHash, getPathnameFromHash);
}

export function useShellNavigate(): (path: string) => void {
  return useCallback((path: string) => {
    shellNavigate(path);
  }, []);
}
