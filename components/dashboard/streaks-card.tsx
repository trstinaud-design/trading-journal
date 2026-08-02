import { Flame, Snowflake, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Streaks = { bestWin: number; bestLoss: number; currentType: "win" | "loss" | "none"; currentLength: number };

export function StreaksCard({ streaks }: { streaks: Streaks }) {
  const curColor = streaks.currentType === "win" ? "text-emerald-400" : streaks.currentType === "loss" ? "text-rose-400" : "text-muted-foreground";
  const curLabel = streaks.currentType === "win" ? "gain(s) d'affilée" : streaks.currentType === "loss" ? "perte(s) d'affilée" : "aucune série";

  return (
    <Card className="card-glass">
      <CardContent className="grid grid-cols-3 gap-4 p-5">
        <div className="rounded-lg border border-[hsl(var(--gold))]/30 bg-gradient-to-br from-[hsl(var(--gold))]/10 to-transparent p-3">
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
            <Trophy className="h-3 w-3 text-gold" /> Meilleure série
          </div>
          <p className="mt-2 text-2xl font-bold text-gold tabular-nums">{streaks.bestWin}</p>
          <p className="text-[11px] text-muted-foreground">gains consécutifs</p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
            <Snowflake className="h-3 w-3 text-rose-400" /> Pire série
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-400 tabular-nums">{streaks.bestLoss}</p>
          <p className="text-[11px] text-muted-foreground">pertes consécutives</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Série actuelle</p>
          <p className={`mt-2 text-2xl font-bold tabular-nums ${curColor}`}>{streaks.currentLength}</p>
          <p className="text-[11px] text-muted-foreground">{curLabel}</p>
        </div>
      </CardContent>
    </Card>
  );
}
