import { expect, test } from "@playwright/test";
import { loginThroughKeycloak } from "./helpers/login";

const privilegedUser = process.env.PLAYWRIGHT_USER ?? "april-dev";
const privilegedPass = process.env.PLAYWRIGHT_PASSWORD ?? "april-dev-pass";

/**
 * @integration Реальный вызов через Hub BFF без `page.route` (нет перехвата контракта).
 * При отсутствии `APRIL_PROFILE_ADMIN_URL` у hub-bff ожидается 503/ошибка прокси — тест всё равно зелёный при штатном UX.
 * При поднятом AprilProfile и корректном seed — возможен onSaveSuccess (см. docs/guides/APRILHUB_PLAYWRIGHT_PERSONAS.md).
 */
test.describe("@integration BFF без network-stub", () => {
  test("карточка профиля: сохранение идёт в реальный BFF (успех или структурированная ошибка)", async ({ page }) => {
    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/profile/entities/00000000-0000-0000-0000-000000000001/card");
    await expect(page.getByTestId("profile-domain-shell")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Профиль (виджет)" })).toBeVisible();
    await page.getByRole("button", { name: "Сохранить профиль" }).click();
    const success = page.getByTestId("profile-widget-save-success");
    const error = page.getByTestId("profile-widget-save-error");
    await expect(success.or(error)).toBeVisible({ timeout: 30_000 });
  });

  test("список профилей: реальный BFF — loaded, создание или штатная ошибка", async ({ page }) => {
    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/profile/entities");
    await expect(page.getByRole("heading", { name: "Profiles list widget" })).toBeVisible();
    const listErr = page.getByTestId("profiles-list-last-error");
    const profileList = page.getByText("Profiles", { exact: false });
    await expect(profileList.or(listErr)).toBeVisible({ timeout: 45_000 });
  });
});
