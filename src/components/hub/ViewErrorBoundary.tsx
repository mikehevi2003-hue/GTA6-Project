"use client";

import React from "react";
import type { Language } from "@/types/vicelink";

export interface ViewErrorBoundaryProps {
  viewName: string;
  lang: Language;
  onFallbackView?: () => void;
  children: React.ReactNode;
}

type ViewErrorBoundaryState = {
  hasError: boolean;
  errorMessage: string;
};

export default class ViewErrorBoundary extends React.Component<
  ViewErrorBoundaryProps,
  ViewErrorBoundaryState
> {
  constructor(props: ViewErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): ViewErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || "Module fault isolated."
    };
  }

  componentDidUpdate(prevProps: ViewErrorBoundaryProps) {
    if (prevProps.viewName !== this.props.viewName && this.state.hasError) {
      this.setState({ hasError: false, errorMessage: "" });
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isEs = this.props.lang === "es";

    return (
      <section className="view active" role="alert">
        <div
          className="paywall-box"
          style={{
            maxWidth: 540,
            margin: "24px auto",
            borderColor: "rgba(244, 63, 94, 0.5)"
          }}
        >
          <span className="brand-badge">
            🛡️ {isEs ? "AISLAMIENTO DE FALLOS ACTIVO" : "FAULT ISOLATION SHIELD"}
          </span>
          <h3 style={{ marginTop: 12 }}>
            {isEs
              ? `El módulo "${this.props.viewName}" encontró un error temporal`
              : `Module "${this.props.viewName}" encountered a temporary error`}
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
            {isEs
              ? "El resto de ViceLink sigue operativo y tus datos en la nube están seguros."
              : "The rest of ViceLink remains operational and your cloud save data is unaffected."}
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 14 }}>
            <button
              type="button"
              className="btn-pro"
              style={{ width: "auto" }}
              onClick={() => this.setState({ hasError: false, errorMessage: "" })}
            >
              ↻ {isEs ? "Reintentar Módulo" : "Reload Module"}
            </button>
            {this.props.onFallbackView && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  this.setState({ hasError: false, errorMessage: "" });
                  this.props.onFallbackView?.();
                }}
              >
                🎮 {isEs ? "Volver a Trucos" : "Return to Cheats"}
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }
}
