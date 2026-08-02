import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

type Row = { key: string; totalTrades: number; winRate: number; avgWinR: number; avgLossR: number; totalR: number };

/**
 * Tableau de performance groupé (style mitradacademy) :
 * colonnes Setup | Trades | Win Rate | R Moyen | R Total
 */
export function PerfTable({
  title, rows, labels, columnLabel = "Setup",
}: {
  title: string;
  rows: Row[];
  labels?: Record<string, string>;
  columnLabel?: string;
}) {
  // Tri : positifs d'abord (totalR desc), puis négatifs
  const sorted = [...rows].sort((a, b) => b.totalR - a.totalR);

  return (
    <Card className="card-glass">
      <CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">{columnLabel}</th>
              <th className="p-3 text-right">Trades</th>
              <th className="p-3 text-right">Win Rate</th>
              <th className="p-3 text-right">R Moyen</th>
              <th className="p-3 text-right">R Total</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-sm text-muted-foreground">Aucune donnée</td></tr>
            )}
            {sorted.map((r) => {
              // R moyen : moyenne pondérée gains/pertes ≈ totalR/n
              const avgR = r.totalTrades > 0 ? r.totalR / r.totalTrades : 0;
              const posColor = r.totalR >= 0 ? "text-emerald-400" : "text-rose-400";
              return (
                <tr key={r.key} className="border-b border-border/40 last:border-0 hover:bg-accent/30">
                  <td className="p-3 font-medium">{labels?.[r.key] ?? r.key}</td>
                  <td className="p-3 text-right text-muted-foreground tabular-nums">{r.totalTrades}</td>
                  <td className="p-3 text-right tabular-nums">{Math.round(r.winRate * 100)}%</td>
                  <td className={cn("p-3 text-right font-mono tabular-nums", posColor)}>
                    {avgR >= 0 ? "+" : ""}{avgR.toFixed(2)}R
                  </td>
                  <td className={cn("p-3 text-right font-mono font-bold tabular-nums", posColor)}>
                    {r.totalR >= 0 ? "+" : ""}{r.totalR.toFixed(2)}R
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
