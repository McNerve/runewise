import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "./primitives";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** When this changes, a latched error is cleared (e.g. on navigation), so a
   *  crash in one view doesn't strand the whole app until a manual reload. */
  resetKey?: string | number;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("RuneWise view crashed", error, info);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="mx-auto max-w-2xl rounded-2xl border border-danger/25 bg-danger/8 p-6 text-center shadow-lg">
          <div className="text-[10px] uppercase tracking-[0.2em] text-danger/70">
            View Error
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            RuneWise hit an unexpected problem
          </h2>
          <p className="mt-3 text-sm leading-6 text-text-secondary">
            This view crashed while rendering. Your saved data is still intact —
            reload should get you moving again.
          </p>
          <Button variant="primary" size="md" onClick={this.handleReload} className="mt-5">
            Reload RuneWise
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
