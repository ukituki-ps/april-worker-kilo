import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080";
const testTimeoutMs = Number(process.env.PLAYWRIGHT_TEST_TIMEOUT_MS ?? 180_000);
const expectTimeoutMs = Number(process.env.PLAYWRIGHT_EXPECT_TIMEOUT_MS ?? 30_000);
const workers = Number(process.env.PLAYWRIGHT_WORKERS ?? (process.env.CI ? 2 : 3));

export default defineConfig({
  testDir: "./tests/e2e",
  /** Меньше параллельных OIDC/Vite на одном dev-контейнере hub-shell */
  fullyParallel: false,
  /** OIDC + холодный Vite dev в compose часто >60s */
  timeout: testTimeoutMs,
  expect: {
    timeout: expectTimeoutMs,
  },
  workers,
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
    {
      name: "mobile-chromium",
      testMatch: "**/profile-widgets-smoke.spec.ts",
      use: {
        ...devices["Pixel 5"],
      },
    },
  ],
});
