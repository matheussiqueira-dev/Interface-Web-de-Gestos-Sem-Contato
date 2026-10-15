"use client";

import { XOctagon } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

import { logger } from "@/core/system/logger";

interface GlobalErrorBoundaryProps {
  children: ReactNode;
  /** Called by "Voltar ao início", after the boundary clears its error. */
  onReset?: () => void;
}

interface GlobalErrorBoundaryState {
  hasError: boolean;
}

export class GlobalErrorBoundary extends Component<GlobalErrorBoundaryProps, GlobalErrorBoundaryState> {
  public state: GlobalErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): GlobalErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error("Erro capturado pelo boundary do quadro", {
      message: error.message,
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReset = (): void => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  public render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="ms-container">
        <div className="ms-alert ms-alert--danger" role="alert">
          <XOctagon size={20} strokeWidth={1.75} aria-hidden="true" className="ms-alert__icon" />
          <div>
            <p className="ms-alert__title">O quadro parou de responder.</p>
            <p className="ms-alert__body">
              Suas notas salvas neste navegador continuam guardadas. Volte ao início e abra o quadro de
              novo.
            </p>
            <button type="button" className="ms-btn ms-btn--secondary" onClick={this.handleReset}>
              Voltar ao início
            </button>
          </div>
        </div>
      </div>
    );
  }
}
