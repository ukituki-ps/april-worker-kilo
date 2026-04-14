import { useEffect, useState } from "react";
import { authConfig } from "./auth";
import { apiRequest } from "./api";
import { keycloak } from "./keycloak";

type MeResponse = {
  sub: string;
  username: string;
  email: string;
  name: string;
  roles: string[];
};

export default function App() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [overviewStatus, setOverviewStatus] = useState<string>("idle");
  const [adminPingStatus, setAdminPingStatus] = useState<string>("idle");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!keycloak.authenticated) {
      return;
    }

    const loadData = async (): Promise<void> => {
      setError("");

      const meResponse = await apiRequest("/api/v1/me");
      if (!meResponse.ok) {
        setError(`Failed to load profile: ${meResponse.status}`);
        return;
      }
      setMe((await meResponse.json()) as MeResponse);

      const overviewResponse = await apiRequest("/api/v1/overview");
      setOverviewStatus(`${overviewResponse.status}`);

      const adminResponse = await apiRequest("/api/v1/admin/ping");
      setAdminPingStatus(`${adminResponse.status}`);
      if (adminResponse.status === 403) {
        setError("403: insufficient role for /api/v1/admin/ping");
      }
    };

    void loadData().catch((loadError: unknown) => {
      setError(loadError instanceof Error ? loadError.message : "Unexpected auth runtime error");
    });
  }, []);

  return (
    <main>
      <h1>AprilHub Shell</h1>
      <p>Auth-enabled shell runtime is running.</p>
      <ul>
        <li>Keycloak: {authConfig.keycloakUrl || "not configured"}</li>
        <li>Realm: {authConfig.realm}</li>
        <li>Client: {authConfig.clientId}</li>
        <li>Hub BFF: {authConfig.apiBaseUrl}</li>
        <li>Authenticated: {String(keycloak.authenticated)}</li>
      </ul>

      <div>
        <button type="button" onClick={() => void keycloak.login()}>
          Login
        </button>
        <button type="button" onClick={() => void keycloak.logout()}>
          Logout
        </button>
      </div>

      <h2>Runtime Checks</h2>
      <ul>
        <li>/api/v1/me: {me ? "200" : "not loaded"}</li>
        <li>/api/v1/overview: {overviewStatus}</li>
        <li>/api/v1/admin/ping: {adminPingStatus}</li>
      </ul>
      {me && (
        <p>
          User: {me.username} ({me.email}), roles: {me.roles.join(", ")}
        </p>
      )}
      {error && <p>{error}</p>}
    </main>
  );
}
