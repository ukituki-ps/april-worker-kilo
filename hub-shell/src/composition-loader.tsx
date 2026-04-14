import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import type { CompositionModule } from "./composition-registry";
import type { ShellUserContext } from "./types";
import { SharedState } from "./shared-ux";

type Props = {
  module: CompositionModule;
  context: ShellUserContext;
};

export function CompositionLoader({ module, context }: Props) {
  const [loaded, setLoaded] = useState<ComponentType<{ context: ShellUserContext }> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setIsLoading(true);
    setError("");
    void module
      .loader()
      .then((next) => {
        setLoaded(() => next.default);
      })
      .catch(() => {
        setError(`Failed to load "${module.title}"`);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [module]);

  if (isLoading) {
    return <SharedState state="loading" message={`Loading ${module.title}...`} />;
  }
  if (error || !loaded) {
    return <SharedState state="error" message={error || "Module failed to load"} />;
  }
  const Widget = loaded;
  return <Widget context={context} />;
}
