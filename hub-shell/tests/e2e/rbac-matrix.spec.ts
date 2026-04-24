import { expect, test } from "@playwright/test";
import { loginThroughKeycloak } from "./helpers/login";

const restrictedUser = process.env.PLAYWRIGHT_RESTRICTED_USER ?? "april-user";
const restrictedPass = process.env.PLAYWRIGHT_RESTRICTED_PASSWORD ?? "april-user-pass";

test.describe("RBAC: навигация и запрещённые маршруты (restricted)", () => {
  test.beforeEach(async ({ page }) => {
    await loginThroughKeycloak(page, restrictedUser, restrictedPass);
  });

  test("в сайдбаре нет админ-пунктов без роли admin", async ({ page }) => {
    await page.goto("/#/app/overview");
    await expect(page.getByRole("navigation", { name: "Основная навигация" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Профиль — конфликты и merge" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Админ-контур" })).toHaveCount(0);
  });

  test("прямой deep-link на экран конфликтов показывает запрет", async ({ page }) => {
    await page.goto("/#/app/profile/admin/conflicts");
    await expect(page.getByRole("heading", { name: "Доступ запрещен" })).toBeVisible();
    await expect(page.getByText(/роли admin/i)).toBeVisible();
  });

  test("прямой deep-link на админ-контур показывает запрет", async ({ page }) => {
    await page.goto("/#/app/admin-control");
    await expect(page.getByRole("heading", { name: "Доступ запрещен" })).toBeVisible();
    await expect(page.getByText(/роли admin/i)).toBeVisible();
  });

  test("неизвестный маршрут: not-found без падения shell", async ({ page }) => {
    await page.goto("/#/app/this-route-does-not-exist");
    await expect(page.getByRole("heading", { name: "Ошибка" })).toBeVisible();
    await expect(page.getByText(/Маршрут не найден/i)).toBeVisible();
  });
});
