import { Component, type ErrorInfo, type ReactNode } from "react";
import { SharedState } from "./shared-ux";

type Props = {
  moduleName: string;
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

  public componentDidCatch(error: Error, _errorInfo: ErrorInfo): void {
    // Keep logging local for now, observability hooks will be added in stage 006.
    console.error(`Widget "${this.props.moduleName}" failed`, error);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <SharedState
          state="error"
          message={`Module "${this.props.moduleName}" is temporarily unavailable.`}
        />
      );
    }
    return this.props.children;
  }
}
