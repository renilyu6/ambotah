import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="error-boundary"
          style={{
            padding: "2rem",
            textAlign: "center",
            background: "#f8f9fa",
            borderRadius: "8px",
            margin: "2rem",
          }}
        >
          <h2 style={{ color: "var(--error-color)" }}>Something went wrong</h2>
          <p style={{ color: "#666", marginBottom: "1rem" }}>
            We're sorry, but something unexpected happened.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <details style={{ marginTop: "1rem", textAlign: "left" }}>
              <summary>Error Details (Development)</summary>
              <pre
                style={{
                  background: "#f1f1f1",
                  padding: "1rem",
                  borderRadius: "4px",
                  fontSize: "12px",
                  overflow: "auto",
                }}
              >
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
