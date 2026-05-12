import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const hubShellDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const localEnv = loadEnv(mode, ".", "");
  const rootEnv = loadEnv(mode, "..", "");
  const runtimeAllowedHosts =
    typeof globalThis === "object" &&
    "process" in globalThis &&
    (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
      ? (globalThis as { process?: { env?: Record<string, string | undefined> } }).process!.env!
          .VITE_ALLOWED_HOSTS
      : undefined;
  const rawAllowedHosts =
    localEnv.VITE_ALLOWED_HOSTS ||
    rootEnv.VITE_ALLOWED_HOSTS ||
    runtimeAllowedHosts;
  const allowedHosts = rawAllowedHosts
    ? rawAllowedHosts.split(",")
        .map((host) => host.trim())
        .filter(Boolean)
    : undefined;

  const hmrHost =
    localEnv.VITE_DEV_HMR_HOST?.trim() || rootEnv.VITE_DEV_HMR_HOST?.trim() || "";
  const hmrProtocolRaw =
    localEnv.VITE_DEV_HMR_PROTOCOL?.trim() || rootEnv.VITE_DEV_HMR_PROTOCOL?.trim() || "wss";
  const hmrClientPortRaw =
    localEnv.VITE_DEV_HMR_CLIENT_PORT?.trim() || rootEnv.VITE_DEV_HMR_PROTOCOL?.trim() || "443";

  const hmrDisableRaw =
    localEnv.VITE_DEV_HMR_DISABLE?.trim() || rootEnv.VITE_DEV_HMR_DISABLE?.trim() || "";
  const hmrDisabled = ["1", "true", "yes", "on"].includes(hmrDisableRaw.toLowerCase());

  return {
    envPrefix: ["VITE_", "SENTRY_"],
    plugins: [react()],
    resolve: {
      // @april/ui из submodule тянет @mantine/* из pnpm внутри DS → второй React и invalid hook call в Vitest.
      dedupe: ["react", "react-dom"],
      alias: {
        "@april/ui": path.join(hubShellDir, "node_modules/@april/ui"),
        "@april/tokens": path.join(hubShellDir, "node_modules/@april/tokens"),
        "@mantine/core": path.join(hubShellDir, "node_modules/@mantine/core"),
        "@mantine/hooks": path.join(hubShellDir, "node_modules/@mantine/hooks"),
        // Импорты из vendor/profile-ui (вне root Vite) иначе не резолвятся к hub-shell/node_modules.
        "@tabler/icons-react": path.join(hubShellDir, "node_modules/@tabler/icons-react"),
        "@april/profile-ui-external": path.join(
          hubShellDir,
          "../vendor/april-profile/frontend/packages/profile-ui/src/index.ts",
        ),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 4173,
      // За некорректно настроенным TLS/edge-ingress WebSocket-upgrade даёт HTTP 200 вместо 101 →
      // клиент Vite уходит в «Polling for restart» и полностью перезагружает страницу по кругу.
      ...(hmrDisabled
        ? { hmr: false }
        : hmrHost
          ? {
              hmr: {
                protocol: hmrProtocolRaw.toLowerCase() === "ws" ? "ws" : "wss",
                host: hmrHost,
                clientPort: Number(hmrClientPortRaw) || 443,
              },
            }
          : {}),
      ...(allowedHosts ? { allowedHosts } : {}),
    },
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      cache: false,
      exclude: ["tests/e2e/**", "node_modules/**", "dist/**"],
      server: {
        deps: {
          inline: [/\/@april\//, /\/mantine-vaul/],
        },
      },
    },
  };
});
