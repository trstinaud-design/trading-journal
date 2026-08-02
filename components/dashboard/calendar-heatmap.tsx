"use client";
import { useState } from "react";
import { addMonths, endOfMonth, format, isSameDay, startOfMonth, startOfWeek, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type Day = { date: string; netR: number; netUsd: number; n: number };

/** Heatmap Lundi-Vendredi uniquement (le trading ne se fait pas le weekend). */
export function CalendarHeatmap({ data }: { data: Day[] }) {
  const [cursor, setCursor] = useState(startOfMonth(new Date()));
  const map = new Map(data.map((d) => [d.date, d]));

  const first = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const last = endOfMonth(cursor);
  const cells: Date[] = [];
  let cur = first;
  while (cur <= last || cells.length % 7 !== 0) {
    cells.push(cur);
    cur = addDays(cur, 1);
    if (cells.length > 42) break;
  }
  // Ne garde que les jours ouvrés (lundi=1 → vendredi=5)
  const weekdayCells = cells.filter((d) => d.getDay() >= 1 && d.getDay() <= 5);

  function bgFor(day: Day | undefined) {
    if (!day || day.n === 0) return "bg-muted/30 text-muted-foreground";
    if (day.netUsd > 0) return "bg-emerald-500/25 text-emerald-300 font-semibold ring-1 ring-emerald-500/40";
    if (day.netUsd < 0) return "bg-rose-500/25 text-rose-300 font-semibold ring-1 ring-rose-500/40";
    return "bg-muted text-muted-foreground";
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base capitalize">{format(cursor, "MMMM yyyy", { locale: fr })}</CardTitle>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={() => setCursor((c) => addMonths(c, -1))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => setCursor((c) => addMonths(c, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-1.5 text-center text-xs text-muted-foreground">
          {["Lun", "Mar", "Mer", "Jeu", "Ven"].map((d) => <div key={d} className="pb-1 font-medium">{d}</div>)}
          {weekdayCells.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const day = map.get(key);
            const inMonth = d.getMonth() === cursor.getMonth();
            return (
              <div
                key={key}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center rounded-lg text-xs transition-transform hover:scale-105",
                  inMonth ? bgFor(day) : "opacity-30",
                  isSameDay(d, new Date()) && "ring-2 ring-primary",
                )}
              >
                <span className="text-sm">{format(d, "d")}</span>
                {day && day.n > 0 && (
                  <span className="text-[10px]">{day.netUsd > 0 ? "+" : ""}{day.netUsd.toFixed(0)}$</span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
