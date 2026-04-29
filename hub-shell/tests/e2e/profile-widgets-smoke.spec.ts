import { expect, test } from "@playwright/test";
import { loginThroughKeycloak } from "./helpers/login";

const privilegedUser = process.env.PLAYWRIGHT_USER ?? "april-dev";
const privilegedPass = process.env.PLAYWRIGHT_PASSWORD ?? "april-dev-pass";

test.describe("AprilHub auth-only shell (@smoke)", () => {
  test("авторизованный контур не вызывает профильный API", async ({ page }) => {
    let profileApiCalls = 0;
    await page.route("**/api/v1/admin/profile/api/**", async (route) => {
      profileApiCalls += 1;
      await route.continue();
    });

    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app");
    await expect(page).toHaveURL(/#\/app$/);
    await expect(page.getByTestId("authorized-empty-placeholder")).toBeVisible();
    expect(profileApiCalls).toBe(0);
  });

  test("unknown route: показывается fallback без падения shell", async ({ page }) => {
    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/removed-route");
    await expect(page.getByRole("heading", { name: "Ошибка" })).toBeVisible();
    await expect(page.getByText(/Маршрут не найден/i)).toBeVisible();
    await page.getByRole("button", { name: "Перейти в рабочую зону" }).click();
    await expect(page).toHaveURL(/#\/app$/);
  });
});
