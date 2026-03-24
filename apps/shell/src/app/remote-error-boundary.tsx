import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  remoteName: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Per-route error boundary that catches remote module load failures and
 * renders a local shell fallback so other routes remain fully functional.
 * Satisfies task 4.3 (D4 in design: shell-controlled failure isolation).
 */
export class RemoteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Production telemetry hook: replace console.error with your logger.
    // eslint-disable-next-line no-console
    console.error(
      `[shell] Remote "${this.props.remoteName}" failed to load:`,
      error,
      info.componentStack,
    );
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div role="alert" aria-live="assertive">
          <h2>
            {this.props.remoteName.charAt(0).toUpperCase() +
              this.props.remoteName.slice(1)}{' '}
            is currently unavailable.
          </h2>
          <p>Other parts of the application are still accessible.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
