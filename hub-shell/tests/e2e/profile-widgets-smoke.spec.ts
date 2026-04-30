import { expect, test } from "@playwright/test";
import { loginThroughKeycloak } from "./helpers/login";

const privilegedUser = process.env.PLAYWRIGHT_USER ?? "april-dev";
const privilegedPass = process.env.PLAYWRIGHT_PASSWORD ?? "april-dev-pass";

test.describe("Profiles widget smoke", () => {
  test("сайдбар: Профили открывает список и рендерит внешний виджет", async ({ page }) => {
    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app");

    await page.getByRole("link", { name: "Профили" }).click();
    await expect(page).toHaveURL(/#\/app\/profile\/entities$/);
    await expect(page.getByText("Profiles", { exact: true })).toBeVisible();
    await expect(page.getByLabel("profiles-list-loading")).not.toBeVisible({ timeout: 60_000 });
    await expect(
      page.getByText(/Loaded \d+ of \d+|No items for current|No profiles found for current query/),
    ).toBeVisible();
  });

  test("сайдбар: Шаблоны открывает маршрут и рендерит виджет типов сущностей", async ({ page }) => {
    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app");

    await page.getByRole("link", { name: "Шаблоны" }).click();
    await expect(page).toHaveURL(/#\/app\/profile\/entity-types$/);
    await expect(page.getByText("Entity types", { exact: true })).toBeVisible();
  });
});
