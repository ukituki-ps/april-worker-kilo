import React from "react";
import ReactDOM from "react-dom/client";
import "@mantine/core/styles.css";
import { AprilProviders } from "@april/ui";
import App from "./App";
import { initializeAuth } from "./keycloak";
import { initializeSentry, installGlobalRuntimeHandlers } from "./sentry";

void (async () => {
  initializeSentry();
  installGlobalRuntimeHandlers();

  let authInitError = "";
  try {
    await initializeAuth();
  } catch (error) {
    authInitError = error instanceof Error ? error.message : "Не удалось инициализировать сессию идентификации.";
  }

  const appTree = (
    <AprilProviders>
      <App authInitError={authInitError} />
    </AprilProviders>
  );

  // StrictMode double-invokes effects in dev only; keep production free of extra mounts/network.
  ReactDOM.createRoot(document.getElementById("root")!).render(
    import.meta.env.DEV ? <React.StrictMode>{appTree}</React.StrictMode> : appTree,
  );
})();
