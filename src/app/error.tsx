"use client";

import { XOctagon } from "lucide-react";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="ms-container">
      <div className="ms-alert ms-alert--danger" role="alert">
        <XOctagon size={20} strokeWidth={1.75} aria-hidden="true" className="ms-alert__icon" />
        <div>
          <p className="ms-alert__title">Não foi possível exibir esta página.</p>
          <p className="ms-alert__body">Tente carregar de novo. Se o erro continuar, recarregue o navegador.</p>
          <button type="button" className="ms-btn ms-btn--secondary" onClick={() => reset()}>
            Tentar novamente
          </button>
        </div>
      </div>
    </div>
  );
}
