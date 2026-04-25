import { CompositionErrorBoundary } from "./composition-error-boundary";
import { CompositionLoader } from "./composition-loader";
import { shellRegistry } from "./composition-registry";
import { SharedState } from "./shared-ux";
import type { ShellUserContext } from "./types";

type Props = {
  context: ShellUserContext;
};

export function CompositionLayer({ context }: Props) {
  const allowedModules = shellRegistry.filter((module) => {
    if (!module.requiresRole) {
      return true;
    }
    return context.roles.includes(module.requiresRole);
  });

  if (allowedModules.length === 0) {
    return <SharedState state="forbidden" message="Для текущего набора ролей нет доступных модулей оболочки." />;
  }

  return (
    <section className="composition-grid">
      {allowedModules.map((module) => (
        <CompositionErrorBoundary
          key={module.id}
          moduleName={module.title}
          tenant={context.orgScope}
          correlationId={context.correlationId}
        >
          <CompositionLoader module={module} context={context} />
        </CompositionErrorBoundary>
      ))}
    </section>
  );
}
