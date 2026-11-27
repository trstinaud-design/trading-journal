import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Instrument — Journal de trading",
  description: "Le registre de précision de ton trading : performance, discipline, patterns.",
};

// Applique thème + police + fond avant le premier rendu (évite le flash).
const themeInitScript = `
  try {
    var el = document.documentElement;
    var stored = localStorage.getItem("theme");
    el.classList.toggle("dark", stored === "dark" || stored === null);
    var f = localStorage.getItem("font"); if (f) el.dataset.font = f;
    var b = localStorage.getItem("bg"); if (b) el.dataset.bg = b;
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
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Archivo+Black&family=Permanent+Marker&family=Sedgwick+Ave+Display&family=Rubik+Spray+Paint&family=Bungee&family=Bangers&family=Barrio&family=Protest+Guerrilla&family=Rock+Salt&display=swap"
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
