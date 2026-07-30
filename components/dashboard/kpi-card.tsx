import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

type Props = {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "win" | "loss" | "neutral";
};

export function KPICard({ label, value, hint, tone = "default" }: Props) {
  const color =
    tone === "win" ? "text-[hsl(var(--win))]" :
    tone === "loss" ? "text-[hsl(var(--loss))]" :
    tone === "neutral" ? "text-muted-foreground" : "";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold tabular-nums", color)}>{value}</div>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
