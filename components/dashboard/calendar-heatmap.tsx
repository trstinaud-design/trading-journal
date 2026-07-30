"use client";
import { useState } from "react";
import { addMonths, endOfMonth, format, isSameDay, startOfMonth, startOfWeek, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type Day = { date: string; netR: number; netUsd: number; n: number };

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

  function bgFor(day: Day | undefined) {
    if (!day || day.n === 0) return "bg-muted/30 text-muted-foreground";
    if (day.netUsd > 0) return "bg-[hsl(var(--win))]/20 text-[hsl(var(--win))] font-semibold";
    if (day.netUsd < 0) return "bg-[hsl(var(--loss))]/20 text-[hsl(var(--loss))] font-semibold";
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
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
          {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => <div key={i} className="pb-1">{d}</div>)}
          {cells.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const day = map.get(key);
            const inMonth = d.getMonth() === cursor.getMonth();
            return (
              <div
                key={key}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center rounded-md text-xs",
                  inMonth ? bgFor(day) : "opacity-30",
                  isSameDay(d, new Date()) && "ring-1 ring-primary",
                )}
              >
                <span>{format(d, "d")}</span>
                {day && day.n > 0 && (
                  <span className="text-[9px]">{day.netUsd > 0 ? "+" : ""}{day.netUsd.toFixed(0)}$</span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
