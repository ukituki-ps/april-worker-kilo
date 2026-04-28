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

  test("экземпляры профиля: без admin 403/401 от BFF в UI", async ({ page }) => {
    await loginThroughKeycloak(page, restrictedUser, restrictedPass);
    await page.goto("/#/app/profile/instances/demo-instance");
    await expect(page.getByRole("heading", { name: "Profile instances widget" })).toBeVisible();
    await expect(page.getByTestId("profile-instances-last-error")).toContainText(/403|401/i, { timeout: 20_000 });
  });

  test("карточка профиля: без admin — ошибка при сохранении (BFF 403/401)", async ({ page }) => {
    await loginThroughKeycloak(page, restrictedUser, restrictedPass);
    await page.goto("/#/app/profile/entities/00000000-0000-0000-0000-000000000001/card");
    await expect(page.getByRole("heading", { name: "Профиль (виджет)" })).toBeVisible();
    await page.getByRole("button", { name: "Сохранить профиль" }).click();
    await expect(page.getByTestId("profile-widget-save-error")).toContainText(/403|401|недостаточно|insufficient/i, {
      timeout: 30_000,
    });
  });

  test("история экземпляра: без admin — ошибка загрузки", async ({ page }) => {
    await loginThroughKeycloak(page, restrictedUser, restrictedPass);
    await page.goto("/#/app/profile/instances/00000000-0000-0000-0000-000000000099/history");
    await expect(page.getByTestId("instance-history-last-error")).toContainText(/403|401|load failed/i, { timeout: 30_000 });
  });

  test("вкладка Связи: доступна restricted (статичный плейсхолдер)", async ({ page }) => {
    await loginThroughKeycloak(page, restrictedUser, restrictedPass);
    await page.goto("/#/app/profile/entities/00000000-0000-0000-0000-000000000001/meta");
    await expect(page.getByTestId("profile-meta-placeholder")).toBeVisible();
  });
});
