import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { ProfileWidgetHostContext } from "../profile-widget";
import type { ShellUserContext } from "../types";
import { matchShellRoute, shellPaths, type ProfileEntityTab, type ShellRouteMatch } from "./shell-paths";
import { useShellNavigate, useShellPathname } from "./use-shell-pathname";

/** Расширение контракта host → виджет (см. docs/WIDGET_CONTRACTS.md): навигация и маршрут. */
export type HubHostNavigationApi = {
  /** Семантический переход без прямого изменения URL виджетом. */
  goToProfileEntityCard: (entityId: string) => void;
  goToProfileEntityMeta: (entityId: string) => void;
  goToOverview: () => void;
  goBack: () => void;
};

export type HubHostRouteSlice = {
  pathname: string;
  match: ShellRouteMatch;
  profileEntityId?: string;
  profileInstanceId?: string;
  profileEntityTab?: ProfileEntityTab;
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
    if (match.kind === "profile-entity") {
      return {
        pathname,
        match,
        profileEntityId: match.entityId,
        profileEntityTab: match.tab,
      };
    }
    if (match.kind === "profile-instance") {
      return { pathname, match, profileInstanceId: match.instanceId };
    }
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
      goToProfileEntityCard: (entityId: string) => {
        navigate(shellPaths.profileEntity(entityId, "card"));
      },
      goToProfileEntityMeta: (entityId: string) => {
        navigate(shellPaths.profileEntity(entityId, "meta"));
      },
      goToOverview: () => {
        navigate(shellPaths.overview);
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
