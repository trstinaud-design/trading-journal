"use client";
import { cn } from "@/lib/utils/cn";
import type { Timeframe } from "@/types/database";

export const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: "1m", label: "1m" },
  { value: "3m", label: "3m" },
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "30m", label: "30m" },
  { value: "1h", label: "1H" },
  { value: "4h", label: "4H" },
  { value: "daily", label: "D" },
  { value: "weekly", label: "W" },
  { value: "monthly", label: "M" },
];

/** Multi-sélecteur de timeframes sous forme de puces cliquables. */
export function TimeframePicker({
  value,
  onChange,
  size = "default",
}: {
  value: Timeframe[];
  onChange: (tfs: Timeframe[]) => void;
  size?: "default" | "sm";
}) {
  function toggle(tf: Timeframe) {
    onChange(value.includes(tf) ? value.filter((t) => t !== tf) : [...value, tf]);
  }
  return (
    <div className="flex flex-wrap gap-1">
      {TIMEFRAMES.map((tf) => {
        const active = value.includes(tf.value);
        return (
          <button
            key={tf.value}
            type="button"
            onClick={() => toggle(tf.value)}
            className={cn(
              "rounded-md border font-semibold transition-all",
              size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
              active
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-muted/40 text-muted-foreground hover:bg-accent",
            )}
          >
            {tf.label}
          </button>
        );
      })}
    </div>
  );
}

/** Affichage lecture seule des timeframes (badges). */
export function TimeframeBadges({ value }: { value: Timeframe[] }) {
  if (!value || value.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
  const map = Object.fromEntries(TIMEFRAMES.map((t) => [t.value, t.label]));
  return (
    <div className="flex flex-wrap gap-1">
      {value.map((tf) => (
        <span key={tf} className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{map[tf] ?? tf}</span>
      ))}
    </div>
  );
}
