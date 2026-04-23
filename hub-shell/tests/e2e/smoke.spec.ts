import { expect, test } from "@playwright/test";

async function startLoginFromGuestHeader(page: import("@playwright/test").Page): Promise<void> {
  await page.getByLabel("Меню профиля и настроек").click();
  await page.getByTestId("guest-landing-login-nav").click();
}

test.describe("AprilHub smoke e2e", () => {
  test("показывает гостевой лендинг и вход в меню профиля", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("guest-landing")).toBeVisible();
    await expect(page.getByTestId("landing-ecosystem-cards")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Экосистема инструментов управления компанией:" })).toBeVisible();
    await page.getByLabel("Меню профиля и настроек").click();
    await expect(page.getByTestId("guest-landing-login-nav")).toBeVisible();
  });

  test("переводит пользователя на Keycloak login", async ({ page }) => {
    await page.goto("/");
    await startLoginFromGuestHeader(page);

    await page.waitForURL(/\/auth\/realms\/april\/protocol\/openid-connect\/auth/);
    await expect(page.locator("form")).toBeVisible();
  });

  test("позволяет пройти вход и открыть авторизованную рабочую зону", async ({ page }) => {
    await page.goto("/");
    await startLoginFromGuestHeader(page);

    await page.locator("#username").fill(process.env.PLAYWRIGHT_USER ?? "april-dev");
    await page.locator("#password").fill(process.env.PLAYWRIGHT_PASSWORD ?? "april-dev-pass");
    await page.locator("#kc-login").click();

    await page.waitForURL("/");
    await expect(page.getByRole("heading", { name: "Рабочая зона AprilHub" })).toBeVisible();
    await expect(page.getByText("Авторизовано")).toBeVisible();
    await page.getByLabel("Меню профиля и настроек").click();
    await expect(page.getByRole("menuitem", { name: "Выйти" })).toBeVisible();
  });

  test("рендерит profile widget и фиксирует onSaveSuccess", async ({ page }) => {
    const entityTypeId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const missingEntityId = "00000000-0000-0000-0000-000000000001";
    const createdEntityId = "11111111-1111-1111-1111-111111111111";

    await page.route("**/api/v1/admin/profile/api/v1/entities**", async (route) => {
      const request = route.request();
      const method = request.method();
      const url = new URL(request.url());

      if (method === "POST" && url.pathname.endsWith("/v1/entities")) {
        const body = JSON.parse(request.postData() ?? "{}") as { entity_type_id?: string };
        if (body.entity_type_id !== entityTypeId) {
          await route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({ code: "invalid_request", message: "unexpected entity_type_id in test stub" }),
          });
          return;
        }

        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            entity_id: createdEntityId,
            version: 1,
            document: { tenant_id: "default" },
          }),
        });
        return;
      }

      if (method === "PUT") {
        const match = url.pathname.match(/\/v1\/entities\/([^/]+)\/?$/);
        const entityId = match?.[1];
        if (!entityId) {
          await route.continue();
          return;
        }

        if (entityId === missingEntityId) {
          await route.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({ code: "entity_not_found", message: "stub: missing entity" }),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            entity_id: entityId,
            version: 2,
            document: {
              tenant_id: "default",
            },
          }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto("/");
    await startLoginFromGuestHeader(page);
    await page.locator("#username").fill(process.env.PLAYWRIGHT_USER ?? "april-dev");
    await page.locator("#password").fill(process.env.PLAYWRIGHT_PASSWORD ?? "april-dev-pass");
    await page.locator("#kc-login").click();

    await page.waitForURL("/");
    await expect(page.getByRole("heading", { name: "Профиль (виджет)" })).toBeVisible();
    await page.getByRole("button", { name: "Сохранить профиль" }).click();
    await expect(page.getByTestId("profile-widget-save-success")).toContainText("onSaveSuccess");
  });
});
