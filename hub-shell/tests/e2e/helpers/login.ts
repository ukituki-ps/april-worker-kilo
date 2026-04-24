import type { Page } from "@playwright/test";

/** Гостевой хедер → пункт входа в Keycloak (OIDC). */
export async function startLoginFromGuestHeader(page: Page): Promise<void> {
  await page.getByLabel("Меню профиля и настроек").click();
  await page.getByTestId("guest-landing-login-nav").click();
}

async function submitKeycloakCredentials(page: Page, username: string, password: string): Promise<void> {
  await page.locator("#username").waitFor({ state: "visible", timeout: 60_000 });
  await page.locator("#username").fill(username);
  await page.locator("#password").fill(password);
  await page.locator("#kc-login").click();
}

/**
 * Интерактивный вход через Keycloak.
 * Учитывает `check-sso`: иногда сразу открывается форма Keycloak вместо гостевого лендинга.
 */
export async function loginThroughKeycloak(page: Page, username: string, password: string): Promise<void> {
  page.setDefaultTimeout(120_000);
  await page.goto("/", { waitUntil: "domcontentloaded", timeout: 120_000 });

  const authorizedHeading = page.getByRole("heading", { name: "Рабочая зона AprilHub" });
  const guestLanding = page.getByTestId("guest-landing");
  const keycloakUser = page.locator("#username");

  const deadline = Date.now() + 180_000;
  let submitted = false;
  while (Date.now() < deadline && !submitted) {
    if (await authorizedHeading.isVisible().catch(() => false)) {
      return;
    }
    if (await keycloakUser.isVisible().catch(() => false)) {
      await submitKeycloakCredentials(page, username, password);
      submitted = true;
      break;
    }
    if (await guestLanding.isVisible().catch(() => false)) {
      await startLoginFromGuestHeader(page);
      await submitKeycloakCredentials(page, username, password);
      submitted = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  if (!submitted) {
    if (await authorizedHeading.isVisible().catch(() => false)) {
      return;
    }
    throw new Error("loginThroughKeycloak: ни guest-landing, ни форма Keycloak, ни рабочая зона за 180s");
  }
  await authorizedHeading.waitFor({ timeout: 120_000 });
}
