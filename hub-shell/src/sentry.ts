import * as Sentry from "@sentry/react";

type TelemetryContext = {
  requestId?: string;
  correlationId?: string;
  tenant?: string;
  route?: string;
  moduleName?: string;
  widget?: string;
  roleSet?: string;
};

type RuntimeCaptureOptions = TelemetryContext & {
  mechanism?: "boundary" | "window.onerror" | "unhandledrejection" | "manual";
  extra?: Record<string, unknown>;
};

type HttpCaptureOptions = TelemetryContext & {
  method: string;
  path: string;
  status: number;
};

const SENSITIVE_KEYS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "token",
  "password",
  "secret",
  "session",
]);

const IGNORED_MESSAGE_PATTERNS = [
  /ResizeObserver loop limit exceeded/i,
  /AbortError/i,
  /NetworkError when attempting to fetch resource/i,
  /extension/i,
];

let runtimeContext: TelemetryContext = {};
let globalHandlersInstalled = false;

function toNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    return fallback;
  }
  return parsed;
}

function sanitizeRecord(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeRecord(item));
  }
  if (typeof value !== "object") {
    return value;
  }

  const source = value as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};
  Object.entries(source).forEach(([key, nestedValue]) => {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
      return;
    }
    sanitized[key] = sanitizeRecord(nestedValue);
  });
  return sanitized;
}

function shouldIgnoreMessage(message: string): boolean {
  return IGNORED_MESSAGE_PATTERNS.some((pattern) => pattern.test(message));
}

function resolveTelemetryContext(overrides?: TelemetryContext): TelemetryContext {
  return {
    ...runtimeContext,
    ...(typeof window !== "undefined" ? { route: window.location.pathname } : {}),
    ...overrides,
  };
}

function applyScope(scope: Sentry.Scope, context: TelemetryContext): void {
  scope.setTags({
    route: context.route ?? "unknown",
    tenant: context.tenant ?? "unknown",
    module: context.moduleName ?? "hub-shell",
    widget: context.widget ?? "unknown",
  });
  if (context.requestId) {
    scope.setTag("requestId", context.requestId);
  }
  if (context.correlationId) {
    scope.setTag("correlationId", context.correlationId);
  }
  if (context.roleSet) {
    scope.setTag("roleSet", context.roleSet);
  }
}

export function initializeSentry(): void {
  const dsn = import.meta.env.SENTRY_DSN?.trim();
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.SENTRY_ENVIRONMENT?.trim() || "dev",
    release: import.meta.env.SENTRY_RELEASE?.trim() || "local-dev",
    tracesSampleRate: toNumber(import.meta.env.SENTRY_TRACES_SAMPLE_RATE, 0.1),
    replaysSessionSampleRate: toNumber(import.meta.env.SENTRY_REPLAYS_SESSION_SAMPLE_RATE, 0),
    replaysOnErrorSampleRate: toNumber(import.meta.env.SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE, 1),
    beforeSend(event, hint) {
      const message = hint.originalException instanceof Error ? hint.originalException.message : event.message ?? "";
      if (shouldIgnoreMessage(message)) {
        return null;
      }
      return sanitizeRecord(event) as Sentry.ErrorEvent;
    },
  });
}

export function installGlobalRuntimeHandlers(): void {
  if (globalHandlersInstalled || typeof window === "undefined") {
    return;
  }
  globalHandlersInstalled = true;

  window.addEventListener("error", (event) => {
    if (!event.error) {
      return;
    }
    captureRuntimeError(event.error, {
      mechanism: "window.onerror",
      extra: { filename: event.filename, lineno: event.lineno, colno: event.colno },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    captureRuntimeError(reason, {
      mechanism: "unhandledrejection",
    });
  });
}

export function updateTelemetryContext(context: TelemetryContext): void {
  runtimeContext = {
    ...runtimeContext,
    ...context,
  };
}

export function captureRuntimeError(error: Error, options?: RuntimeCaptureOptions): void {
  const context = resolveTelemetryContext(options);
  if (shouldIgnoreMessage(error.message)) {
    return;
  }
  Sentry.withScope((scope) => {
    applyScope(scope, context);
    scope.setLevel("error");
    scope.setTag("mechanism", options?.mechanism ?? "manual");
    if (options?.extra) {
      scope.setContext("extra", sanitizeRecord(options.extra) as Record<string, unknown>);
    }
    Sentry.captureException(error);
  });
}

export function captureHttpError(options: HttpCaptureOptions): void {
  const context = resolveTelemetryContext(options);
  Sentry.withScope((scope) => {
    applyScope(scope, context);
    scope.setLevel(options.status >= 500 ? "error" : "warning");
    scope.setContext("http", {
      method: options.method,
      path: options.path,
      status: options.status,
    });
    scope.setFingerprint(["http-error", String(options.status), options.path, context.moduleName ?? "hub-shell"]);
    Sentry.captureMessage(`HTTP ${options.status} ${options.method} ${options.path}`);
  });
}
