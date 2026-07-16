import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "./primitives";

interface Props {
  children: ReactNode;
  viewName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ViewErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[RuneWise] ${this.props.viewName ?? "View"} crashed:`, error, info);
  }

  componentDidUpdate(prevProps: Props) {
    // Clear a latched error when the shell navigates to a different tool so a
    // crash in one view never strands the next destination.
    if (this.state.hasError && prevProps.viewName !== this.props.viewName) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="mx-auto max-w-md rounded-xl border border-danger/20 bg-danger/5 p-6 text-center mt-8">
          <div className="text-sm font-semibold text-danger mb-2">
            {this.props.viewName ?? "This view"} encountered an error
          </div>
          <p className="text-xs text-text-secondary mb-4">
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="primary" onClick={this.handleRetry}>
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()}>
              Reload App
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
