import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorPage } from "./ErrorPage";

type Props = { children: ReactNode };

type State = {
  error: Error | null;
  componentStack: string | null;
};

/**
 * Catch-all React error boundary. Renders {@link ErrorPage}, which reports to
 * PostHog. Keeps the rest of the shell from white-screening on render crashes.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null, componentStack: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({
      error,
      componentStack: info.componentStack ?? null,
    });
  }

  private reset = () => {
    this.setState({ error: null, componentStack: null });
    window.location.reload();
  };

  render() {
    const { error, componentStack } = this.state;
    if (error) {
      return (
        <ErrorPage
          error={error}
          componentStack={componentStack}
          onRetry={this.reset}
        />
      );
    }
    return this.props.children;
  }
}
