import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("renders guest landing when user is not authenticated", () => {
    render(<App />);
    expect(screen.getByTestId("guest-landing")).toBeInTheDocument();
    expect(screen.getByText("Why teams use AprilHub")).toBeInTheDocument();
    expect(screen.getByText("Key scenarios")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open secure workspace" })).toBeInTheDocument();
  });

  it("starts Keycloak flow from landing CTA", async () => {
    keycloakState.loginMock.mockResolvedValue(undefined);
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Open secure workspace" }));

    await waitFor(() => {
      expect(keycloakState.loginMock).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("button", { name: "Redirecting to Keycloak..." })).toBeDisabled();
    });
  });

  it("shows auth error when Keycloak login start fails", async () => {
    keycloakState.loginMock.mockRejectedValue(new Error("auth endpoint unavailable"));
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Open secure workspace" }));

    await waitFor(() => {
      expect(screen.getByText("auth endpoint unavailable")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Open secure workspace" })).not.toBeDisabled();
    });
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
