import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import { CosmosScene } from "@/components/layout/cosmos-scene";
import "./globals.css";

export const metadata: Metadata = {
  title: "Instrument — Journal de trading",
  description: "Le registre de précision de ton trading : performance, discipline, patterns.",
};

// Thème clair/sombre : appliqué avant le 1er rendu via localStorage (évite le flash).
const themeInitScript = `
  try {
    var el = document.documentElement;
    var stored = localStorage.getItem("theme");
    el.classList.toggle("dark", stored === "dark" || stored === null);
  } catch (_) {}
`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Police & fond : lus depuis un cookie et posés sur <html> côté serveur
  // (persistant et sans flash, indépendant du localStorage du navigateur).
  const c = await cookies();
  const font = c.get("pref_font")?.value || undefined;
  const bg = c.get("pref_bg")?.value || undefined;

  return (
    <html lang="fr" suppressHydrationWarning data-font={font} data-bg={bg}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Archivo+Black&family=Permanent+Marker&family=Sedgwick+Ave+Display&family=Rubik+Spray+Paint&family=Bungee&family=Bangers&family=Barrio&family=Protest+Guerrilla&family=Rock+Salt&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <CosmosScene />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
