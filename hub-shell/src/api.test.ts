import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "./api";

const keycloakState = vi.hoisted(() => ({
  authenticated: true,
  token: "token-1",
  loginMock: vi.fn(async () => undefined),
  updateTokenMock: vi.fn(async () => true),
  captureHttpErrorMock: vi.fn(),
}));

vi.mock("./keycloak", () => ({
  keycloak: {
    get authenticated() {
      return keycloakState.authenticated;
    },
    get token() {
      return keycloakState.token;
    },
    login: keycloakState.loginMock,
    updateToken: keycloakState.updateTokenMock,
  },
}));

vi.mock("./sentry", () => ({
  captureHttpError: keycloakState.captureHttpErrorMock,
}));

const notifyKeycloakTokenRotatedMock = vi.hoisted(() => vi.fn());

vi.mock("./keycloak-token-subscribers", () => ({
  notifyKeycloakTokenRotated: notifyKeycloakTokenRotatedMock,
}));

describe("apiRequest", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    keycloakState.authenticated = true;
    keycloakState.token = "token-1";
    keycloakState.loginMock.mockClear();
    keycloakState.updateTokenMock.mockClear();
    keycloakState.captureHttpErrorMock.mockClear();
    notifyKeycloakTokenRotatedMock.mockClear();
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("calls keycloak login when session is not authenticated", async () => {
    keycloakState.authenticated = false;

    await expect(apiRequest("/v1/me")).rejects.toThrow("Unauthenticated session");
    expect(keycloakState.loginMock).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("refreshes token and retries once on 401", async () => {
    const unauthorized = new Response(null, { status: 401 });
    const success = new Response(JSON.stringify({ ok: true }), { status: 200 });
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(unauthorized)
      .mockResolvedValueOnce(success);

    await apiRequest("/v1/me");

    expect(keycloakState.updateTokenMock).toHaveBeenCalledWith(30);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(notifyKeycloakTokenRotatedMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to login when refresh fails on 401", async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(new Response(null, { status: 401 }));
    keycloakState.updateTokenMock.mockResolvedValue(false);

    await expect(apiRequest("/v1/me")).rejects.toThrow("Token refresh failed");
    expect(keycloakState.loginMock).toHaveBeenCalledTimes(1);
  });

  it("captures telemetry on 404 response", async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(new Response(null, { status: 404 }));

    await apiRequest("/v1/me");

    expect(keycloakState.captureHttpErrorMock).toHaveBeenCalledTimes(1);
  });
});
