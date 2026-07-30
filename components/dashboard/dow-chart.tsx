"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Row = { jour: string; netR: number; winRate: number; n: number };

export function DoWChart({ data }: { data: Row[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Performance par jour de la semaine</CardTitle></CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="jour" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
              formatter={(v: number, k) => k === "netR" ? [`${v.toFixed(2)} R`, "Net R"] : [`${v}%`, "Win Rate"]}
            />
            <Bar dataKey="netR">
              {data.map((d, i) => (
                <Cell key={i} fill={d.netR >= 0 ? "hsl(var(--win))" : "hsl(var(--loss))"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
