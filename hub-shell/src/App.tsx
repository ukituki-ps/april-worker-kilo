import { useEffect, useMemo, useState } from "react";
import { authConfig } from "./auth";
import { apiRequest } from "./api";
import { AppShell } from "./app-shell";
import { CompositionLayer } from "./composition-layer";
import { keycloak } from "./keycloak";
import { SharedState } from "./shared-ux";
import type { ShellUserContext, UserProfile } from "./types";
import { buildShellUserContext } from "./user-context";
import "./app.css";

type AuthZone = "guest" | "transition" | "authorized" | "forbidden";

export default function App() {
  const [me, setMe] = useState<UserProfile | null>(null);
  const [zone, setZone] = useState<AuthZone>(keycloak.authenticated ? "transition" : "guest");
  const [transitionReason, setTransitionReason] = useState<string>("Checking existing Keycloak session...");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!keycloak.authenticated) {
      setZone("guest");
      return;
    }

    const loadData = async (): Promise<void> => {
      setZone("transition");
      setTransitionReason("Returning from identity provider and initializing user context...");
      setError("");

      const meResponse = await apiRequest("/v1/me");
      if (!meResponse.ok) {
        if (meResponse.status === 403) {
          setZone("forbidden");
          return;
        }
        setError(`Failed to load profile: ${meResponse.status}`);
        setZone("guest");
        return;
      }
      setMe((await meResponse.json()) as UserProfile);
      setZone("authorized");
    };

    void loadData().catch((loadError: unknown) => {
      setZone("guest");
      setError(loadError instanceof Error ? loadError.message : "Unexpected auth runtime error");
    });
  }, []);

  const context: ShellUserContext | null = useMemo(() => (me ? buildShellUserContext(me) : null), [me]);

  if (zone === "guest") {
    return (
      <main className="zone-container">
        <h1>AprilHub Shell</h1>
        <p>Sign in via Keycloak to open authorized composition runtime.</p>
        <button type="button" onClick={() => void keycloak.login()}>
          Login with Keycloak
        </button>
        <small>
          {authConfig.realm} · {authConfig.clientId} · {authConfig.apiBaseUrl}
        </small>
        {error && <SharedState state="error" message={error} />}
      </main>
    );
  }

  if (zone === "transition") {
    return (
      <main className="zone-container">
        <SharedState state="loading" message={transitionReason} />
      </main>
    );
  }

  if (zone === "forbidden") {
    return (
      <main className="zone-container">
        <SharedState
          state="forbidden"
          message="Current account is authenticated but doesn't have access to shell bootstrap endpoint."
          action={
            <button type="button" onClick={() => void keycloak.logout()}>
              Logout
            </button>
          }
        />
      </main>
    );
  }

  if (!context) {
    return <SharedState state="empty" message="Authorized session found, but user context is not initialized." />;
  }

  return (
    <AppShell context={context} onLogout={() => void keycloak.logout()}>
      <CompositionLayer context={context} />
      {error && <SharedState state="error" message={error} />}
    </AppShell>
  );
}
