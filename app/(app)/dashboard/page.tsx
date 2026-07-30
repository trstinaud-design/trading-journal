import { createClient } from "@/lib/supabase/server";
import { KPICard } from "@/components/dashboard/kpi-card";
import { EquityCurve } from "@/components/dashboard/equity-curve";
import { DoWChart } from "@/components/dashboard/dow-chart";
import { CalendarHeatmap } from "@/components/dashboard/calendar-heatmap";
import { GroupedPerf } from "@/components/dashboard/grouped-perf";
import { computeKPIs, equityCurveR, byDayOfWeek, byCalendarDay, groupByKey } from "@/lib/analytics/metrics";
import type { Trade, Setup, Niveau } from "@/types/database";

const EMOTION_LABEL: Record<string, string> = {
  calme: "Calme", confiant: "Confiant", impatient: "Impatient",
  fomo: "FOMO", revenge: "Revenge", stresse: "Stressé", "—": "Non renseigné",
};
const SESSION_LABEL: Record<string, string> = {
  asie: "Asie", londres: "Londres", ny: "New York",
  chevauchement_ldn_ny: "Chevauchement LDN/NY", hors_timing: "Hors timing", "—": "Non renseigné",
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
  const bySetup = groupByKey(list, "setup_id").filter((r) => r.totalTrades > 0);
  const byNiveau = groupByKey(list, "niveau_id").filter((r) => r.totalTrades > 0);
  const bySession = groupByKey(list, "session").filter((r) => r.totalTrades > 0);
  const byEmotion = groupByKey(list, "emotion").filter((r) => r.totalTrades > 0);

  const respect = list.filter((t) => t.respect_plan);
  const horsPlan = list.filter((t) => !t.respect_plan);
  const kRespect = computeKPIs(respect);
  const kHorsPlan = computeKPIs(horsPlan);

  const pf = k.profitFactor === Infinity ? "∞" : k.profitFactor.toFixed(2);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">{list.length} trade(s) enregistré(s)</p>
      </div>

      {/* A. KPIs Globaux */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <KPICard label="Win Rate" value={`${Math.round(k.winRate * 100)}%`} hint={`${k.wins}W / ${k.losses}L / ${k.breakEven}BE`} tone={k.winRate >= 0.5 ? "win" : "loss"} />
        <KPICard label="Profit Factor" value={pf} tone={k.profitFactor >= 1.5 ? "win" : k.profitFactor >= 1 ? "default" : "loss"} />
        <KPICard label="Total Net" value={`${k.totalR >= 0 ? "+" : ""}${k.totalR.toFixed(2)} R`} hint={`${k.totalUsd >= 0 ? "+" : ""}${k.totalUsd.toFixed(2)} $`} tone={k.totalR >= 0 ? "win" : "loss"} />
        <KPICard label="Espérance" value={`${k.expectancyR >= 0 ? "+" : ""}${k.expectancyR.toFixed(2)} R`} hint={`Avg W ${k.avgWinR.toFixed(2)} / Avg L ${k.avgLossR.toFixed(2)}`} tone={k.expectancyR >= 0 ? "win" : "loss"} />
        <KPICard label="Max Drawdown" value={`${k.maxDrawdownR.toFixed(2)} R`} tone="loss" />
      </div>

      {/* B. Vues temporelles */}
      <div className="grid gap-4 lg:grid-cols-2">
        <EquityCurve data={equity} />
        <CalendarHeatmap data={cal} />
      </div>

      <DoWChart data={dow} />

      {/* C. Analyses comparatives */}
      <div className="grid gap-4 lg:grid-cols-2">
        <GroupedPerf title="Performance par Setup" rows={bySetup} labels={setupLabels} />
        <GroupedPerf title="Performance par Niveau" rows={byNiveau} labels={niveauLabels} />
        <GroupedPerf title="Performance par Session" rows={bySession} labels={SESSION_LABEL} />
        <GroupedPerf title="Émotion vs Performance" rows={byEmotion} labels={EMOTION_LABEL} />
      </div>

      {/* Impact respect du plan */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">Respect du plan (✓)</p>
          <p className="text-3xl font-bold text-[hsl(var(--win))]">{kRespect.totalR >= 0 ? "+" : ""}{kRespect.totalR.toFixed(2)} R</p>
          <p className="text-xs text-muted-foreground">{kRespect.totalTrades} trades • WR {Math.round(kRespect.winRate * 100)}% • PF {kRespect.profitFactor === Infinity ? "∞" : kRespect.profitFactor.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">Hors plan (✗)</p>
          <p className="text-3xl font-bold text-[hsl(var(--loss))]">{kHorsPlan.totalR >= 0 ? "+" : ""}{kHorsPlan.totalR.toFixed(2)} R</p>
          <p className="text-xs text-muted-foreground">{kHorsPlan.totalTrades} trades • WR {Math.round(kHorsPlan.winRate * 100)}% • PF {kHorsPlan.profitFactor === Infinity ? "∞" : kHorsPlan.profitFactor.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
