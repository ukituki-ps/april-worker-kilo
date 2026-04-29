import { expect, test } from "@playwright/test";
import { loginThroughKeycloak } from "./helpers/login";

const privilegedUser = process.env.PLAYWRIGHT_USER ?? "april-dev";
const privilegedPass = process.env.PLAYWRIGHT_PASSWORD ?? "april-dev-pass";

test.describe("AprilHub shell (привилегированная персона)", () => {
  test.beforeEach(async ({ page }) => {
    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
  });

  test("открывает авторизованную рабочую зону после входа", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Рабочая зона AprilHub" })).toBeVisible();
    await expect(page.getByText("Авторизовано")).toBeVisible();
  });

  test("показывает раздел Профили в сайдбаре", async ({ page }) => {
    await page.goto("/#/app/profile/entities");
    const nav = page.getByRole("navigation", { name: "Основная навигация" });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link")).toHaveCount(1);
    await expect(nav.getByRole("link", { name: "Профили" })).toBeVisible();
    await expect(page.getByTestId("profiles-widget-card")).toBeVisible();
  });

  test("выход из сессии возвращает в гостевую зону", async ({ page }) => {
    await page.goto("/#/app");
    await page.getByLabel("Меню профиля и настроек").click();
    await page.getByRole("menuitem", { name: "Выйти" }).click();
    await expect(page.getByTestId("guest-landing")).toBeVisible({ timeout: 30_000 });
  });
});
