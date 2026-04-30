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

  // Avoid React.StrictMode: it intentionally remounts trees in development, which duplicates
  // profile widget network I/O (list GET) even when abort/cancel races are tight.
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <AprilProviders>
      <App authInitError={authInitError} />
    </AprilProviders>,
  );
})();
