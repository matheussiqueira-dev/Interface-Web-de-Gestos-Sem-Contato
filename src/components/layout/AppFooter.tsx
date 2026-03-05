import { ENCOM_TOKENS } from "@/system/designTokens";

export function AppFooter() {
  return (
    <footer className="global-footer" aria-label="Rodape global">
      <p>Desenvolvido por Matheus Siqueira</p>
      <a href={ENCOM_TOKENS.links.portfolio} target="_blank" rel="noreferrer">
        https://www.matheussiqueira.dev/
      </a>
    </footer>
  );
}
