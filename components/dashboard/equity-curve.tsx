"use client";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EquityCurve({ data }: { data: { date: string; cumR: number }[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Courbe de capital (R cumulé)</CardTitle></CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={40} />
            <YAxis tick={{ fontSize: 10 }} />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
            <Tooltip
              contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
              formatter={(v: number) => [`${v.toFixed(2)} R`, "Cumulé"]}
            />
            <Line type="monotone" dataKey="cumR" stroke="hsl(var(--win))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
