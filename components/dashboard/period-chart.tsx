"use client";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Granularity } from "@/lib/analytics/metrics";
import { cn } from "@/lib/utils/cn";

type Row = { label: string; netR: number; netUsd: number; winRate: number; n: number };
type DataByGranularity = Record<Granularity, Row[]>;

const OPTIONS: { value: Granularity; label: string }[] = [
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
  { value: "quarter", label: "Trimestre" },
];

/** Tooltip custom avec couleurs lisibles + info détaillée. */
function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Row }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const wins = Math.round((d.winRate / 100) * d.n);
  const losses = d.n - wins;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 text-xs text-popover-foreground shadow-lg">
      <p className="mb-1.5 font-semibold text-foreground">{d.label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Net R</span>
          <span className={cn("font-bold tabular-nums", d.netR >= 0 ? "text-emerald-400" : "text-rose-400")}>
            {d.netR >= 0 ? "+" : ""}{d.netR.toFixed(2)}R
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Trades</span>
          <span className="font-medium tabular-nums">{d.n}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Win Rate</span>
          <span className="font-medium tabular-nums">{d.winRate}%</span>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border/40 pt-1">
          <span className="text-emerald-400">Wins: {wins}</span>
          <span className="text-rose-400">Losses: {losses}</span>
        </div>
      </div>
    </div>
  );
}

export function PeriodChart({ data }: { data: DataByGranularity }) {
  const [gran, setGran] = useState<Granularity>("month");
  const rows = data[gran];

  return (
    <Card className="card-glass">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Performance par période</CardTitle>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setGran(o.value)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                gran === o.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="h-64">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Pas encore de données</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--accent) / 0.3)" }} />
              <Bar dataKey="netR" radius={[4, 4, 0, 0]}>
                {rows.map((r, i) => (
                  <Cell key={i} fill={r.netR >= 0 ? "hsl(152, 76%, 50%)" : "hsl(350, 90%, 65%)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
