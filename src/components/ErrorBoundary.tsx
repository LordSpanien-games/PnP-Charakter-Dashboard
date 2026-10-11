import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-950/40 border border-red-500/50 rounded-2xl p-6 text-center space-y-4 my-4 font-mono">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-red-200">
              {this.props.fallbackTitle || 'Fehler beim Darstellen dieser Komponente'}
            </h3>
            <p className="text-xs text-red-400/80 mt-1 max-w-md mx-auto">
              {this.state.error?.message || 'Ein unerwarteter Fehler ist aufgetreten.'}
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-lg transition-all"
          >
            <RefreshCw size={14} />
            <span>Erneut versuchen</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
