import { expect, test } from "@playwright/test";
import { loginThroughKeycloak } from "./helpers/login";

const restrictedUser = process.env.PLAYWRIGHT_RESTRICTED_USER ?? "april-user";
const restrictedPass = process.env.PLAYWRIGHT_RESTRICTED_PASSWORD ?? "april-user-pass";

/**
 * Пользователь без роли admin: BFF `/api/v1/admin/profile/*` требует admin — ожидаем штатную ошибку загрузки, не «битый» React.
 */
test.describe("AprilProfile widgets (restricted, без stubs)", () => {
  test("список профилей: 403 от BFF отображается в UI", async ({ page }) => {
    await loginThroughKeycloak(page, restrictedUser, restrictedPass);
    await page.goto("/#/app/profile/entities");
    await expect(page.getByRole("heading", { name: "Profiles list widget" })).toBeVisible();
    await expect(page.getByTestId("profiles-list-last-error")).toContainText(/access denied|authentication|failed|403|401/i, {
      timeout: 20_000,
    });
  });
});
