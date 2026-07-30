"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

type Row = { key: string; totalR: number; winRate: number; totalTrades: number };

export function GroupedPerf({ title, rows, labels }: { title: string; rows: Row[]; labels?: Record<string, string> }) {
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.totalR)));
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 && <p className="text-sm text-muted-foreground">Aucune donnée</p>}
        {rows.map((r) => (
          <div key={r.key} className="space-y-1">
            <div className="flex items-baseline justify-between text-sm">
              <span className="truncate">{labels?.[r.key] ?? r.key}</span>
              <span className="text-xs text-muted-foreground">
                {r.totalTrades} trade(s) • WR {Math.round(r.winRate * 100)}%
              </span>
            </div>
            <div className="relative h-2 overflow-hidden rounded bg-muted">
              <div
                className={cn("absolute top-0 h-full", r.totalR >= 0 ? "left-1/2 bg-[hsl(var(--win))]" : "right-1/2 bg-[hsl(var(--loss))]")}
                style={{ width: `${(Math.abs(r.totalR) / max) * 50}%` }}
              />
              <div className="absolute left-1/2 h-full w-px bg-border" />
            </div>
            <div className="text-right text-xs font-mono tabular-nums">
              {r.totalR >= 0 ? "+" : ""}{r.totalR.toFixed(2)} R
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
