import type { ReactNode } from "react";
import type { SharedViewState } from "./types";

type SharedStateProps = {
  state: SharedViewState;
  message?: string;
  action?: ReactNode;
};

const titleByState: Record<SharedViewState, string> = {
  loading: "Loading",
  empty: "Empty",
  error: "Error",
  forbidden: "Access denied",
};

export function SharedState({ state, message, action }: SharedStateProps) {
  return (
    <section className={`state state-${state}`}>
      <h3>{titleByState[state]}</h3>
      {message && <p>{message}</p>}
      {action}
    </section>
  );
}
