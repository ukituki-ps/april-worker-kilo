import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

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
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: 4173,
      ...(allowedHosts ? { allowedHosts } : {}),
    },
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      cache: false,
    },
  };
});
