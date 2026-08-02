import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Target, Zap, DollarSign, Hash } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/dashboard/kpi-card";
import { computeKPIs } from "@/lib/analytics/metrics";
import { cn } from "@/lib/utils/cn";
import type { Trade, Setup } from "@/types/database";

/** Page playbook d'un setup : stats + description + trades associés. */
export default async function SetupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: setup }, { data: trades }] = await Promise.all([
    supabase.from("setups").select("*").eq("id", id).single(),
    supabase.from("trades").select("*").eq("setup_id", id).order("date_entree", { ascending: false }),
  ]);
  if (!setup) return notFound();

  const s = setup as Setup;
  const list = (trades as Trade[]) ?? [];
  const k = computeKPIs(list);
  const pf = k.profitFactor === Infinity ? "∞" : k.profitFactor.toFixed(2);
  const best = list.reduce<Trade | null>((acc, t) => (t.resultat_r ?? 0) > (acc?.resultat_r ?? -Infinity) ? t : acc, null);
  const worst = list.reduce<Trade | null>((acc, t) => (t.resultat_r ?? 0) < (acc?.resultat_r ?? Infinity) ? t : acc, null);

  return (
    <div className="space-y-6">
      <Link href="/setups" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Retour aux setups
      </Link>

      <div>
        <h1 className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-3xl font-bold">{s.nom}</h1>
        {s.description && <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Trades" value={String(k.totalTrades)} icon={Hash} />
        <KPICard label="Win Rate" value={`${Math.round(k.winRate * 100)}%`} tone={k.winRate >= 0.5 ? "win" : "loss"} icon={Target} trend={k.winRate >= 0.5 ? "up" : "down"} />
        <KPICard label="Profit Factor" value={pf} tone={k.profitFactor >= 1.5 ? "win" : k.profitFactor >= 1 ? "default" : "loss"} icon={Zap} />
        <KPICard label="Total Net" value={`${k.totalR >= 0 ? "+" : ""}${k.totalR.toFixed(2)} R`} hint={`${k.totalUsd >= 0 ? "+" : ""}${k.totalUsd.toFixed(2)} $`} tone={k.totalR >= 0 ? "win" : "loss"} icon={DollarSign} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="card-glass">
          <CardHeader><CardTitle className="text-base text-emerald-400">🏆 Meilleur trade</CardTitle></CardHeader>
          <CardContent>
            {best ? (
              <div className="space-y-1 text-sm">
                <p className="font-medium">{best.paire} · {best.direction === "long" ? "▲ Long" : "▼ Short"}</p>
                <p className="text-2xl font-bold text-emerald-400">+{best.resultat_r?.toFixed(2)} R</p>
                <p className="text-xs text-muted-foreground">{format(new Date(best.date_entree), "yyyy-MM-dd HH:mm")}</p>
              </div>
            ) : <p className="text-sm text-muted-foreground">Aucun trade</p>}
          </CardContent>
        </Card>
        <Card className="card-glass">
          <CardHeader><CardTitle className="text-base text-rose-400">📉 Pire trade</CardTitle></CardHeader>
          <CardContent>
            {worst ? (
              <div className="space-y-1 text-sm">
                <p className="font-medium">{worst.paire} · {worst.direction === "long" ? "▲ Long" : "▼ Short"}</p>
                <p className="text-2xl font-bold text-rose-400">{worst.resultat_r?.toFixed(2)} R</p>
                <p className="text-xs text-muted-foreground">{format(new Date(worst.date_entree), "yyyy-MM-dd HH:mm")}</p>
              </div>
            ) : <p className="text-sm text-muted-foreground">Aucun trade</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="card-glass overflow-x-auto">
        <CardHeader><CardTitle className="text-base">Trades avec ce setup</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Paire</th>
                <th className="p-3">Dir.</th>
                <th className="p-3">Statut</th>
                <th className="p-3 text-right">R</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id} className="border-b hover:bg-accent/50">
                  <td className="p-3 whitespace-nowrap">{format(new Date(t.date_entree), "yyyy-MM-dd HH:mm")}</td>
                  <td className="p-3 font-medium">{t.paire}</td>
                  <td className="p-3">{t.direction === "long" ? "▲" : "▼"}</td>
                  <td className="p-3 uppercase">{t.statut}</td>
                  <td className={cn("p-3 text-right font-mono", (t.resultat_r ?? 0) > 0 && "text-emerald-400", (t.resultat_r ?? 0) < 0 && "text-rose-400")}>
                    {t.resultat_r !== null ? `${t.resultat_r > 0 ? "+" : ""}${t.resultat_r.toFixed(2)}` : "—"}
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Aucun trade pour ce setup</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
