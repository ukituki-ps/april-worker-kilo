import { useEffect, useMemo, useState } from "react";
import { Button } from "@mantine/core";
import { authConfig } from "./auth";
import { apiRequest } from "./api";
import { AppShell } from "./app-shell";
import { CompositionLayer } from "./composition-layer";
import { GuestB2BLanding } from "./landing/GuestB2BLanding";
import { keycloak } from "./keycloak";
import { SharedState } from "./shared-ux";
import type { ShellUserContext, UserProfile } from "./types";
import { buildShellUserContext } from "./user-context";
import "./app.css";

type AuthZone = "guest" | "transition" | "authorized" | "forbidden";

type AppProps = {
  authInitError?: string;
};

const shellNavigation = [
  { id: "overview", label: "Обзор платформы", href: "#overview" },
  { id: "roles", label: "Роли доступа", href: "#roles" },
  { id: "admin-control", label: "Админ-контур", href: "#admin-control" },
];

export default function App({ authInitError = "" }: AppProps) {
  const [me, setMe] = useState<UserProfile | null>(null);
  const [zone, setZone] = useState<AuthZone>(keycloak.authenticated ? "transition" : "guest");
  const [transitionReason, setTransitionReason] = useState<string>("Проверяем существующую сессию Keycloak...");
  const [error, setError] = useState<string>(authInitError);
  const [isLoginStarting, setIsLoginStarting] = useState<boolean>(false);

  const startLoginFlow = async (): Promise<void> => {
    setIsLoginStarting(true);
    setError("");
    try {
      await keycloak.login();
    } catch (loginError) {
      setIsLoginStarting(false);
      setError(loginError instanceof Error ? loginError.message : "Не удалось запустить поток входа через Keycloak.");
    }
  };

  useEffect(() => {
    if (!keycloak.authenticated) {
      setZone("guest");
      return;
    }

    const loadData = async (): Promise<void> => {
      setZone("transition");
      setTransitionReason("Возвращаемся от провайдера идентификации и инициализируем пользовательский контекст...");
      setError("");

      const meResponse = await apiRequest("/v1/me");
      if (!meResponse.ok) {
        if (meResponse.status === 403) {
          setZone("forbidden");
          return;
        }
        setError(`Не удалось загрузить профиль: ${meResponse.status}`);
        setZone("guest");
        return;
      }
      setMe((await meResponse.json()) as UserProfile);
      setZone("authorized");
    };

    void loadData().catch((loadError: unknown) => {
      setZone("guest");
      setError(loadError instanceof Error ? loadError.message : "Непредвиденная ошибка авторизации в runtime.");
    });
  }, []);

  const context: ShellUserContext | null = useMemo(() => (me ? buildShellUserContext(me) : null), [me]);

  if (zone === "guest") {
    return (
      <GuestB2BLanding
        onStartLogin={() => void startLoginFlow()}
        isLoginStarting={isLoginStarting}
        error={error}
        authMeta={{
          realm: authConfig.realm,
          clientId: authConfig.clientId,
          apiBaseUrl: authConfig.apiBaseUrl,
        }}
      />
    );
  }

  if (zone === "transition") {
    return (
      <AppShell
        navigationItems={shellNavigation}
        activeNavId="overview"
        title="Рабочая зона AprilHub"
        subtitle="Стандартный каркас авторизованной зоны для модульного расширения."
        statusBadgeLabel="Идет инициализация"
        accountMenu={{
          variant: "limited",
          caption: "Инициализация",
          subtitle: "Загрузка профиля…",
        }}
      >
        <SharedState state="loading" message={transitionReason} />
      </AppShell>
    );
  }

  if (zone === "forbidden") {
    return (
      <AppShell
        navigationItems={shellNavigation}
        title="Рабочая зона AprilHub"
        subtitle="Стандартный каркас авторизованной зоны для модульного расширения."
        statusBadgeLabel="Доступ ограничен"
        accountMenu={{
          variant: "limited",
          caption: "Доступ ограничен",
          subtitle: "Нет прав на оболочку",
          onLogout: () => void keycloak.logout(),
        }}
      >
        <SharedState
          state="forbidden"
          message="Текущая учетная запись авторизована, но не имеет доступа к bootstrap endpoint оболочки."
          action={
            <Button type="button" variant="light" color="red" onClick={() => void keycloak.logout()}>
              Выйти
            </Button>
          }
        />
      </AppShell>
    );
  }

  if (!context) {
    return (
      <AppShell
        navigationItems={shellNavigation}
        title="Рабочая зона AprilHub"
        subtitle="Стандартный каркас авторизованной зоны для модульного расширения."
        statusBadgeLabel="Контекст отсутствует"
        accountMenu={{
          variant: "limited",
          caption: "Сессия без контекста",
          subtitle: "Профиль не загружен",
          onLogout: () => void keycloak.logout(),
        }}
      >
        <SharedState state="empty" message="Авторизованная сессия найдена, но пользовательский контекст не инициализирован." />
      </AppShell>
    );
  }

  return (
    <AppShell
      navigationItems={shellNavigation}
      activeNavId="overview"
      title="Рабочая зона AprilHub"
      subtitle="Стандартный каркас авторизованной зоны для модульного расширения."
      statusBadgeLabel="Авторизовано"
      accountMenu={{
        variant: "user",
        userName: context.user.name,
        userEmail: context.user.email,
        onProfile: () => window.location.assign(keycloak.createAccountUrl()),
        onLogout: () => void keycloak.logout(),
      }}
    >
      <CompositionLayer context={context} />
      {error && <SharedState state="error" message={error} />}
    </AppShell>
  );
}
