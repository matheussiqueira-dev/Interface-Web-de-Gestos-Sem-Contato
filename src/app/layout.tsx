import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SITE } from "@/lib/site";

import "./ms-tokens.css";
import "@/styles/app.css";

const plex = IBM_Plex_Sans({
  weight: "variable",
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
  preload: true,
});

const title = `${SITE.productName} | ${SITE.author.name}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title,
  description: SITE.description,
  applicationName: SITE.productName,
  authors: [{ name: SITE.author.name, url: SITE.author.url }],
  creator: SITE.author.name,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: SITE.author.name,
    locale: "pt_BR",
    url: "/",
    title,
    description: SITE.description,
  },
  twitter: {
    card: "summary",
    title,
    description: SITE.description,
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0b0d10",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE.productName,
  description: SITE.description,
  url: SITE.url,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  inLanguage: "pt-BR",
  codeRepository: SITE.repository,
  author: {
    "@type": "Person",
    name: SITE.author.name,
    url: SITE.author.url,
    sameAs: [SITE.author.linkedin, SITE.author.github],
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      data-theme="dark"
      className={plex.variable}
      style={{ backgroundColor: "#0b0d10", colorScheme: "dark" }}
    >
      <head>
        <link rel="author" href={SITE.author.url} />
        <script
          type="application/ld+json"
          // Static object built at compile time; no user input reaches it.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <a className="ms-skip-link" href="#main-content">
          Pular para o conteúdo
        </a>
        <SiteHeader />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
