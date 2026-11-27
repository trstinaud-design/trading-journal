"use client";
import { useEffect, useState } from "react";
import { Palette, Type, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

// Polices sélectionnables (clé → famille CSS + libellé). "archivo" = défaut.
const FONTS: { key: string; label: string; family: string; sample: string }[] = [
  { key: "archivo", label: "Archivo (défaut)", family: '"Archivo Black", sans-serif', sample: "Aa 10.6R" },
  { key: "marker", label: "Permanent Marker", family: '"Permanent Marker", cursive', sample: "Aa 10.6R" },
  { key: "sedgwick", label: "Sedgwick Ave", family: '"Sedgwick Ave Display", cursive', sample: "Aa 10.6R" },
  { key: "spray", label: "Rubik Spray Paint", family: '"Rubik Spray Paint", sans-serif', sample: "Aa 10.6R" },
  { key: "bungee", label: "Bungee", family: '"Bungee", sans-serif', sample: "Aa 10R" },
  { key: "bangers", label: "Bangers", family: '"Bangers", cursive', sample: "Aa 10.6R" },
  { key: "barrio", label: "Barrio", family: '"Barrio", cursive', sample: "Aa 10.6R" },
  { key: "protest", label: "Protest Guerrilla", family: '"Protest Guerrilla", sans-serif', sample: "Aa 10R" },
  { key: "rocksalt", label: "Rock Salt", family: '"Rock Salt", cursive', sample: "Aa 10R" },
];

// Fonds sélectionnables (clé → dégradé d'aperçu). "petrole" = défaut.
const BACKGROUNDS: { key: string; label: string; desc: string; preview: string }[] = [
  { key: "petrole", label: "Pétrole", desc: "Encre + halo laiton", preview: "radial-gradient(120% 90% at 50% -10%, rgba(217,164,65,.22), transparent 60%), #0a1416" },
  { key: "nuit", label: "Nuit froide", desc: "Bleu profond, sobre", preview: "radial-gradient(120% 90% at 50% -10%, rgba(40,90,170,.4), transparent 60%), #06090f" },
  { key: "ambre", label: "Ambre chaud", desc: "Noir chaud + braises", preview: "radial-gradient(120% 90% at 50% -10%, rgba(224,120,50,.3), transparent 60%), #140d08" },
  { key: "cosmos", label: "Cosmos", desc: "Nébuleuses + étoiles", preview: "radial-gradient(40% 50% at 20% 25%, rgba(124,58,237,.5), transparent 60%), radial-gradient(40% 50% at 80% 20%, rgba(14,165,233,.45), transparent 60%), radial-gradient(45% 55% at 60% 85%, rgba(236,72,153,.35), transparent 60%), #05060c" },
];

function applyFont(key: string) {
  const el = document.documentElement;
  if (key === "archivo") delete el.dataset.font; else el.dataset.font = key;
  try { key === "archivo" ? localStorage.removeItem("font") : localStorage.setItem("font", key); } catch {}
}
function applyBg(key: string) {
  const el = document.documentElement;
  if (key === "petrole") delete el.dataset.bg; else el.dataset.bg = key;
  try { key === "petrole" ? localStorage.removeItem("bg") : localStorage.setItem("bg", key); } catch {}
}

export function AppearanceClient() {
  const [font, setFont] = useState("archivo");
  const [bg, setBg] = useState("petrole");

  useEffect(() => {
    try {
      setFont(localStorage.getItem("font") ?? "archivo");
      setBg(localStorage.getItem("bg") ?? "petrole");
    } catch {}
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Palette className="h-6 w-6 text-primary" />
          <h1 className="font-display text-3xl font-bold tracking-tight">Apparence</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Personnalise l&apos;allure de ton journal. Les choix sont enregistrés dans ce navigateur — tes données ne changent pas.
        </p>
      </div>

      {/* Police */}
      <Card className="card-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Type className="h-4 w-4" /> Police des titres &amp; gros chiffres</CardTitle>
          <CardDescription>Le style « display » (logo, titres, chiffres héros). Les tableaux restent en Archivo pour la lisibilité.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {FONTS.map((f) => {
            const active = font === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => { setFont(f.key); applyFont(f.key); }}
                className={cn(
                  "relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-colors hover:border-primary/50",
                  active ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border",
                )}
              >
                {active && <Check className="absolute right-2 top-2 h-4 w-4 text-primary" />}
                <span style={{ fontFamily: f.family }} className="text-2xl leading-none text-foreground">{f.sample}</span>
                <span className="text-xs text-muted-foreground">{f.label}</span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Fond */}
      <Card className="card-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Palette className="h-4 w-4" /> Fond de l&apos;application</CardTitle>
          <CardDescription>Choisis l&apos;ambiance. « Cosmos » est généré en CSS (nébuleuses + étoiles).</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {BACKGROUNDS.map((b) => {
            const active = bg === b.key;
            return (
              <button
                key={b.key}
                type="button"
                onClick={() => { setBg(b.key); applyBg(b.key); }}
                className={cn(
                  "relative overflow-hidden rounded-xl border text-left transition-colors hover:border-primary/50",
                  active ? "border-primary ring-1 ring-primary/30" : "border-border",
                )}
              >
                {active && <Check className="absolute right-2 top-2 z-10 h-4 w-4 text-white drop-shadow" />}
                <span className="block h-20 w-full" style={{ background: b.preview }} />
                <span className="block px-3 py-2">
                  <span className="block text-sm font-medium">{b.label}</span>
                  <span className="block text-xs text-muted-foreground">{b.desc}</span>
                </span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Tu veux une vraie photo galaxie en fond ? Envoie-la moi (Pinterest ou autre) et je l&apos;ajoute comme option.
      </p>
    </div>
  );
}
