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
const authorizedFetchMock = vi.fn();
vi.mock("./api", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
  authorizedFetch: (...args: unknown[]) => authorizedFetchMock(...args),
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
    authorizedFetchMock.mockReset();
    authorizedFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });
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

    renderApp();

    await waitFor(() => {
      expect(screen.getByText("Рабочая зона AprilHub")).toBeInTheDocument();
      expect(screen.getByTestId("theme-scheme-control")).toBeInTheDocument();
      expect(screen.getByRole("navigation", { name: "Основная навигация" })).toBeInTheDocument();
      expect(screen.getByText("Обзор платформы")).toBeInTheDocument();
      expect(screen.getAllByText("Роли доступа").length).toBeGreaterThan(0);
      expect(screen.getByText("Добро пожаловать, Demo User.")).toBeInTheDocument();
      expect(screen.getByText(/Корреляция запроса:/)).toBeInTheDocument();
    });
  });

  it("opens profiles list widget-card from sidebar navigation", async () => {
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
      expect(screen.getByRole("navigation", { name: "Основная навигация" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("link", { name: "Профиль — список" }));

    await waitFor(() => {
      expect(screen.getByTestId("profiles-list-widget-card")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Profiles list widget" })).toBeInTheDocument();
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
