import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { ProfileWidgetHostContext } from "../profile-widget";
import type { ShellUserContext } from "../types";
import { matchShellRoute, shellPaths, type ShellRouteMatch } from "./shell-paths";
import { useShellNavigate, useShellPathname } from "./use-shell-pathname";

/** Расширение контракта host → виджет (см. docs/WIDGET_CONTRACTS.md): навигация и маршрут. */
export type HubHostNavigationApi = {
  /** Возврат к базовому экрану авторизованного shell. */
  goToProfilesList: () => void;
  goBack: () => void;
};

export type HubHostRouteSlice = {
  pathname: string;
  match: ShellRouteMatch;
};

export type HubHostContextValue = ProfileWidgetHostContext & {
  navigation: HubHostNavigationApi;
  route: HubHostRouteSlice;
  theme: "light" | "dark" | "system";
};

const HubHostContext = createContext<HubHostContextValue | null>(null);

type ProviderProps = {
  context: ShellUserContext;
  children: ReactNode;
};

export function HubHostContextProvider({ context, children }: ProviderProps): JSX.Element {
  const pathname = useShellPathname();
  const navigate = useShellNavigate();
  const match = useMemo(() => matchShellRoute(pathname), [pathname]);

  const routeSlice = useMemo<HubHostRouteSlice>(() => {
    return { pathname, match };
  }, [match, pathname]);

  const hostContext = useMemo<ProfileWidgetHostContext>(
    () => ({
      tenant: { id: context.orgScope },
      auth: {
        subject: context.user.sub,
        roles: context.roles,
        tokenRef: "keycloak",
      },
      locale: "ru-RU",
      telemetry: {
        requestId: context.correlationId,
      },
    }),
    [context],
  );

  const navigation = useMemo<HubHostNavigationApi>(
    () => ({
      goToProfilesList: () => {
        navigate(shellPaths.home);
      },
      goBack: () => {
        window.history.back();
      },
    }),
    [navigate],
  );

  const value = useMemo<HubHostContextValue>(
    () => ({
      ...hostContext,
      navigation,
      route: routeSlice,
      theme: "system",
    }),
    [hostContext, navigation, routeSlice],
  );

  return <HubHostContext.Provider value={value}>{children}</HubHostContext.Provider>;
}

export function useHubHostContext(): HubHostContextValue {
  const ctx = useContext(HubHostContext);
  if (!ctx) {
    throw new Error("useHubHostContext должен вызываться внутри HubHostContextProvider");
  }
  return ctx;
}
