import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production this would forward to an error-tracking service.
    // eslint-disable-next-line no-console
    console.error('Unhandled UI error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-light p-6 text-center dark:bg-surface-dark">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-status-absent/10 text-status-absent">
            <AlertTriangle size={26} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Something went wrong</h1>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            The application hit an unexpected error. Try reloading the page — if the problem continues, contact
            your administrator.
          </p>
          <button onClick={this.handleReset} className="btn-primary">
            Reload application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
