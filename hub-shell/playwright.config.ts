import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080";

export default defineConfig({
  testDir: "./tests/e2e",
  /** Меньше параллельных OIDC/Vite на одном dev-контейнере hub-shell */
  fullyParallel: false,
  /** OIDC + холодный Vite dev в compose часто >60s */
  timeout: 180_000,
  expect: {
    timeout: 30_000,
  },
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "guest",
      testMatch: "**/guest.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium",
      testIgnore: "**/guest.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
