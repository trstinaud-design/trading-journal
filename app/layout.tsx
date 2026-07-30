import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trading Journal",
  description: "Journal de trading professionnel avec analytics avancés",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
