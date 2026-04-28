import { Component, type ErrorInfo, type ReactNode } from "react";
import { SharedState } from "./shared-ux";
import { captureRuntimeError } from "./sentry";

type Props = {
  moduleName: string;
  tenant?: string;
  correlationId?: string;
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class CompositionErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    captureRuntimeError(error, {
      mechanism: "boundary",
      moduleName: this.props.moduleName,
      widget: this.props.moduleName,
      tenant: this.props.tenant,
      correlationId: this.props.correlationId,
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });
    console.error(`Widget "${this.props.moduleName}" failed`, error);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <SharedState
          state="error"
          message={`Модуль "${this.props.moduleName}" временно недоступен.`}
        />
      );
    }
    return this.props.children;
  }
}
