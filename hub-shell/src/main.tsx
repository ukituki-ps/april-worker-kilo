import React from "react";
import ReactDOM from "react-dom/client";
import "@mantine/core/styles.css";
import { AprilProviders } from "@april/ui";
import App from "./App";
import { initializeAuth } from "./keycloak";

void (async () => {
  let authInitError = "";
  try {
    await initializeAuth();
  } catch (error) {
    authInitError = error instanceof Error ? error.message : "Не удалось инициализировать сессию идентификации.";
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <AprilProviders>
        <App authInitError={authInitError} />
      </AprilProviders>
    </React.StrictMode>,
  );
})();
