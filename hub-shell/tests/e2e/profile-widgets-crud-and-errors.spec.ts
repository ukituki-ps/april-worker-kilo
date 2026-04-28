import { expect, test } from "@playwright/test";
import { loginThroughKeycloak } from "./helpers/login";

const privilegedUser = process.env.PLAYWRIGHT_USER ?? "april-dev";
const privilegedPass = process.env.PLAYWRIGHT_PASSWORD ?? "april-dev-pass";

const entityStubJson = (entityId: string, version: number, document: Record<string, unknown>) =>
  JSON.stringify({
    entity_id: entityId,
    entity_type_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    version,
    created_at: "2026-04-24T00:00:00Z",
    document,
  });

/**
 * Дополнения к матрице CRUD и негативные сценарии BFF (stubs).
 */
test.describe("AprilProfile CRUD и ошибки (@smoke, stubs)", () => {
  test("список профилей: загрузка через внешний profiles-widget", async ({ page }) => {
    await page.route("**/api/v1/admin/profile/api/v1/entities**", async (route) => {
      const request = route.request();
      const method = request.method();
      const url = new URL(request.url());

      if (method === "GET" && url.pathname.includes("/v1/entities/")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: entityStubJson("00000000-0000-0000-0000-000000000001", 1, { name: "seed" }),
        });
        return;
      }

      await route.continue();
    });

    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/profile/entities");
    await expect(page.getByRole("heading", { name: "Profiles list widget" })).toBeVisible();
    await expect(page.getByTestId("profiles-widget-card")).toBeVisible();
    await expect(page.getByTestId("profiles-list-last-error")).toHaveCount(0);
  });

  test("экземпляры: create затем delete первого экземпляра", async ({ page }) => {
    const seedInstance = "demo-instance";
    const createdId = "ffffffff-ffff-ffff-ffff-ffffffffffff";
    const entityTypeId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

    await page.route("**/api/v1/admin/profile/api/v1/entities**", async (route) => {
      const request = route.request();
      const method = request.method();
      const url = new URL(request.url());

      if (method === "GET" && url.pathname.endsWith(`/v1/entities/${seedInstance}`)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: entityStubJson(seedInstance, 1, { profile_id: "00000000-0000-0000-0000-000000000001" }),
        });
        return;
      }

      if (method === "POST" && url.pathname.endsWith("/v1/entities")) {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: entityStubJson(createdId, 1, { profile_id: "00000000-0000-0000-0000-000000000001" }),
        });
        return;
      }

      if (method === "DELETE" && url.pathname.endsWith(`/v1/entities/${createdId}`)) {
        await route.fulfill({ status: 204 });
        return;
      }

      await route.continue();
    });

    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/overview");
    await page.getByRole("link", { name: "Профиль — экземпляры" }).click();
    await expect(page.getByRole("heading", { name: "Profile instances widget" })).toBeVisible();
    await expect(page.getByTestId("profile-instances-last-action")).toContainText("loaded", { timeout: 30_000 });

    await page.getByLabel("Entity type ID").fill(entityTypeId);
    await page.getByRole("button", { name: "Create instance" }).click();
    await expect(page.getByTestId("profile-instances-last-action")).toContainText("created", { timeout: 30_000 });

    await page.getByRole("button", { name: "Delete first instance" }).click();
    await expect(page.getByTestId("profile-instances-last-action")).toContainText("deleted", { timeout: 30_000 });
  });

  test("карточка профиля: 422 от BFF показывает profile-widget-save-error", async ({ page }) => {
    await page.route("**/api/v1/admin/profile/api/v1/entities**", async (route) => {
      const method = route.request().method();
      if (method === "PUT") {
        await route.fulfill({
          status: 422,
          contentType: "application/json",
          body: JSON.stringify({ code: "invalid_request", message: "stub validation failed" }),
        });
        return;
      }
      await route.continue();
    });

    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/profile/entities/00000000-0000-0000-0000-000000000001/card");
    await expect(page.getByRole("heading", { name: "Профиль (виджет)" })).toBeVisible();
    await page.getByRole("button", { name: "Сохранить профиль" }).click();
    await expect(page.getByTestId("profile-widget-save-error")).toContainText(/validation|422|stub/i, {
      timeout: 30_000,
    });
  });

  test("карточка профиля: 409 entity_type_not_published — сообщение в save-error", async ({ page }) => {
    await page.route("**/api/v1/admin/profile/api/v1/entities**", async (route) => {
      const method = route.request().method();
      if (method === "PUT") {
        await route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify({ code: "entity_type_not_published", message: "type not published" }),
        });
        return;
      }
      await route.continue();
    });

    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/profile/entities/00000000-0000-0000-0000-000000000001/card");
    await expect(page.getByRole("heading", { name: "Профиль (виджет)" })).toBeVisible();
    await page.getByRole("button", { name: "Сохранить профиль" }).click();
    await expect(page.getByTestId("profile-widget-save-error")).toContainText(/опубликуйте|published|тип/i, {
      timeout: 30_000,
    });
  });

  test("история экземпляра: version 0 — пустое состояние", async ({ page }) => {
    await page.route(/\/api\/v1\/admin\/profile\/api\/v1\/entities\/zero-ver-instance$/i, async (route) => {
      const method = route.request().method();
      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            entity_id: "zero-ver-instance",
            entity_type_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            version: 0,
            created_at: "2026-04-24T00:00:00Z",
            document: {},
          }),
        });
        return;
      }
      await route.continue();
    });

    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/profile/instances/zero-ver-instance/history");
    await expect(page.getByTestId("instance-history-empty")).toBeVisible({ timeout: 30_000 });
  });

  test("история экземпляра: ошибка загрузки текущей версии", async ({ page }) => {
    await page.route(/\/api\/v1\/admin\/profile\/api\/v1\/entities\/bad-history-instance$/i, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ code: "upstream", message: "stub unavailable" }),
        });
        return;
      }
      await route.continue();
    });

    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/profile/instances/bad-history-instance/history");
    await expect(page.getByTestId("instance-history-last-error")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("instance-history-last-error")).toContainText(/503|failed|unavailable/i);
  });

  test("конфликты: пустая очередь", async ({ page }) => {
    await page.route("**/api/v1/admin/profile/api/v1/admin/**", async (route) => {
      const method = route.request().method();
      const url = new URL(route.request().url());
      if (method === "GET" && url.pathname.endsWith("/v1/admin/profile-conflicts")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ items: [] }),
        });
        return;
      }
      await route.continue();
    });

    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/profile/admin/conflicts");
    await expect(page.getByTestId("conflicts-merge-empty")).toBeVisible({ timeout: 30_000 });
  });

  test("конфликты: ошибка загрузки очереди", async ({ page }) => {
    await page.route("**/api/v1/admin/profile/api/v1/admin/**", async (route) => {
      const method = route.request().method();
      const url = new URL(route.request().url());
      if (method === "GET" && url.pathname.endsWith("/v1/admin/profile-conflicts")) {
        await route.fulfill({
          status: 502,
          contentType: "application/json",
          body: JSON.stringify({ code: "bad_gateway", message: "stub" }),
        });
        return;
      }
      await route.continue();
    });

    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/profile/admin/conflicts");
    await expect(page.getByTestId("conflicts-merge-last-error")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("conflicts-merge-last-error")).toContainText(/502|Загрузка|failed/i);
  });

  test("конфликты: merge без UUID — клиентская валидация", async ({ page }) => {
    await page.route("**/api/v1/admin/profile/api/v1/admin/**", async (route) => {
      const method = route.request().method();
      const url = new URL(route.request().url());
      if (method === "GET" && url.pathname.endsWith("/v1/admin/profile-conflicts")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ items: [] }),
        });
        return;
      }
      await route.continue();
    });

    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/profile/admin/conflicts");
    await expect(page.getByTestId("conflicts-merge-host-card")).toBeVisible();
    await page.locator("#conflicts-merge-source").clear();
    await page.locator("#conflicts-merge-target").clear();
    await page.getByTestId("conflicts-merge-submit-btn").click();
    await expect(page.getByTestId("conflicts-merge-last-error")).toContainText(/UUID|Укажите/i, {
      timeout: 15_000,
    });
  });
});
