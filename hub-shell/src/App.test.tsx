import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const keycloakState = vi.hoisted(() => ({
  authState: false,
  loginMock: vi.fn(async () => undefined),
  logoutMock: vi.fn(async () => undefined),
}));

vi.mock("./keycloak", () => ({
  keycloak: {
    get authenticated() {
      return keycloakState.authState;
    },
    login: keycloakState.loginMock,
    logout: keycloakState.logoutMock,
  },
}));

const apiRequestMock = vi.fn();
vi.mock("./api", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

describe("App", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    keycloakState.authState = false;
    keycloakState.loginMock.mockClear();
    keycloakState.logoutMock.mockClear();
    apiRequestMock.mockReset();
  });

  it("renders guest zone when user is not authenticated", () => {
    render(<App />);
    expect(screen.getByText("Login with Keycloak")).toBeInTheDocument();
  });

  it("renders authorized shell and composition widgets", async () => {
    keycloakState.authState = true;
    apiRequestMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        sub: "u-1",
        username: "demo",
        email: "demo@april.local",
        name: "Demo User",
        roles: ["user"],
      }),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("AprilHub Shell")).toBeInTheDocument();
      expect(screen.getByText("Overview")).toBeInTheDocument();
      expect(screen.getByText("Roles")).toBeInTheDocument();
    });
  });

  it("renders forbidden state for /me with 403", async () => {
    keycloakState.authState = true;
    apiRequestMock.mockResolvedValue({ ok: false, status: 403 });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Access denied")).toBeInTheDocument();
    });
  });
});
