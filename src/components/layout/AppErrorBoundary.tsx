import { Component } from 'react';
import type { ErrorInfo as ReactErrorInfo, ReactNode } from 'react';

interface State {
  failed: boolean;
}

/** Last-resort boundary so an unexpected render error never leaves a blank page. */
export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ReactErrorInfo): void {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="dashboard" role="alert">
          <h1>Something went wrong</h1>
          <p>Reload the page to try again.</p>
        </main>
      );
    }
    return this.props.children;
  }
}
