import type { ShellUserContext } from "./types";

type WidgetProps = {
  context: ShellUserContext;
};

export function OverviewWidget({ context }: WidgetProps) {
  return (
    <article className="widget-card">
      <h3>Overview</h3>
      <p>Welcome, {context.user.name || context.user.username}.</p>
      <p>Correlation: {context.correlationId}</p>
    </article>
  );
}

export function RolesWidget({ context }: WidgetProps) {
  return (
    <article className="widget-card">
      <h3>Roles</h3>
      <p>{context.roles.join(", ") || "No roles"}</p>
    </article>
  );
}

export function BrokenWidget(_props: WidgetProps): JSX.Element {
  throw new Error("Widget crash");
}
