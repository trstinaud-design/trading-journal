"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

type Row = { jour: string; netR: number; winRate: number; n: number };

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Row }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const wins = Math.round((d.winRate / 100) * d.n);
  const losses = d.n - wins;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 text-xs text-popover-foreground shadow-lg">
      <p className="mb-1.5 font-semibold text-foreground">{d.jour}</p>
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

export function DoWChart({ data }: { data: Row[] }) {
  return (
    <Card className="card-glass">
      <CardHeader><CardTitle className="text-base">Performance par jour de la semaine</CardTitle></CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="jour" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--accent) / 0.3)" }} />
            <Bar dataKey="netR" radius={[4, 4, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.netR >= 0 ? "hsl(152, 76%, 50%)" : "hsl(350, 90%, 65%)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
