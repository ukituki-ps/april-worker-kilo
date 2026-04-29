import { expect, test } from "@playwright/test";
import { loginThroughKeycloak } from "./helpers/login";

const privilegedUser = process.env.PLAYWRIGHT_USER ?? "april-dev";
const privilegedPass = process.env.PLAYWRIGHT_PASSWORD ?? "april-dev-pass";

test.describe("AprilHub profiles widget shell (@smoke)", () => {
  test("авторизованный контур открывает раздел Профили", async ({ page }) => {
    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app");
    await expect(page).toHaveURL(/#\/app\/profile\/entities$/);
    const nav = page.getByRole("navigation", { name: "Основная навигация" });
    await expect(nav.getByRole("link", { name: "Профили" })).toBeVisible();
    await expect(page.getByTestId("profiles-widget-card")).toBeVisible();
  });

  test("unknown route: показывается fallback без падения shell", async ({ page }) => {
    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/removed-route");
    await expect(page.getByRole("heading", { name: "Ошибка" })).toBeVisible();
    await expect(page.getByText(/Маршрут не найден/i)).toBeVisible();
    await page.getByRole("button", { name: "Перейти в рабочую зону" }).click();
    await expect(page).toHaveURL(/#\/app\/profile\/entities$/);
  });
});
