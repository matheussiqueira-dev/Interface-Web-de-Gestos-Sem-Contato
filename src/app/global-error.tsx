"use client";

// Replaces the root layout when it fails, so it cannot rely on the app stylesheet.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR" style={{ backgroundColor: "#0b0d10", colorScheme: "dark" }}>
      <body style={{ margin: 0, padding: "2rem 1.25rem", color: "#e4e7ec", fontFamily: "system-ui, sans-serif" }}>
        <main>
          <h1 style={{ fontSize: "1.5rem" }}>Não foi possível carregar o aplicativo.</h1>
          <p style={{ color: "#a3abb8" }}>Recarregue a página. Se o erro continuar, tente mais tarde.</p>
          <button type="button" onClick={() => reset()} style={{ minHeight: "2.75rem", padding: "0 1.25rem" }}>
            Recarregar
          </button>
        </main>
      </body>
    </html>
  );
}
