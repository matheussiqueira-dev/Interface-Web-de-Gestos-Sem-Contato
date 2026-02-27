"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="error-overlay">
          <div className="error-card glass">
            <h2>Erro global</h2>
            <p>{error.message || "Falha inesperada"}</p>
            <button type="button" className="error-btn" onClick={() => reset()}>
              Recarregar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
