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
});
