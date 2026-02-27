"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="error-overlay">
      <div className="error-card glass">
        <h2>Erro na renderizacao</h2>
        <p>{error.message || "Falha inesperada"}</p>
        <button type="button" className="error-btn" onClick={() => reset()}>
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
