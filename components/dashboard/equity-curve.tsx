"use client";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

type Point = { date: string; cumR: number };

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Point }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 text-xs text-popover-foreground shadow-lg">
      <p className="mb-1 font-semibold text-foreground">{d.date}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">R cumulé</span>
        <span className={cn("font-bold tabular-nums", d.cumR >= 0 ? "text-emerald-400" : "text-rose-400")}>
          {d.cumR >= 0 ? "+" : ""}{d.cumR.toFixed(2)}R
        </span>
      </div>
    </div>
  );
}

export function EquityCurve({ data }: { data: Point[] }) {
  return (
    <Card className="card-glass">
      <CardHeader><CardTitle className="text-base">Courbe de capital (R cumulé)</CardTitle></CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} minTickGap={40} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(var(--accent))", strokeWidth: 1 }} />
            <Line type="monotone" dataKey="cumR" stroke="hsl(43, 95%, 60%)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "hsl(43, 95%, 60%)" }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
