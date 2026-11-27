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

const LEDGER = [
  ["Prêt en 30 secondes", "Un compte démo et des setups de départ t'attendent"],
  ["Tes données t'appartiennent", "Chiffrées, privées, exportables quand tu veux"],
  ["Multi-comptes", "Prop firm, réel, démo — chacun sa performance"],
];

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error("Minimum 8 caractères");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Compte créé");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
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
            Tiens le registre qui te rendra rentable.
          </h2>
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

      <div className="flex items-center justify-center p-6 lg:p-14">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold tracking-tight">Crée ton compte</h1>
            <p className="text-sm text-muted-foreground">Un compte démo à 10 000 $ et des setups de départ sont créés pour toi.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required placeholder="toi@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe (8 caractères minimum)</Label>
              <PasswordInput id="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="h-11 w-full gradient-primary font-semibold text-white hover:opacity-90" disabled={loading}>
              {loading ? "Création…" : "Créer mon compte"}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground">
            Déjà un compte ? <Link href="/login" className="font-medium text-primary hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
