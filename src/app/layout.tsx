import "./globals.css";
import type { Metadata } from "next";
import { initializeApp } from "@/lib/init";

export const metadata: Metadata = {
  title: "WhatsApp AI Bot",
  description: "Bot WhatsApp propulsé par l'IA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialisation asynchrone (non-bloquante pour le rendu)
  initializeApp();

  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
