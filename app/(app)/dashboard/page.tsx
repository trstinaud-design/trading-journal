import { Target, Zap, DollarSign, Brain, TrendingDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { KPICard } from "@/components/dashboard/kpi-card";
import { EquityCurve } from "@/components/dashboard/equity-curve";
import { DoWChart } from "@/components/dashboard/dow-chart";
import { CalendarHeatmap } from "@/components/dashboard/calendar-heatmap";
import { GroupedPerf } from "@/components/dashboard/grouped-perf";
import { PerfTable } from "@/components/dashboard/perf-table";
import { SessionPie } from "@/components/dashboard/session-pie";
import { StreaksCard } from "@/components/dashboard/streaks-card";
import { PeriodChart } from "@/components/dashboard/period-chart";
import { computeKPIs, equityCurveR, byDayOfWeek, byCalendarDay, groupByKey, computeStreaks, byPeriod } from "@/lib/analytics/metrics";
import type { Trade, Setup, Niveau } from "@/types/database";

const EMOTION_LABEL: Record<string, string> = {
  calme: "Calme", confiant: "Confiant", impatient: "Impatient",
  fomo: "FOMO", revenge: "Revenge", stresse: "Stressé", surexcite: "Surexcité", "—": "Non renseigné",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const [{ data: trades }, { data: setups }, { data: niveaux }] = await Promise.all([
    supabase.from("trades").select("*").order("date_entree"),
    supabase.from("setups").select("id, nom"),
    supabase.from("niveaux").select("id, nom"),
  ]);

  const list = (trades as Trade[]) ?? [];
  const setupLabels = Object.fromEntries((setups as Pick<Setup, "id" | "nom">[] ?? []).map((s) => [s.id, s.nom]));
  const niveauLabels = Object.fromEntries((niveaux as Pick<Niveau, "id" | "nom">[] ?? []).map((n) => [n.id, n.nom]));

  const k = computeKPIs(list);
  const equity = equityCurveR(list);
  const dow = byDayOfWeek(list);
  const cal = byCalendarDay(list);
  const streaks = computeStreaks(list);
  const periodData = {
    week: byPeriod(list, "week"),
    month: byPeriod(list, "month"),
    quarter: byPeriod(list, "quarter"),
  };
  const bySetup = groupByKey(list, "setup_id").filter((r) => r.totalTrades > 0);
  const byNiveau = groupByKey(list, "niveau_id").filter((r) => r.totalTrades > 0);
  const byEmotion = groupByKey(list, "emotion").filter((r) => r.totalTrades > 0);

  const respect = list.filter((t) => t.respect_plan);
  const horsPlan = list.filter((t) => !t.respect_plan);
  const kRespect = computeKPIs(respect);
  const kHorsPlan = computeKPIs(horsPlan);

  const pf = k.profitFactor === Infinity ? "∞" : k.profitFactor.toFixed(2);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">{list.length} trade{list.length > 1 ? "s" : ""} enregistré{list.length > 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* A. KPIs Globaux */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <KPICard label="Win Rate" value={`${Math.round(k.winRate * 100)}%`} hint={`${k.wins}W / ${k.losses}L / ${k.breakEven}BE`} tone={k.winRate >= 0.5 ? "win" : "loss"} icon={Target} trend={k.winRate >= 0.5 ? "up" : "down"} />
        <KPICard label="Profit Factor" value={pf} tone={k.profitFactor >= 1.5 ? "win" : k.profitFactor >= 1 ? "default" : "loss"} icon={Zap} trend={k.profitFactor >= 1 ? "up" : "down"} />
        <KPICard label="Total Net" value={`${k.totalR >= 0 ? "+" : ""}${k.totalR.toFixed(2)} R`} hint={`${k.totalUsd >= 0 ? "+" : ""}${k.totalUsd.toFixed(2)} $`} tone={k.totalR >= 0 ? "win" : "loss"} icon={DollarSign} trend={k.totalR >= 0 ? "up" : "down"} />
        <KPICard label="Espérance" value={`${k.expectancyR >= 0 ? "+" : ""}${k.expectancyR.toFixed(2)} R`} hint={`Avg W ${k.avgWinR.toFixed(2)} / Avg L ${k.avgLossR.toFixed(2)}`} tone={k.expectancyR >= 0 ? "win" : "loss"} icon={Brain} trend={k.expectancyR >= 0 ? "up" : "down"} />
        <KPICard label="Max Drawdown" value={`${k.maxDrawdownR.toFixed(2)} R`} tone="loss" icon={TrendingDown} />
      </div>

      {/* Streaks */}
      <StreaksCard streaks={streaks} />

      {/* Vues temporelles */}
      <div className="grid gap-4 lg:grid-cols-2">
        <EquityCurve data={equity} />
        <CalendarHeatmap data={cal} />
      </div>

      {/* Perf périodes + jours (côte-à-côte) */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PeriodChart data={periodData} />
        <DoWChart data={dow} />
      </div>

      {/* Perf Setup + Niveau (tables côte-à-côte, style mitrad) */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PerfTable title="Performance par Setup" rows={bySetup} labels={setupLabels} columnLabel="Setup" />
        <PerfTable title="Performance par Niveau" rows={byNiveau} labels={niveauLabels} columnLabel="Niveau" />
      </div>

      {/* Session (pie) + Émotion (bars) côte-à-côte */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SessionPie trades={list} />
        <GroupedPerf title="Émotion vs Performance" rows={byEmotion} labels={EMOTION_LABEL} />
      </div>

      {/* Impact respect du plan */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card-glass rounded-xl border border-emerald-500/20 p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/15 text-xs font-bold text-emerald-400">✓</span>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Respect du plan</p>
          </div>
          <p className="mt-3 text-3xl font-bold tabular-nums text-emerald-400">{kRespect.totalR >= 0 ? "+" : ""}{kRespect.totalR.toFixed(2)} R</p>
          <p className="mt-1 text-xs text-muted-foreground">{kRespect.totalTrades} trades • WR {Math.round(kRespect.winRate * 100)}% • PF {kRespect.profitFactor === Infinity ? "∞" : kRespect.profitFactor.toFixed(2)}</p>
        </div>
        <div className="card-glass rounded-xl border border-rose-500/20 p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-500/15 text-xs font-bold text-rose-400">✗</span>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Hors plan</p>
          </div>
          <p className="mt-3 text-3xl font-bold tabular-nums text-rose-400">{kHorsPlan.totalR >= 0 ? "+" : ""}{kHorsPlan.totalR.toFixed(2)} R</p>
          <p className="mt-1 text-xs text-muted-foreground">{kHorsPlan.totalTrades} trades • WR {Math.round(kHorsPlan.winRate * 100)}% • PF {kHorsPlan.profitFactor === Infinity ? "∞" : kHorsPlan.profitFactor.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
