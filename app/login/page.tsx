"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// Trois lignes de registre : ce que l'instrument mesure.
const LEDGER = [
  ["Win rate · Profit factor", "La vérité chiffrée de chaque série"],
  ["Risque en R", "Une position calculée, jamais devinée"],
  ["Drawdown & discipline", "Voir où le plan a tenu, et où il a cédé"],
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Connecté");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Panneau gauche — instrument */}
      <div className="relative hidden overflow-hidden border-r border-border bg-background lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div aria-hidden className="instrument-grid pointer-events-none absolute inset-0" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md gradient-gold">
            <span className="font-display text-sm font-extrabold text-[hsl(192_40%_8%)]">◆</span>
          </div>
          <span className="font-display text-base font-bold tracking-tight">Instrument</span>
        </div>

        <div className="relative max-w-lg space-y-10">
          <h2 className="font-display text-[2.75rem] font-extrabold leading-[1.02] tracking-tight">
            Le registre de précision de ton trading.
          </h2>

          {/* Spécimen de lecture : un readout honnête */}
          <div className="flex items-end gap-6 border-y border-border py-5">
            <div>
              <p className="font-display text-5xl font-extrabold tabular-nums text-[hsl(var(--win))]">+10.6<span className="text-2xl text-muted-foreground">R</span></p>
              <p className="mt-1 text-xs text-muted-foreground">Résultat net cumulé</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div>
              <p className="font-display text-5xl font-extrabold tabular-nums text-foreground">31<span className="text-2xl text-muted-foreground">%</span></p>
              <p className="mt-1 text-xs text-muted-foreground">Win rate</p>
            </div>
          </div>

          <ul className="space-y-4">
            {LEDGER.map(([head, sub]) => (
              <li key={head} className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">{head}</p>
                  <p className="text-sm text-muted-foreground">{sub}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-muted-foreground">Instrument — journal de trading privé · TRS</p>
      </div>

      {/* Panneau droit — connexion */}
      <div className="flex items-center justify-center p-6 lg:p-14">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold tracking-tight">Bon retour</h1>
            <p className="text-sm text-muted-foreground">Connecte-toi pour ouvrir ton registre.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required placeholder="toi@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <PasswordInput id="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="h-11 w-full gradient-primary font-semibold text-white hover:opacity-90" disabled={loading}>
              {loading ? "Connexion…" : "Se connecter"}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground">
            Pas encore de compte ? <Link href="/signup" className="font-medium text-primary hover:underline">Créer un compte</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
