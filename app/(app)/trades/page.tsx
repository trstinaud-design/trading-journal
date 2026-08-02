import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { TradesToolbar } from "./trades-toolbar";

const STATUT_COLOR: Record<string, string> = {
  tp: "text-[hsl(var(--win))]",
  sl: "text-[hsl(var(--loss))]",
  be: "text-muted-foreground",
  manuel: "text-foreground",
};

export default async function TradesPage() {
  const supabase = await createClient();
  const { data: trades } = await supabase
    .from("trades")
    .select("*, setups(nom), niveaux(nom)")
    .order("date_entree", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-3xl font-bold">Mes trades</h1>
          <p className="mt-1 text-sm text-muted-foreground">{trades?.length ?? 0} trade{(trades?.length ?? 0) > 1 ? "s" : ""} — 200 plus récents</p>
        </div>
        <TradesToolbar />
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Paire</th>
              <th className="p-3">Dir.</th>
              <th className="p-3">Session</th>
              <th className="p-3">Setup</th>
              <th className="p-3">Niveau</th>
              <th className="p-3">Statut</th>
              <th className="p-3 text-right">R</th>
              <th className="p-3 text-right">$</th>
              <th className="p-3">Plan</th>
            </tr>
          </thead>
          <tbody>
            {(trades ?? []).map((t: any) => (
              <tr key={t.id} className="border-b hover:bg-accent/50">
                <td className="p-3 whitespace-nowrap">{format(new Date(t.date_entree), "yyyy-MM-dd HH:mm")}</td>
                <td className="p-3 font-medium">{t.paire}</td>
                <td className="p-3"><span className={t.direction === "long" ? "text-[hsl(var(--win))]" : "text-[hsl(var(--loss))]"}>{t.direction === "long" ? "▲" : "▼"}</span></td>
                <td className="p-3 text-muted-foreground">{t.session ?? "—"}</td>
                <td className="p-3">{t.setups?.nom ?? "—"}</td>
                <td className="p-3">{t.niveaux?.nom ?? "—"}</td>
                <td className={cn("p-3 font-semibold uppercase", STATUT_COLOR[t.statut])}>{t.statut}</td>
                <td className={cn("p-3 text-right font-mono", (t.resultat_r ?? 0) > 0 && "text-[hsl(var(--win))]", (t.resultat_r ?? 0) < 0 && "text-[hsl(var(--loss))]")}>
                  {t.resultat_r !== null ? (t.resultat_r > 0 ? "+" : "") + Number(t.resultat_r).toFixed(2) : "—"}
                </td>
                <td className={cn("p-3 text-right font-mono", (t.resultat_usd ?? 0) > 0 && "text-[hsl(var(--win))]", (t.resultat_usd ?? 0) < 0 && "text-[hsl(var(--loss))]")}>
                  {t.resultat_usd !== null ? (t.resultat_usd > 0 ? "+" : "") + Number(t.resultat_usd).toFixed(2) + "$" : "—"}
                </td>
                <td className="p-3">{t.respect_plan ? "✓" : "✗"}</td>
              </tr>
            ))}
            {(!trades || trades.length === 0) && (
              <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">Aucun trade — <Link href="/trades/new" className="text-primary underline">créer le premier</Link></td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
