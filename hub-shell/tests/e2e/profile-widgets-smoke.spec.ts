import { expect, test } from "@playwright/test";
import { loginThroughKeycloak } from "./helpers/login";

const privilegedUser = process.env.PLAYWRIGHT_USER ?? "april-dev";
const privilegedPass = process.env.PLAYWRIGHT_PASSWORD ?? "april-dev-pass";

/**
 * @smoke Минимальный критичный путь: sidebar -> "Профиль — список".
 */
test.describe("AprilProfile widgets в Hub (@smoke, stubs)", () => {
  test("сайдбар: Профиль — список открывает внешний profiles-widget", async ({ page }) => {
    const listEntityId = "00000000-0000-0000-0000-000000000001";
    const entityTypeId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

    await page.route("**/api/v1/admin/profile/api/v1/entities**", async (route) => {
      const request = route.request();
      const method = request.method();
      const url = new URL(request.url());

      if (method === "GET" && url.pathname.endsWith(`/v1/entities/${listEntityId}`)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            entity_id: listEntityId,
            entity_type_id: entityTypeId,
            version: 1,
            created_at: "2026-04-24T00:00:00Z",
            document: { name: "Demo profile" },
          }),
        });
        return;
      }

      if (method === "POST" && url.pathname.endsWith("/v1/entities")) {
        await route.fulfill({ status: 405, contentType: "application/json", body: JSON.stringify({ code: "method_not_allowed" }) });
        return;
      }

      await route.continue();
    });

    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/profile/entities");
    await page.getByRole("link", { name: "Профиль — список" }).click();
    await expect(page).toHaveURL(/#\/app\/profile\/entities$/);
    await expect(page.getByRole("heading", { name: "Profiles list widget" })).toBeVisible();
    await expect(page.getByText("Tenant:", { exact: false })).toBeVisible();
  });

  test("сайдбар: Профиль — список показывает error-state при 503", async ({ page }) => {
    await page.route("**/api/v1/admin/profile/api/v1/entities**", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ code: "upstream_unavailable", message: "stub unavailable" }),
        });
        return;
      }
      await route.continue();
    });

    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/profile/entities");
    await page.getByRole("link", { name: "Профиль — список" }).click();
    await expect(page.getByRole("heading", { name: "Profiles list widget" })).toBeVisible();
    await expect(page.getByTestId("profiles-list-last-error")).toContainText(/operation failed|failed|ошибка/i, {
      timeout: 30_000,
    });
  });

  test("unknown route: показывается fallback без падения shell", async ({ page }) => {
    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/removed-route");
    await expect(page.getByRole("heading", { name: "Ошибка" })).toBeVisible();
    await expect(page.getByText(/Маршрут не найден/i)).toBeVisible();
    await page.getByRole("button", { name: "Перейти к списку профилей" }).click();
    await expect(page).toHaveURL(/#\/app\/profile\/entities$/);
  });
});
