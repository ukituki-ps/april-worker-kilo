import { authConfig } from "./auth";

export default function App() {
  return (
    <main>
      <h1>AprilHub Shell</h1>
      <p>Bootstrap shell is running.</p>
      <ul>
        <li>Keycloak: {authConfig.keycloakUrl || "not configured"}</li>
        <li>Realm: {authConfig.realm}</li>
        <li>Client: {authConfig.clientId}</li>
        <li>Hub BFF: {authConfig.apiBaseUrl}</li>
      </ul>
    </main>
  );
}
