import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AprilProviders } from "@april/ui";
import App from "./App";

const keycloakState = vi.hoisted(() => ({
  authState: false,
  loginMock: vi.fn(async () => undefined),
  logoutMock: vi.fn(async () => undefined),
  createAccountUrlMock: vi.fn(() => "http://localhost/auth/realms/april/account"),
}));

vi.mock("./keycloak", () => ({
  keycloak: {
    get authenticated() {
      return keycloakState.authState;
    },
    login: keycloakState.loginMock,
    logout: keycloakState.logoutMock,
    createAccountUrl: keycloakState.createAccountUrlMock,
  },
}));

const apiRequestMock = vi.fn();
vi.mock("./api", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

function openGuestProfileMenu(): void {
  fireEvent.click(screen.getByLabelText("Меню профиля и настроек"));
}

describe("App", () => {
  const renderApp = (): ReturnType<typeof render> =>
    render(
      <AprilProviders>
        <App />
      </AprilProviders>,
    );

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    keycloakState.authState = false;
    keycloakState.loginMock.mockClear();
    keycloakState.logoutMock.mockClear();
    keycloakState.createAccountUrlMock.mockClear();
    apiRequestMock.mockReset();
  });

  it("renders guest landing when user is not authenticated", async () => {
    renderApp();
    expect(screen.getByTestId("guest-landing")).toBeInTheDocument();
    expect(screen.getByTestId("landing-header")).toBeInTheDocument();
    expect(screen.getByTestId("theme-scheme-control")).toBeInTheDocument();
    expect(screen.getByTestId("landing-ecosystem-cards")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Экосистема April" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Экосистема инструментов управления компанией:" })).toBeInTheDocument();
    expect(screen.getAllByText("Plan").length).toBe(5);
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByTestId("landing-faq")).toBeInTheDocument();
    openGuestProfileMenu();
    expect(await screen.findByTestId("guest-landing-login-nav")).toBeInTheDocument();
  });

  it("starts Keycloak flow from header profile menu", async () => {
    keycloakState.loginMock.mockResolvedValue(undefined);
    renderApp();

    openGuestProfileMenu();
    fireEvent.click(await screen.findByTestId("guest-landing-login-nav"));

    await waitFor(() => {
      expect(keycloakState.loginMock).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("guest-landing-login-nav")).toBeDisabled();
    });
  });

  it("shows auth error when Keycloak login start fails", async () => {
    keycloakState.loginMock.mockRejectedValue(new Error("auth endpoint unavailable"));
    renderApp();

    openGuestProfileMenu();
    fireEvent.click(await screen.findByTestId("guest-landing-login-nav"));

    await waitFor(() => {
      expect(screen.getByText("auth endpoint unavailable")).toBeInTheDocument();
    });
    openGuestProfileMenu();
    await waitFor(() => {
      expect(screen.getByTestId("guest-landing-login-nav")).not.toBeDisabled();
    });
  });

<<<<<<< HEAD
  it("renders authorized shell with auth-only placeholder", async () => {
=======
  it("renders authorized shell in auth-only mode", async () => {
>>>>>>> parent of 41f02aa (Merge pull request #74 from ukituki-ps/feature/045-profiles-sidebar-widget)
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

    renderApp();

    await waitFor(() => {
      expect(screen.getByText("Рабочая зона AprilHub")).toBeInTheDocument();
      expect(screen.getByTestId("theme-scheme-control")).toBeInTheDocument();
      const nav = screen.getByRole("navigation", { name: "Основная навигация" });
      expect(nav).toBeInTheDocument();
      expect(nav.querySelectorAll("a")).toHaveLength(0);
      expect(screen.getByTestId("authorized-empty-placeholder")).toBeInTheDocument();
<<<<<<< HEAD
=======
      expect(screen.getByText("Продуктовые разделы временно отключены в рамках auth-only режима.")).toBeInTheDocument();
>>>>>>> parent of 41f02aa (Merge pull request #74 from ukituki-ps/feature/045-profiles-sidebar-widget)
    });
  });

  it("renders forbidden state for /me with 403", async () => {
    keycloakState.authState = true;
    apiRequestMock.mockResolvedValue({ ok: false, status: 403 });

    renderApp();

    await waitFor(() => {
      expect(screen.getByText("Рабочая зона AprilHub")).toBeInTheDocument();
      expect(screen.getByText("Доступ запрещен")).toBeInTheDocument();
    });
  });
});
