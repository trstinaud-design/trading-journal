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
    tone === "win" ? "text-emerald-400" :
    tone === "loss" ? "text-rose-400" :
    tone === "neutral" ? "text-muted-foreground" : "";

  const iconBg =
    tone === "win" ? "bg-emerald-500/10 text-emerald-400" :
    tone === "loss" ? "bg-rose-500/10 text-rose-400" :
    tone === "neutral" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary";

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <Card className="card-glass overflow-hidden transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          {Icon && (
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", iconBg)}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <p className={cn("text-3xl font-bold tabular-nums leading-none", color)}>{value}</p>
          {trend && (
            <TrendIcon className={cn("h-4 w-4", trend === "up" ? "text-emerald-400" : trend === "down" ? "text-rose-400" : "text-muted-foreground")} />
          )}
        </div>
        {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
