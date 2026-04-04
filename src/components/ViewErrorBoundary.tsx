import { Component, type ErrorInfo, type ReactNode } from "react";

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

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-md rounded-xl border border-danger/20 bg-danger/5 p-6 text-center mt-8">
          <div className="text-sm font-semibold text-danger mb-2">
            {this.props.viewName ?? "This view"} encountered an error
          </div>
          <p className="text-xs text-text-secondary mb-4">
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={this.handleRetry}
              className="rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-accent-hover transition-colors"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg border border-border bg-bg-secondary px-4 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
