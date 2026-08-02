"use client";
import { useState } from "react";
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import type { Trade } from "@/types/database";

// Couleurs assignées par session (demande utilisateur)
const SESSION_META: Record<string, { label: string; color: string }> = {
  ny: { label: "New York", color: "#3b82f6" },      // bleu
  londres: { label: "London", color: "#f97316" },    // orange
  hors_timing: { label: "Hors timing", color: "#ef4444" }, // rouge
  asie: { label: "Asie", color: "#a855f7" },         // violet (bonus)
};

type Slice = { session: string; count: number; wins: number; losses: number; be: number; totalR: number };

export function SessionPie({ trades }: { trades: Trade[] }) {
  // Agrège par session
  const map = new Map<string, Slice>();
  for (const t of trades) {
    if (!t.session) continue;
    const cur = map.get(t.session) ?? { session: t.session, count: 0, wins: 0, losses: 0, be: 0, totalR: 0 };
    cur.count += 1;
    if (t.statut === "tp") cur.wins += 1;
    else if (t.statut === "sl") cur.losses += 1;
    else if (t.statut === "be") cur.be += 1;
    cur.totalR += t.resultat_r ?? 0;
    map.set(t.session, cur);
  }
  const data = [...map.values()].sort((a, b) => b.count - a.count);

  const [selected, setSelected] = useState<string | null>(null);
  const detail = selected ? map.get(selected) : null;

  return (
    <Card className="card-glass">
      <CardHeader className="pb-2"><CardTitle className="text-base">Répartition par session</CardTitle></CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune donnée</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Camembert */}
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="count"
                    nameKey="session"
                    innerRadius={40}
                    outerRadius={90}
                    paddingAngle={2}
                    onClick={(entry) => setSelected(entry.session === selected ? null : entry.session)}
                    cursor="pointer"
                  >
                    {data.map((d) => (
                      <Cell
                        key={d.session}
                        fill={SESSION_META[d.session]?.color ?? "#94a3b8"}
                        stroke={selected === d.session ? "white" : "transparent"}
                        strokeWidth={selected === d.session ? 3 : 0}
                        opacity={selected && selected !== d.session ? 0.4 : 1}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as Slice;
                      const meta = SESSION_META[d.session];
                      return (
                        <div className="rounded-lg border border-border bg-popover p-3 text-xs text-popover-foreground shadow-lg">
                          <p className="mb-1 font-semibold" style={{ color: meta?.color }}>{meta?.label ?? d.session}</p>
                          <div className="space-y-0.5">
                            <p><span className="text-muted-foreground">Trades :</span> <strong>{d.count}</strong></p>
                            <p><span className="text-emerald-400">Wins {d.wins}</span> · <span className="text-rose-400">Losses {d.losses}</span> · <span className="text-muted-foreground">BE {d.be}</span></p>
                            <p><span className="text-muted-foreground">Total R :</span> <strong className={d.totalR >= 0 ? "text-emerald-400" : "text-rose-400"}>{d.totalR >= 0 ? "+" : ""}{d.totalR.toFixed(2)}R</strong></p>
                          </div>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Légende + détail */}
            <div className="space-y-2">
              {data.map((d) => {
                const meta = SESSION_META[d.session] ?? { label: d.session, color: "#94a3b8" };
                const pct = Math.round((d.count / trades.filter((t) => t.session).length) * 100);
                const isSelected = selected === d.session;
                return (
                  <button
                    type="button"
                    key={d.session}
                    onClick={() => setSelected(isSelected ? null : d.session)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md border px-3 py-2 text-left transition-all hover:bg-accent",
                      isSelected ? "border-primary bg-primary/5" : "border-border/40",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-sm" style={{ background: meta.color }} />
                      <span className="text-sm font-medium">{meta.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">{d.count} · {pct}%</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Détail au clic */}
        {detail && (
          <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm" style={{ background: SESSION_META[detail.session]?.color ?? "#94a3b8" }} />
              <span className="font-semibold">{SESSION_META[detail.session]?.label ?? detail.session}</span>
            </div>
            <div className="grid grid-cols-4 gap-3 text-center text-sm">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Trades</p>
                <p className="text-lg font-bold">{detail.count}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Wins</p>
                <p className="text-lg font-bold text-emerald-400">{detail.wins}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Losses</p>
                <p className="text-lg font-bold text-rose-400">{detail.losses}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">BE</p>
                <p className="text-lg font-bold text-muted-foreground">{detail.be}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-2 text-xs">
              <span className="text-muted-foreground">Win Rate</span>
              <span className="font-bold">{detail.count > 0 ? Math.round((detail.wins / detail.count) * 100) : 0}%</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">Total R</span>
              <span className={cn("font-bold tabular-nums", detail.totalR >= 0 ? "text-emerald-400" : "text-rose-400")}>
                {detail.totalR >= 0 ? "+" : ""}{detail.totalR.toFixed(2)}R
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
