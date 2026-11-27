import type { Metadata } from "next";
import { Archivo, Archivo_Black } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

// Corps & UI
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});
// Héros : chiffres et titres, cut lourd comme un readout d'instrument
const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display",
  display: "swap",
});

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
    <html lang="fr" suppressHydrationWarning className={`${archivo.variable} ${archivoBlack.variable}`}>
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
