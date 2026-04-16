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

type AppProps = {
  authInitError?: string;
};

const valueHighlights = [
  {
    title: "Unified workbench",
    description: "Single ingress for dashboards, workflows, and service diagnostics without direct port switching.",
  },
  {
    title: "Identity-first access",
    description: "Authorization is delegated to Keycloak roles, so onboarding and revocation stay centralized.",
  },
  {
    title: "Operational clarity",
    description: "Aggregation status, correlation metadata, and runtime context are visible in one shell.",
  },
];

const keyScenarios = [
  "Monitor cross-service status from aggregation dashboard.",
  "Open composition widgets after successful Keycloak sign-in.",
  "Verify identity and role gates through the same ingress path.",
];

export default function App({ authInitError = "" }: AppProps) {
  const [me, setMe] = useState<UserProfile | null>(null);
  const [zone, setZone] = useState<AuthZone>(keycloak.authenticated ? "transition" : "guest");
  const [transitionReason, setTransitionReason] = useState<string>("Checking existing Keycloak session...");
  const [error, setError] = useState<string>(authInitError);
  const [isLoginStarting, setIsLoginStarting] = useState<boolean>(false);

  const startLoginFlow = async (): Promise<void> => {
    setIsLoginStarting(true);
    setError("");
    try {
      await keycloak.login();
    } catch (loginError) {
      setIsLoginStarting(false);
      setError(loginError instanceof Error ? loginError.message : "Unable to start Keycloak login flow.");
    }
  };

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
      <main className="zone-container guest-landing" data-testid="guest-landing">
        <section className="landing-hero">
          <p className="landing-eyebrow">AprilHub Platform</p>
          <h1>AprilHub Shell</h1>
          <p>
            Product landing for the AprilHub ingress: explore platform value and enter the authorized workspace through
            the active Keycloak flow.
          </p>
          <div className="landing-actions">
            <button type="button" onClick={() => void startLoginFlow()} disabled={isLoginStarting}>
              {isLoginStarting ? "Redirecting to Keycloak..." : "Open secure workspace"}
            </button>
            <span className="landing-note">Entrypoint: {window.location.origin}/auth</span>
          </div>
        </section>

        <section className="landing-section">
          <h2>Why teams use AprilHub</h2>
          <div className="landing-cards">
            {valueHighlights.map((highlight) => (
              <article key={highlight.title} className="landing-card">
                <h3>{highlight.title}</h3>
                <p>{highlight.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section">
          <h2>Key scenarios</h2>
          <ul className="landing-scenarios">
            {keyScenarios.map((scenario) => (
              <li key={scenario}>{scenario}</li>
            ))}
          </ul>
        </section>

        <small className="landing-meta">
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
