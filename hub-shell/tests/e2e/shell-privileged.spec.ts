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

  test("показывает админ-пункты навигации (realm-роль admin)", async ({ page }) => {
    await page.goto("/#/app/overview");
    await expect(page.getByRole("navigation", { name: "Основная навигация" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Профиль — конфликты и merge" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Админ-контур" })).toBeVisible();
  });

  test("выход из сессии возвращает в гостевую зону", async ({ page }) => {
    await page.goto("/#/app/overview");
    await page.getByLabel("Меню профиля и настроек").click();
    await page.getByRole("menuitem", { name: "Выйти" }).click();
    await expect(page.getByTestId("guest-landing")).toBeVisible({ timeout: 30_000 });
  });
});
