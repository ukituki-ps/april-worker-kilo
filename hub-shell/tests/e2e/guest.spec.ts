import { expect, test } from "@playwright/test";
import { startLoginFromGuestHeader } from "./helpers/login";

test.describe("AprilHub guest (без авторизации)", () => {
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
});
