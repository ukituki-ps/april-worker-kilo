import { Alert, Stack } from "@mantine/core";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type ToastTone = "success" | "error";

type ToastItem = {
  id: string;
  tone: ToastTone;
  message: string;
};

type ShellToastApi = {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
};

const ShellToastContext = createContext<ShellToastApi | null>(null);

export function ShellToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [items, setItems] = useState<ToastItem[]>([]);

  const pushToast = useCallback((tone: ToastTone, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setItems((prev) => [...prev, { id, tone, message }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const api = useMemo<ShellToastApi>(
    () => ({
      showSuccess: (message: string) => pushToast("success", message),
      showError: (message: string) => pushToast("error", message),
    }),
    [pushToast],
  );

  return (
    <ShellToastContext.Provider value={api}>
      {children}
      {items.length > 0 ? (
        <div className="shell-toast-stack" aria-live="polite">
          <Stack gap="xs">
            {items.map((t) => (
              <Alert key={t.id} color={t.tone === "success" ? "green" : "red"} variant="light" withCloseButton onClose={() => setItems((p) => p.filter((x) => x.id !== t.id))}>
                {t.message}
              </Alert>
            ))}
          </Stack>
        </div>
      ) : null}
    </ShellToastContext.Provider>
  );
}

export function useShellToast(): ShellToastApi {
  const ctx = useContext(ShellToastContext);
  if (!ctx) {
    throw new Error("useShellToast только внутри ShellToastProvider");
  }
  return ctx;
}
