import type { Metadata } from "next";
import { IBM_Plex_Mono, Outfit, Sora } from "next/font/google";
import type { ReactNode } from "react";

import "@/styles/globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Touchless Workspace",
  description: "Interface web de gestos sem contato com Next.js e TypeScript.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${outfit.variable} ${sora.variable} ${ibmPlexMono.variable}`}>{children}</body>
    </html>
  );
}
