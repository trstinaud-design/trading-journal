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
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                formatter={(v: number, k: string) => k === "netR" ? [`${v.toFixed(2)} R`, "Net R"] : [v, k]}
              />
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
