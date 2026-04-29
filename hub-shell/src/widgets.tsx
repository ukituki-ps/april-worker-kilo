import type { JSX } from "react";
import type { ShellUserContext } from "./types";

type WidgetProps = {
  context: ShellUserContext;
};

export function OverviewWidget({ context }: WidgetProps) {
  return (
    <article className="widget-card" data-testid="shell-overview-widget">
      <h3 id="overview">Обзор</h3>
      <p>Добро пожаловать, {context.user.name || context.user.username}.</p>
      <p>Корреляция запроса: {context.correlationId}</p>
    </article>
  );
}

export function RolesWidget({ context }: WidgetProps) {
  return (
    <article className="widget-card" data-testid="shell-roles-widget">
      <h3 id="roles">Роли доступа</h3>
      <p data-testid="shell-roles-text">{context.roles.join(", ") || "Роли отсутствуют"}</p>
    </article>
  );
}

export function BrokenWidget(_props: WidgetProps): JSX.Element {
  throw new Error("Widget crash");
}
