import { expect, test } from "@playwright/test";
import { loginThroughKeycloak } from "./helpers/login";

const privilegedUser = process.env.PLAYWRIGHT_USER ?? "april-dev";
const privilegedPass = process.env.PLAYWRIGHT_PASSWORD ?? "april-dev-pass";

test.describe("Profiles widget smoke", () => {
  test("сайдбар: Профили открывает список и рендерит виджет", async ({ page }) => {
    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app");

    await page.getByRole("link", { name: "Профили" }).click();
    await expect(page).toHaveURL(/#\/app\/profile\/entities$/);
    await expect(page.getByRole("heading", { name: "Profiles list widget" })).toBeVisible();
  });
});
