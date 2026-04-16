import React from "react";
import ReactDOM from "react-dom/client";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
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
      <MantineProvider>
        <App authInitError={authInitError} />
      </MantineProvider>
    </React.StrictMode>,
  );
})();
