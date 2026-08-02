import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trading Journal",
  description: "Journal de trading professionnel avec analytics avancés",
};

// Script bloquant qui applique le thème avant le premier render (évite le flash clair → sombre).
const themeInitScript = `
  try {
    const stored = localStorage.getItem("theme");
    const dark = stored === "dark" || (stored === null);
    document.documentElement.classList.toggle("dark", dark);
  } catch (_) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
