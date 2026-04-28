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

  return {
    envPrefix: ["VITE_", "SENTRY_"],
    plugins: [react()],
    resolve: {
      // @april/ui из submodule тянет @mantine/* из pnpm внутри DS → второй React и invalid hook call в Vitest.
      dedupe: ["react", "react-dom"],
      alias: {
        "@mantine/core": path.join(hubShellDir, "node_modules/@mantine/core"),
        "@mantine/hooks": path.join(hubShellDir, "node_modules/@mantine/hooks"),
        "@april/profile-ui": path.resolve(hubShellDir, "src/vendor/april-profile-ui.tsx"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 4173,
      ...(allowedHosts ? { allowedHosts } : {}),
    },
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      cache: false,
      exclude: ["tests/e2e/**", "node_modules/**", "dist/**"],
    },
  };
});
