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
        setError(`Не удалось загрузить модуль "${module.title}".`);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [module]);

  if (isLoading) {
    return <SharedState state="loading" message={`Загружаем модуль "${module.title}"...`} />;
  }
  if (error || !loaded) {
    return <SharedState state="error" message={error || "Модуль недоступен из-за ошибки загрузки."} />;
  }
  const Widget = loaded;
  return <Widget context={context} />;
}
