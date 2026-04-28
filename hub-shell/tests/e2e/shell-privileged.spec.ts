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

  test("показывает минимальный сайдбар только с профилем", async ({ page }) => {
    await page.goto("/#/app/profile/entities");
    const nav = page.getByRole("navigation", { name: "Основная навигация" });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: "Профиль — список" })).toHaveCount(1);
    await expect(nav.getByRole("link")).toHaveCount(1);
  });

  test("выход из сессии возвращает в гостевую зону", async ({ page }) => {
    await page.goto("/#/app/profile/entities");
    await page.getByLabel("Меню профиля и настроек").click();
    await page.getByRole("menuitem", { name: "Выйти" }).click();
    await expect(page.getByTestId("guest-landing")).toBeVisible({ timeout: 30_000 });
  });
});
