import { expect, test } from "@playwright/test";
import { loginThroughKeycloak } from "./helpers/login";

const restrictedUser = process.env.PLAYWRIGHT_RESTRICTED_USER ?? "april-user";
const restrictedPass = process.env.PLAYWRIGHT_RESTRICTED_PASSWORD ?? "april-user-pass";

test.describe("RBAC: минимальный sidebar и fallback (restricted)", () => {
  test.beforeEach(async ({ page }) => {
    await loginThroughKeycloak(page, restrictedUser, restrictedPass);
  });

  test("в сайдбаре доступен только пункт Профиль — список", async ({ page }) => {
    await page.goto("/#/app/profile/entities");
    const nav = page.getByRole("navigation", { name: "Основная навигация" });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: "Профиль — список" })).toHaveCount(1);
    await expect(nav.getByRole("link")).toHaveCount(1);
  });

  test("неизвестный маршрут: not-found без падения shell", async ({ page }) => {
    await page.goto("/#/app/this-route-does-not-exist");
    await expect(page.getByRole("heading", { name: "Ошибка" })).toBeVisible();
    await expect(page.getByText(/Маршрут не найден/i)).toBeVisible();
  });
});
