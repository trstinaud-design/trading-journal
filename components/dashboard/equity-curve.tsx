"use client";
import { useMemo } from "react";
import { Area, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

type Point = { date: string; cumR: number };
type EnrichedPoint = Point & { peak: number; drawdown: number; band: [number, number] };

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: EnrichedPoint }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 text-xs text-popover-foreground shadow-lg">
      <p className="mb-1.5 font-semibold text-foreground">{d.date}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">R cumulé</span>
          <span className={cn("font-bold tabular-nums", d.cumR >= 0 ? "text-emerald-400" : "text-rose-400")}>
            {d.cumR >= 0 ? "+" : ""}{d.cumR.toFixed(2)}R
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Pic (high water mark)</span>
          <span className="font-medium tabular-nums text-sky-400">+{d.peak.toFixed(2)}R</span>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border/40 pt-1">
          <span className="text-muted-foreground">Écart au pic (drawdown)</span>
          <span className={cn("font-bold tabular-nums", d.drawdown > 0 ? "text-rose-400" : "text-emerald-400")}>
            {d.drawdown > 0 ? `-${d.drawdown.toFixed(2)}R` : "0 (au plus haut)"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function EquityCurve({ data }: { data: Point[] }) {
  // Calcule le pic courant (high water mark), le drawdown, et la bande à ombrer
  const enriched = useMemo<EnrichedPoint[]>(() => {
    let peak = -Infinity;
    return data.map((p) => {
      peak = Math.max(peak, p.cumR);
      const drawdown = peak - p.cumR;
      return { ...p, peak, drawdown, band: [p.cumR, peak] };
    });
  }, [data]);

  const maxDD = enriched.reduce((m, p) => Math.max(m, p.drawdown), 0);

  return (
    <Card className="card-glass">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Courbe de capital (R cumulé)</CardTitle>
        <span className="text-xs text-muted-foreground">
          Max drawdown : <span className="font-semibold text-rose-400">-{maxDD.toFixed(2)}R</span>
        </span>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={enriched}>
            <defs>
              <linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(350, 90%, 60%)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(350, 90%, 60%)" stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} minTickGap={40} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(var(--accent))", strokeWidth: 1 }} />

            {/* Zone rouge = écart entre la courbe et son pic (drawdown) */}
            <Area type="monotone" dataKey="band" stroke="none" fill="url(#ddFill)" isAnimationActive={false} />
            {/* Ligne du pic (high water mark) en pointillés */}
            <Line type="monotone" dataKey="peak" stroke="hsl(205, 90%, 60%)" strokeWidth={1} strokeDasharray="4 4" dot={false} />
            {/* Courbe nette */}
            <Line type="monotone" dataKey="cumR" stroke="hsl(43, 95%, 60%)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "hsl(43, 95%, 60%)" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
