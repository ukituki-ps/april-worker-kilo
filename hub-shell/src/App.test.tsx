import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MantineProvider } from "@mantine/core";
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

describe("App", () => {
  const renderApp = (): ReturnType<typeof render> =>
    render(
      <MantineProvider>
        <App />
      </MantineProvider>,
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

  it("renders guest landing when user is not authenticated", () => {
    renderApp();
    expect(screen.getByTestId("guest-landing")).toBeInTheDocument();
    expect(screen.getByText("Почему команды выбирают AprilHub")).toBeInTheDocument();
    expect(screen.getByText("Ключевые сценарии")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Открыть защищенное рабочее пространство" })).toBeInTheDocument();
  });

  it("starts Keycloak flow from landing CTA", async () => {
    keycloakState.loginMock.mockResolvedValue(undefined);
    renderApp();

    fireEvent.click(screen.getByRole("button", { name: "Открыть защищенное рабочее пространство" }));

    await waitFor(() => {
      expect(keycloakState.loginMock).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("button", { name: "Перенаправляем в Keycloak..." })).toBeDisabled();
    });
  });

  it("shows auth error when Keycloak login start fails", async () => {
    keycloakState.loginMock.mockRejectedValue(new Error("auth endpoint unavailable"));
    renderApp();

    fireEvent.click(screen.getByRole("button", { name: "Открыть защищенное рабочее пространство" }));

    await waitFor(() => {
      expect(screen.getByText("auth endpoint unavailable")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Открыть защищенное рабочее пространство" })).not.toBeDisabled();
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
      expect(screen.getByRole("navigation", { name: "Основная навигация" })).toBeInTheDocument();
      expect(screen.getByText("Обзор платформы")).toBeInTheDocument();
      expect(screen.getAllByText("Роли доступа").length).toBeGreaterThan(0);
      expect(screen.getByText("Добро пожаловать, Demo User.")).toBeInTheDocument();
      expect(screen.getByText(/Корреляция запроса:/)).toBeInTheDocument();
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
