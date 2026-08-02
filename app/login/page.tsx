"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TrendingUp, BarChart3, Target, Calendar } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: BarChart3, text: "Analytics avancés (Win Rate, PF, Espérance...)" },
  { icon: Target, text: "Auto-calcul de position selon ton risque" },
  { icon: Calendar, text: "Détection automatique de la session" },
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
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panneau gauche — visuel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <span className="text-lg font-semibold text-white">Trading Journal</span>
        </div>

        <div className="relative space-y-6">
          <h2 className="text-4xl font-bold leading-tight text-white">
            Suis tes performances,<br />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              deviens rentable.
            </span>
          </h2>
          <ul className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white/80">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/50">© 2026 Trading Journal — TRS</p>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-2xl font-bold">Bon retour 👋</h1>
            <p className="text-sm text-muted-foreground">Connecte-toi pour accéder à ton journal.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required placeholder="toi@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="h-11 w-full gradient-primary text-white shadow-lg shadow-primary/20 hover:opacity-90" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Pas encore de compte ? <Link href="/signup" className="font-medium text-primary hover:underline">Créer un compte</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
