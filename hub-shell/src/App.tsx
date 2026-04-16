import { useEffect, useMemo, useState } from "react";
import { authConfig } from "./auth";
import { apiRequest } from "./api";
import { AppShell } from "./app-shell";
import { CompositionLayer } from "./composition-layer";
import { keycloak } from "./keycloak";
import { SharedState } from "./shared-ux";
import type { ShellUserContext, UserProfile } from "./types";
import { buildShellUserContext } from "./user-context";
import "./app.css";

type AuthZone = "guest" | "transition" | "authorized" | "forbidden";

type AppProps = {
  authInitError?: string;
};

const valueHighlights = [
  {
    title: "Единое рабочее пространство",
    description: "Единая точка входа к дашбордам, процессам и диагностике сервисов без переключения между портами.",
  },
  {
    title: "Доступ через идентификацию",
    description: "Авторизация делегирована ролям Keycloak, поэтому выдача и отзыв доступов остаются централизованными.",
  },
  {
    title: "Прозрачная эксплуатация",
    description: "Статус агрегации, корреляционные метаданные и runtime-контекст собраны в одном интерфейсе.",
  },
];

const keyScenarios = [
  "Контролировать состояние сервисов через агрегированный дашборд.",
  "Открывать виджеты композиции после успешного входа через Keycloak.",
  "Проверять identity и role-gates через тот же ingress-путь.",
];

export default function App({ authInitError = "" }: AppProps) {
  const [me, setMe] = useState<UserProfile | null>(null);
  const [zone, setZone] = useState<AuthZone>(keycloak.authenticated ? "transition" : "guest");
  const [transitionReason, setTransitionReason] = useState<string>("Проверяем существующую сессию Keycloak...");
  const [error, setError] = useState<string>(authInitError);
  const [isLoginStarting, setIsLoginStarting] = useState<boolean>(false);

  const startLoginFlow = async (): Promise<void> => {
    setIsLoginStarting(true);
    setError("");
    try {
      await keycloak.login();
    } catch (loginError) {
      setIsLoginStarting(false);
      setError(loginError instanceof Error ? loginError.message : "Не удалось запустить поток входа через Keycloak.");
    }
  };

  useEffect(() => {
    if (!keycloak.authenticated) {
      setZone("guest");
      return;
    }

    const loadData = async (): Promise<void> => {
      setZone("transition");
      setTransitionReason("Возвращаемся от провайдера идентификации и инициализируем пользовательский контекст...");
      setError("");

      const meResponse = await apiRequest("/v1/me");
      if (!meResponse.ok) {
        if (meResponse.status === 403) {
          setZone("forbidden");
          return;
        }
        setError(`Не удалось загрузить профиль: ${meResponse.status}`);
        setZone("guest");
        return;
      }
      setMe((await meResponse.json()) as UserProfile);
      setZone("authorized");
    };

    void loadData().catch((loadError: unknown) => {
      setZone("guest");
      setError(loadError instanceof Error ? loadError.message : "Непредвиденная ошибка авторизации в runtime.");
    });
  }, []);

  const context: ShellUserContext | null = useMemo(() => (me ? buildShellUserContext(me) : null), [me]);

  if (zone === "guest") {
    return (
      <main className="zone-container guest-landing" data-testid="guest-landing">
        <section className="landing-hero">
          <p className="landing-eyebrow">Платформа AprilHub</p>
          <h1>AprilHub Shell</h1>
          <p>
            Продуктовый лендинг AprilHub для единого ingress: изучите ценность платформы и перейдите в авторизованную
            рабочую зону через активный поток Keycloak.
          </p>
          <div className="landing-actions">
            <button type="button" onClick={() => void startLoginFlow()} disabled={isLoginStarting}>
              {isLoginStarting ? "Перенаправляем в Keycloak..." : "Открыть защищенное рабочее пространство"}
            </button>
            <span className="landing-note">Точка входа: {window.location.origin}/auth</span>
          </div>
        </section>

        <section className="landing-section">
          <h2>Почему команды выбирают AprilHub</h2>
          <div className="landing-cards">
            {valueHighlights.map((highlight) => (
              <article key={highlight.title} className="landing-card">
                <h3>{highlight.title}</h3>
                <p>{highlight.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section">
          <h2>Ключевые сценарии</h2>
          <ul className="landing-scenarios">
            {keyScenarios.map((scenario) => (
              <li key={scenario}>{scenario}</li>
            ))}
          </ul>
        </section>

        <small className="landing-meta">
          {authConfig.realm} · {authConfig.clientId} · {authConfig.apiBaseUrl}
        </small>
        {error && <SharedState state="error" message={error} />}
      </main>
    );
  }

  if (zone === "transition") {
    return (
      <main className="zone-container">
        <SharedState state="loading" message={transitionReason} />
      </main>
    );
  }

  if (zone === "forbidden") {
    return (
      <main className="zone-container">
        <SharedState
          state="forbidden"
          message="Текущая учетная запись авторизована, но не имеет доступа к bootstrap endpoint оболочки."
          action={
            <button type="button" onClick={() => void keycloak.logout()}>
              Выйти
            </button>
          }
        />
      </main>
    );
  }

  if (!context) {
    return <SharedState state="empty" message="Авторизованная сессия найдена, но пользовательский контекст не инициализирован." />;
  }

  return (
    <AppShell context={context} onLogout={() => void keycloak.logout()}>
      <CompositionLayer context={context} />
      {error && <SharedState state="error" message={error} />}
    </AppShell>
  );
}
