import React, { Component, ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  name?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.name || "unknown"}]`, error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  handleRestart = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#1e1e1e",
            color: "#e0e0e0",
            fontFamily: "monospace",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠</div>
          <h1 style={{ fontSize: "1.2rem", fontWeight: 600, margin: "0 0 0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#888", fontSize: "0.85rem", maxWidth: 480, lineHeight: 1.5, margin: "0 0 0.5rem" }}>
            Void Notes encountered an unexpected error.
          </p>
          <details style={{ fontSize: "0.75rem", color: "#666", marginBottom: "1.5rem", maxWidth: 480 }}>
            <summary style={{ cursor: "pointer" }}>Error details</summary>
            <pre style={{ marginTop: "0.5rem", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {this.state.error?.message || "Unknown error"}
            </pre>
          </details>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={this.handleReload}
              style={{
                padding: "0.5rem 1.25rem",
                background: "#8a70d6",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontFamily: "monospace",
                fontSize: "0.85rem",
              }}
            >
              Try Again
            </button>
            <button
              onClick={this.handleRestart}
              style={{
                padding: "0.5rem 1.25rem",
                background: "transparent",
                color: "#888",
                border: "1px solid #333",
                borderRadius: 4,
                cursor: "pointer",
                fontFamily: "monospace",
                fontSize: "0.85rem",
              }}
            >
              Restart App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
