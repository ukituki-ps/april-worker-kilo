import { expect, test } from "@playwright/test";
import { loginThroughKeycloak } from "./helpers/login";

const privilegedUser = process.env.PLAYWRIGHT_USER ?? "april-dev";
const privilegedPass = process.env.PLAYWRIGHT_PASSWORD ?? "april-dev-pass";

/**
 * @smoke Критичный путь виджетов 4a с перехватом BFF (`page.route`) — быстрый регресс UI без зависимости от AprilProfile upstream.
 */
test.describe("AprilProfile widgets в Hub (@smoke, stubs)", () => {
  test("рендерит profile widget и фиксирует onSaveSuccess", async ({ page }) => {
    const entityTypeId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const missingEntityId = "00000000-0000-0000-0000-000000000001";
    const createdEntityId = "11111111-1111-1111-1111-111111111111";

    await page.route("**/api/v1/admin/profile/api/v1/entities**", async (route) => {
      const request = route.request();
      const method = request.method();
      const url = new URL(request.url());

      if (method === "POST" && url.pathname.endsWith("/v1/entities")) {
        const body = JSON.parse(request.postData() ?? "{}") as { entity_type_id?: string };
        if (body.entity_type_id !== entityTypeId) {
          await route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({ code: "invalid_request", message: "unexpected entity_type_id in test stub" }),
          });
          return;
        }

        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            entity_id: createdEntityId,
            version: 1,
            document: { tenant_id: "default" },
          }),
        });
        return;
      }

      if (method === "PUT") {
        const match = url.pathname.match(/\/v1\/entities\/([^/]+)\/?$/);
        const entityId = match?.[1];
        if (!entityId) {
          await route.continue();
          return;
        }

        if (entityId === missingEntityId) {
          await route.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({ code: "entity_not_found", message: "stub: missing entity" }),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            entity_id: entityId,
            version: 2,
            document: {
              tenant_id: "default",
            },
          }),
        });
        return;
      }

      await route.continue();
    });

    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/overview");
    await expect(page.getByRole("heading", { name: "Обзор" })).toBeVisible();
    await page.getByRole("link", { name: "Профиль — карточка" }).click();
    await expect(page.getByTestId("profile-domain-shell")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Профиль (виджет)" })).toBeVisible();
    await page.getByRole("button", { name: "Сохранить профиль" }).click();
    await expect(page.getByTestId("profile-widget-save-success")).toContainText("onSaveSuccess");
  });

  test("deep-link на карточку профиля открывает виджетный слот", async ({ page }) => {
    const entityId = "00000000-0000-0000-0000-000000000001";
    const deepPath = `/#/app/profile/entities/${entityId}/card`;

    await page.route("**/api/v1/admin/profile/api/v1/entities**", async (route) => {
      const request = route.request();
      const method = request.method();
      const url = new URL(request.url());

      if (method === "POST" && url.pathname.endsWith("/v1/entities")) {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            entity_id: "11111111-1111-1111-1111-111111111111",
            version: 1,
            document: { tenant_id: "default" },
          }),
        });
        return;
      }

      if (method === "PUT") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            entity_id: entityId,
            version: 2,
            document: { tenant_id: "default" },
          }),
        });
        return;
      }

      await route.continue();
    });

    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto(deepPath);
    await expect(page.getByTestId("profile-domain-shell")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Профиль (виджет)" })).toBeVisible();
  });

  test("рендерит profiles list widget и выполняет create через BFF префикс", async ({ page }) => {
    const listEntityId = "00000000-0000-0000-0000-000000000001";
    const createdEntityId = "22222222-2222-2222-2222-222222222222";
    const entityTypeId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

    await page.route("**/api/v1/admin/profile/api/v1/entities**", async (route) => {
      const request = route.request();
      const method = request.method();
      const url = new URL(request.url());

      if (method === "GET" && url.pathname.endsWith(`/v1/entities/${listEntityId}`)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            entity_id: listEntityId,
            entity_type_id: entityTypeId,
            version: 1,
            created_at: "2026-04-24T00:00:00Z",
            document: { name: "Demo profile" },
          }),
        });
        return;
      }

      if (method === "POST" && url.pathname.endsWith("/v1/entities")) {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            entity_id: createdEntityId,
            entity_type_id: entityTypeId,
            version: 1,
            created_at: "2026-04-24T00:01:00Z",
            document: { name: "Created from hub shell" },
          }),
        });
        return;
      }

      await route.continue();
    });

    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/overview");
    await page.getByRole("link", { name: "Профиль — список" }).click();
    await expect(page.getByRole("heading", { name: "Profiles list widget" })).toBeVisible();
    await page.getByLabel("Entity type ID").fill(entityTypeId);
    await page.getByRole("button", { name: "Create profile" }).click();
    await expect(page.getByTestId("profiles-list-last-action")).toContainText("created");
  });

  test("выполняет update экземпляра и проверяет историю версий через host", async ({ page }) => {
    const instanceId = "demo-instance";
    const createdEntityId = "33333333-3333-3333-3333-333333333333";
    const entityTypeId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    let currentVersion = 1;
    const versions: Record<number, Record<string, unknown>> = {
      1: {
        profile_id: "00000000-0000-0000-0000-000000000001",
        status: "draft",
        _meta: { updated_by: "operator-v1" },
      },
    };

    await page.route("**/api/v1/admin/profile/api/v1/entities**", async (route) => {
      const request = route.request();
      const method = request.method();
      const url = new URL(request.url());

      if (method === "GET" && url.pathname.endsWith(`/v1/entities/${instanceId}`)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            entity_id: instanceId,
            entity_type_id: entityTypeId,
            version: currentVersion,
            created_at: "2026-04-24T00:00:00Z",
            document: versions[currentVersion],
          }),
        });
        return;
      }

      if (method === "POST" && url.pathname.endsWith("/v1/entities")) {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            entity_id: createdEntityId,
            entity_type_id: entityTypeId,
            version: 1,
            created_at: "2026-04-24T00:01:00Z",
            document: { profile_id: "00000000-0000-0000-0000-000000000001" },
          }),
        });
        return;
      }

      if (method === "PUT" && url.pathname.endsWith(`/v1/entities/${instanceId}`)) {
        currentVersion = 2;
        versions[2] = {
          profile_id: "00000000-0000-0000-0000-000000000001",
          status: "approved",
          _meta: { updated_by: "operator-v2" },
        };
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            entity_id: instanceId,
            entity_type_id: entityTypeId,
            version: currentVersion,
            created_at: "2026-04-24T00:02:00Z",
            document: versions[currentVersion],
          }),
        });
        return;
      }

      const versionMatch = url.pathname.match(/\/v1\/entities\/demo-instance\/versions\/(\d+)$/);
      if (method === "GET" && versionMatch) {
        const version = Number(versionMatch[1]);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            entity_id: instanceId,
            entity_type_id: entityTypeId,
            version,
            created_at: `2026-04-24T00:0${version}:00Z`,
            document: versions[version] ?? versions[1],
            external_refs: [{ source_system: "bff-smoke" }],
          }),
        });
        return;
      }

      await route.continue();
    });

    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/overview");
    await page.getByRole("link", { name: "Профиль — экземпляры" }).click();
    await expect(page.getByRole("heading", { name: "Profile instances widget" })).toBeVisible();
    await page.getByLabel("Entity type ID").fill(entityTypeId);
    await page.getByRole("button", { name: "Create instance" }).click();
    await expect(page.getByTestId("profile-instances-last-action")).toContainText("created");
    await page.getByRole("button", { name: "Update first instance" }).click();
    await expect(page.getByTestId("profile-instances-last-action")).toContainText("updated");

    await page.getByRole("link", { name: "Профиль — история экземпляра" }).click();
    await expect(page.getByRole("heading", { name: "История экземпляра" })).toBeVisible();
    await expect(page.getByTestId("instance-history-selected-version")).toContainText("v2");
    await expect(page.getByTestId("instance-history-diff-table")).toContainText("status");
  });

  test("админ: очередь конфликтов, resolve и merge через BFF (stubs)", async ({ page }) => {
    const conflictId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const entityId = "dddddddd-dddd-dddd-dddd-dddddddddddd";

    const adminProfileApiUrl = (raw: string): boolean => {
      try {
        const u = new URL(raw);
        return u.pathname.includes("/api/v1/admin/profile/api/v1/admin/");
      } catch {
        return false;
      }
    };

    await page.route(adminProfileApiUrl, async (route) => {
      const request = route.request();
      const method = request.method();
      const url = new URL(request.url());

      if (method === "GET" && url.pathname.endsWith("/v1/admin/profile-conflicts")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: [
              {
                id: conflictId,
                entity_id: entityId,
                status: "open",
                namespace: "default",
                field_key: "status",
                existing_value: "draft",
                incoming_value: "approved",
                existing_source: "a",
                incoming_source: "b",
                reason: "authority_mismatch",
                created_at: "2026-04-24T12:00:00Z",
              },
            ],
          }),
        });
        return;
      }

      if (method === "POST" && url.pathname.includes(`/v1/admin/profile-conflicts/${conflictId}/resolve`)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            entity_id: entityId,
            version: 3,
          }),
        });
        return;
      }

      if (method === "POST" && url.pathname.endsWith("/v1/admin/entities/merge")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            target_entity_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            target_version: 2,
            source_entity_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            document: {},
          }),
        });
        return;
      }

      await route.continue();
    });

    await loginThroughKeycloak(page, privilegedUser, privilegedPass);
    await page.goto("/#/app/overview");
    await page.getByRole("link", { name: "Профиль — конфликты и merge" }).click();
    await expect(page.getByTestId("conflicts-merge-host-card")).toBeVisible();
    await expect(page.getByTestId("conflicts-merge-table")).toBeVisible();
    await page.getByRole("button", { name: "Разрешить выбранный конфликт" }).click();
    await expect(page.getByTestId("conflicts-merge-last-action")).toContainText("resolve:");
    await page.getByRole("button", { name: "Выполнить merge" }).click();
    await expect(page.getByTestId("conflicts-merge-last-action")).toContainText("merge:");
  });
});
