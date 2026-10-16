import { shortCommit, SITE } from "@/lib/site";

export function SiteFooter() {
  const commit = shortCommit();
  const meta = [SITE.productName, `v${SITE.version}`, ...(commit ? [commit] : [])].join(" · ");

  return (
    <footer className="ms-footer">
      <div className="ms-container ms-footer__inner">
        <p className="ms-footer__signature" lang="pt-BR">
          <a href="https://www.matheussiqueira.dev">Desenvolvido por Matheus Siqueira</a>
          <span aria-hidden="true">|</span>
          <a href="https://www.matheussiqueira.dev">www.matheussiqueira.dev</a>
        </p>
        <nav className="ms-footer__links" aria-label="Links do autor">
          <a href="https://www.linkedin.com/in/matheussiqueira-dev" target="_blank" rel="noopener noreferrer">
            LinkedIn<span className="ms-sr-only"> (abre em nova aba)</span>
          </a>
          <a href="https://github.com/matheussiqueira-dev" target="_blank" rel="noopener noreferrer">
            GitHub<span className="ms-sr-only"> (abre em nova aba)</span>
          </a>
          <a
            href="https://github.com/matheussiqueira-dev/Interface-Web-de-Gestos-Sem-Contato"
            target="_blank"
            rel="noopener noreferrer"
          >
            Código deste projeto<span className="ms-sr-only"> (abre em nova aba)</span>
          </a>
        </nav>
        <p className="ms-footer__meta">{meta}</p>
      </div>
    </footer>
  );
}
