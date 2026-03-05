import type { Metadata } from "next";
import { Exo_2, Orbitron, Rajdhani } from "next/font/google";
import type { ReactNode } from "react";

import { AppFooter } from "@/components/layout/AppFooter";
import { FloatingWhatsAppButton } from "@/components/layout/FloatingWhatsAppButton";
import "@/styles/globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-heading",
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  variable: "--font-ui",
  weight: ["400", "500", "600", "700"],
});

const exo2 = Exo_2({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ENCOM Touchless Workspace",
  description: "Workspace touchless com visual Tron Legacy e sistema ENCOM.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${orbitron.variable} ${rajdhani.variable} ${exo2.variable}`}>
        {children}
        <AppFooter />
        <FloatingWhatsAppButton />
      </body>
    </html>
  );
}
