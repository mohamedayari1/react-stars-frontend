import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class MarkdownErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ReactMarkdown error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="rounded border border-red-200 bg-red-50 p-4 text-red-500">
            <p className="font-medium">Error rendering markdown content</p>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm">
                Error details
              </summary>
              <pre className="mt-1 overflow-auto rounded bg-red-100 p-2 text-xs">
                {this.state.error?.message}
              </pre>
            </details>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default MarkdownErrorBoundary;
