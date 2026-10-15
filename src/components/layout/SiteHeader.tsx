import { Briefcase, Github } from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/layout/BrandMark";
import { SITE } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="ms-header">
      <div className="ms-container ms-header__inner">
        <Link className="ms-header__brand" href="/">
          <BrandMark />
          <span>{SITE.shortName}</span>
        </Link>

        <nav className="ms-header__nav" aria-label="Projeto">
          <a className="ms-header__link" href={SITE.portfolioCase} title="Portfólio">
            <Briefcase size={20} strokeWidth={1.75} aria-hidden="true" />
            <span className="ms-header__label">Portfólio</span>
          </a>
          <a
            className="ms-header__link"
            href={SITE.repository}
            target="_blank"
            rel="noopener noreferrer"
            title="Código"
          >
            <Github size={20} strokeWidth={1.75} aria-hidden="true" />
            <span className="ms-header__label">Código</span>
            <span className="ms-sr-only"> (abre em nova aba)</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
