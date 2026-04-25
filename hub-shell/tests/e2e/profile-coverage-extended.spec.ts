import { expect, test } from "@playwright/test";
import { loginThroughKeycloak } from "./helpers/login";

const privilegedUser = process.env.PLAYWRIGHT_USER ?? "april-dev";
const privilegedPass = process.env.PLAYWRIGHT_PASSWORD ?? "april-dev-pass";

const jsonEntity = (id: string, version: number, document: Record<string, unknown>) =>
  JSON.stringify({
    entity_id: id,
    entity_type_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    version,
    created_at: "2026-04-24T00:00:00Z",
    document,
  });

/**
 * Расширенная матрица: все коды ошибок карточки, вкладка meta, shell-маршруты (роли, админ error boundary),
 * сценарии списка/экземпляров/конфликтов/истории с негативами и ветками UI.
 */
test.describe("Полное покрытие хоста профиля и shell (stubs + маршруты)", () => {
  test("карточка: 409 authority_all_blocked", async ({ page }) => {
    await page.route("**/api/v1/admin/profile/api/v1/entities**", async (route) => {
      if (route.request().method() === "PUT") {
        await route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify({ code: "authority_all_blocked", message: "all blocked" }),
        });
        return;
      }
      await route.continue();
    });
    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/profile/entities/00000000-0000-0000-0000-000000000001/card");
    await page.getByRole("button", { name: "Сохранить профиль" }).click();
    await expect(page.getByTestId("profile-widget-save-error")).toContainText(/политикой authority|всех переданных полей/i, {
      timeout: 30_000,
    });
  });

  test("карточка: POST create возвращает entity_type_not_found", async ({ page }) => {
    await page.route("**/api/v1/admin/profile/api/v1/entities**", async (route) => {
      const m = route.request().method();
      const path = new URL(route.request().url()).pathname;
      if (m === "POST" && /\/v1\/entities$/.test(path)) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ code: "entity_type_not_found", message: "type missing" }),
        });
        return;
      }
      await route.continue();
    });
    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/profile/entities/new/card");
    await expect(page.getByRole("heading", { name: "Профиль (виджет)" })).toBeVisible();
    await page.getByRole("button", { name: "Сохранить профиль" }).click();
    await expect(page.getByTestId("profile-widget-save-error")).toContainText(/Тип сущности не найден|entity_type|профиля/i, {
      timeout: 30_000,
    });
  });

  test("карточка: маршрут new — POST+PUT успех (создание с нуля)", async ({ page }) => {
    const newId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    await page.route("**/api/v1/admin/profile/api/v1/entities**", async (route) => {
      const m = route.request().method();
      const path = new URL(route.request().url()).pathname;
      if (m === "POST" && /\/v1\/entities$/.test(path)) {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: jsonEntity(newId, 1, { tenant_id: "x" }),
        });
        return;
      }
      if (m === "PUT" && path.includes(`/v1/entities/${newId}`)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: jsonEntity(newId, 2, { tenant_id: "x" }),
        });
        return;
      }
      await route.continue();
    });
    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/profile/entities/new/card");
    await page.getByRole("button", { name: "Сохранить профиль" }).click();
    await expect(page.getByTestId("profile-widget-save-success")).toContainText("onSaveSuccess", { timeout: 30_000 });
  });

  test("карточка: обёртка Данные ↔ вкладка Связи, демо-диалог", async ({ page }) => {
    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    const eid = "00000000-0000-0000-0000-000000000001";
    await page.goto(`/#/app/profile/entities/${eid}/card`);
    await expect(page.getByRole("tab", { name: "Данные" })).toBeVisible();
    await page.getByRole("tab", { name: "Связи" }).click();
    await expect(page.getByTestId("profile-meta-placeholder")).toBeVisible();
    await page.getByTestId("shell-danger-demo-button").click();
    await expect(page.getByTestId("shell-confirm-dialog")).toBeVisible();
    await page.getByRole("button", { name: "Подтвердить" }).click();
    await expect(page.getByTestId("shell-confirm-dialog")).toBeHidden({ timeout: 10_000 });
  });

  test("страница ролей: /app/roles", async ({ page }) => {
    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/roles");
    await expect(page.getByTestId("shell-roles-widget")).toBeVisible();
    await expect(page.getByTestId("shell-roles-text")).toBeVisible();
  });

  test("админ-контур: BrokenWidget ловится error boundary", async ({ page }) => {
    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/admin-control");
    await expect(page.getByRole("heading", { name: "Ошибка" })).toBeVisible();
    await expect(page.getByText(/Админ-контур.*недоступен/i)).toBeVisible();
  });

  test("навигация: кнопка Назад на карточке профиля (через обзор)", async ({ page }) => {
    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/overview");
    await page.getByRole("link", { name: "Профиль — карточка" }).click();
    await expect(page.getByTestId("profile-domain-shell")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("shell-back-button").click();
    await expect(page.getByTestId("shell-overview-widget")).toBeVisible({ timeout: 15_000 });
  });

  test("история экземпляра: v2, два снапшота, diff и режим сравнения", async ({ page }) => {
    const iid = "a1000000-0000-0000-0000-000000000001";
    const esc = iid.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await page.route(
      new RegExp(`/api/v1/admin/profile/api/v1/entities/${esc}(/versions/\\d+)?$`, "i"),
      async (route) => {
        const m = route.request().method();
        const path = new URL(route.request().url()).pathname;
        if (m === "GET" && path.endsWith(`/entities/${iid}`)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            entity_id: iid,
            version: 2,
            document: { status: "approved" },
          }),
        });
        return;
      }
      if (m === "GET" && path.endsWith("/versions/1")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            version: 1,
            created_at: "2026-04-24T00:00:01Z",
            document: { status: "draft", _meta: { updated_by: "a" } },
            external_refs: [{ source_system: "a" }],
          }),
        });
        return;
      }
      if (m === "GET" && path.endsWith("/versions/2")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            version: 2,
            created_at: "2026-04-24T00:00:02Z",
            document: { status: "approved", _meta: { updated_by: "b" } },
            external_refs: [{ source_system: "b" }],
          }),
        });
        return;
      }
      await route.continue();
    },
    );
    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto(`/#/app/profile/instances/${iid}/history`);
    await expect(page.getByTestId("instance-history-diff-table")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("instance-history-diff-table").locator("tbody tr").first()).toBeVisible();
    await page.getByLabel("Сравнение").selectOption("current");
    await expect(page.getByTestId("instance-history-selected-version")).toBeVisible();
  });

  test("история: одна версия (v1) — при сравнении с previous для v1", async ({ page }) => {
    const iid = "a2000000-0000-0000-0000-000000000001";
    const esc2 = iid.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await page.route(
      new RegExp(`/api/v1/admin/profile/api/v1/entities/${esc2}(/versions/\\d+)?$`, "i"),
      async (route) => {
        const m = route.request().method();
        const path = new URL(route.request().url()).pathname;
        if (m === "GET" && path.endsWith(`/entities/${iid}`)) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ entity_id: iid, version: 1, document: { x: 1 } }),
          });
          return;
        }
        if (m === "GET" && path.endsWith("/versions/1")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              version: 1,
              created_at: "2026-01-01T00:00:00Z",
              document: { x: 1 },
            }),
          });
          return;
        }
        await route.continue();
      },
    );
    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto(`/#/app/profile/instances/${iid}/history`);
    await page.getByRole("button", { name: "View" }).first().click();
    await expect(page.getByTestId("instance-history-diff-unavailable")).toBeVisible({ timeout: 20_000 });
  });

  test("список: ошибка начальной загрузки (GET 500)", async ({ page }) => {
    await page.route("**/api/v1/admin/profile/api/v1/entities/**", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ status: 500, body: "err" });
        return;
      }
      await route.continue();
    });
    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/profile/entities");
    await expect(page.getByTestId("profiles-list-last-error")).toContainText(/500|load failed/i, { timeout: 20_000 });
  });

  test("список: ошибка create (POST 400)", async ({ page }) => {
    const seed = "00000000-0000-0000-0000-000000000001";
    await page.route("**/api/v1/admin/profile/api/v1/entities**", async (route) => {
      const m = route.request().method();
      const url = new URL(route.request().url());
      if (m === "GET" && url.pathname.endsWith(`/v1/entities/${seed}`)) {
        await route.fulfill({ status: 200, contentType: "application/json", body: jsonEntity(seed, 1, { n: 1 }) });
        return;
      }
      if (m === "POST" && url.pathname.endsWith("/v1/entities")) {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ code: "invalid_request" }),
        });
        return;
      }
      await route.continue();
    });
    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/profile/entities");
    await page.getByLabel("Entity type ID").fill("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    await page.getByRole("button", { name: "Create profile" }).click();
    await expect(page.getByTestId("profiles-list-last-error")).toContainText(/400|create failed/i, { timeout: 20_000 });
  });

  test("экземпляры: ошибка update (PUT 409)", async ({ page }) => {
    const sid = "demo-instance";
    await page.route("**/api/v1/admin/profile/api/v1/entities**", async (route) => {
      const m = route.request().method();
      const url = new URL(route.request().url());
      if (m === "GET" && url.pathname.endsWith(`/v1/entities/${sid}`)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: jsonEntity(sid, 1, { p: 1 }),
        });
        return;
      }
      if (m === "PUT" && url.pathname.includes(sid)) {
        await route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ code: "conflict" }) });
        return;
      }
      await route.continue();
    });
    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/overview");
    await page.getByRole("link", { name: "Профиль — экземпляры" }).click();
    await page.getByLabel("Entity type ID").fill("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    await page.getByRole("button", { name: "Update first instance" }).click();
    await expect(page.getByTestId("profile-instances-last-error")).toContainText(/409|update failed/i, { timeout: 20_000 });
  });

  test("конфликты: resolve — ошибка POST", async ({ page }) => {
    const cid = "a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1";
    await page.route("**/api/v1/admin/profile/api/v1/admin/**", async (route) => {
      const m = route.request().method();
      const u = new URL(route.request().url());
      if (m === "GET" && u.pathname.endsWith("profile-conflicts")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: [
              {
                id: cid,
                entity_id: "e1",
                status: "open",
                namespace: "n",
                field_key: "f",
                reason: "r",
                created_at: "2026-01-01T00:00:00Z",
                existing_value: 1,
                incoming_value: 2,
              },
            ],
          }),
        });
        return;
      }
      if (m === "POST" && u.pathname.includes(`/profile-conflicts/${cid}/resolve`)) {
        await route.fulfill({ status: 500, body: "x" });
        return;
      }
      await route.continue();
    });
    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/profile/admin/conflicts");
    await expect(page.getByTestId("conflicts-merge-table")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("conflicts-merge-resolve-btn").click();
    await expect(page.getByTestId("conflicts-merge-last-error")).toContainText(/500|Разрешение/i, { timeout: 20_000 });
  });

  test("конфликты: merge — ошибка POST 400", async ({ page }) => {
    await page.route("**/api/v1/admin/profile/api/v1/admin/**", async (route) => {
      const m = route.request().method();
      const u = new URL(route.request().url());
      if (m === "GET" && u.pathname.endsWith("profile-conflicts")) {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [] }) });
        return;
      }
      if (m === "POST" && u.pathname.includes("/entities/merge")) {
        await route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ error: "bad" }) });
        return;
      }
      await route.continue();
    });
    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/profile/admin/conflicts");
    await page.getByTestId("conflicts-merge-submit-btn").click();
    await expect(page.getByTestId("conflicts-merge-last-error")).toContainText(/400|Merge/i, { timeout: 20_000 });
  });
});
