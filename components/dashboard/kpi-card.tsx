import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

type Props = {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "win" | "loss" | "neutral";
  icon?: LucideIcon;
  trend?: "up" | "down" | "flat";
};

export function KPICard({ label, value, hint, tone = "default", icon: Icon, trend }: Props) {
  const color =
    tone === "win" ? "text-[hsl(var(--win))]" :
    tone === "loss" ? "text-[hsl(var(--loss))]" :
    tone === "neutral" ? "text-muted-foreground" : "text-foreground";

  const iconBg =
    tone === "win" ? "bg-[hsl(var(--win))]/10 text-[hsl(var(--win))]" :
    tone === "loss" ? "bg-[hsl(var(--loss))]/10 text-[hsl(var(--loss))]" :
    tone === "neutral" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary";

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <Card className="card-glass overflow-hidden transition-colors hover:border-primary/40">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
          {Icon && (
            <div className={cn("flex h-7 w-7 items-center justify-center rounded-md border border-border/60", iconBg)}>
              <Icon className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <p className={cn("font-display text-[1.9rem] font-bold leading-none tabular-nums", color)}>{value}</p>
          {trend && (
            <TrendIcon className={cn("h-4 w-4", trend === "up" ? "text-[hsl(var(--win))]" : trend === "down" ? "text-[hsl(var(--loss))]" : "text-muted-foreground")} />
          )}
        </div>
        {hint && <p className="mt-2 text-xs text-muted-foreground tabular-nums">{hint}</p>}
      </CardContent>
    </Card>
  );
}
