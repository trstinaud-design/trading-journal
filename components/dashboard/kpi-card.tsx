import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { MetricEmblem, type EmblemKind } from "@/components/dashboard/metric-emblem";
import { cn } from "@/lib/utils/cn";

type Props = {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "win" | "loss" | "neutral";
  emblem?: EmblemKind;
  icon?: LucideIcon;       // fallback (pages secondaires)
  trend?: "up" | "down" | "flat";
  index?: number;          // pour la cascade d'entrée
};

export function KPICard({ label, value, hint, tone = "default", emblem, icon: Icon, trend, index = 0 }: Props) {
  const color =
    tone === "win" ? "text-[hsl(var(--win))]" :
    tone === "loss" ? "text-[hsl(var(--loss))]" :
    tone === "neutral" ? "text-muted-foreground" : "text-foreground";

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <Card
      className="kpi-enter card-glass overflow-hidden transition-colors hover:border-primary/40"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
          {emblem ? (
            <MetricEmblem kind={emblem} />
          ) : Icon ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </div>
          ) : null}
        </div>
        <div className="flex items-baseline gap-2">
          <p className={cn("font-display text-[1.9rem] font-bold leading-none tabular-nums", color)}>
            <CountUp value={value} delay={index * 70} />
          </p>
          {trend && (
            <TrendIcon className={cn("h-4 w-4", trend === "up" ? "text-[hsl(var(--win))]" : trend === "down" ? "text-[hsl(var(--loss))]" : "text-muted-foreground")} />
          )}
        </div>
        {hint && <p className="mt-2 text-xs text-muted-foreground tabular-nums">{hint}</p>}
      </CardContent>
    </Card>
  );
}
