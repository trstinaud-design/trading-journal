import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Instrument — Journal de trading",
  description: "Le registre de précision de ton trading : performance, discipline, patterns.",
};

// Applique le thème avant le premier rendu (évite le flash clair → sombre).
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
        {/* Polices chargées au runtime (pas au build) — Archivo (UI) + Archivo Black (héros) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Archivo+Black&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
