"use client";
import { useMemo, useState } from "react";
import { Target, Zap, DollarSign, Brain, TrendingDown, Wallet } from "lucide-react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { EquityCurve } from "@/components/dashboard/equity-curve";
import { DoWChart } from "@/components/dashboard/dow-chart";
import { CalendarHeatmap } from "@/components/dashboard/calendar-heatmap";
import { GroupedPerf } from "@/components/dashboard/grouped-perf";
import { PerfTable } from "@/components/dashboard/perf-table";
import { SessionPie } from "@/components/dashboard/session-pie";
import { StreaksCard } from "@/components/dashboard/streaks-card";
import { PeriodChart } from "@/components/dashboard/period-chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { computeKPIs, equityCurveR, byDayOfWeek, byCalendarDay, groupByKey, computeStreaks, byPeriod } from "@/lib/analytics/metrics";
import { cn } from "@/lib/utils/cn";
import type { Trade, Setup, Niveau, Compte } from "@/types/database";

const EMOTION_LABEL: Record<string, string> = {
  calme: "Calme", confiant: "Confiant", impatient: "Impatient",
  fomo: "FOMO", revenge: "Revenge", stresse: "Stressé", surexcite: "Surexcité", "—": "Non renseigné",
};

type Props = {
  trades: Trade[];
  comptes: Compte[];
  setups: Pick<Setup, "id" | "nom">[];
  niveaux: Pick<Niveau, "id" | "nom">[];
};

export function DashboardView({ trades, comptes, setups, niveaux }: Props) {
  const [account, setAccount] = useState<string>("all");

  const setupLabels = useMemo(() => Object.fromEntries(setups.map((s) => [s.id, s.nom])), [setups]);
  const niveauLabels = useMemo(() => Object.fromEntries(niveaux.map((n) => [n.id, n.nom])), [niveaux]);

  // Filtre par compte sélectionné
  const list = useMemo(
    () => (account === "all" ? trades : trades.filter((t) => t.compte_id === account)),
    [trades, account],
  );

  const k = useMemo(() => computeKPIs(list), [list]);
  const equity = useMemo(() => equityCurveR(list), [list]);
  const dow = useMemo(() => byDayOfWeek(list), [list]);
  const cal = useMemo(() => byCalendarDay(list), [list]);
  const streaks = useMemo(() => computeStreaks(list), [list]);
  const periodData = useMemo(() => ({
    week: byPeriod(list, "week"),
    month: byPeriod(list, "month"),
    quarter: byPeriod(list, "quarter"),
  }), [list]);
  const bySetup = useMemo(() => groupByKey(list, "setup_id").filter((r) => r.totalTrades > 0), [list]);
  const byNiveau = useMemo(() => groupByKey(list, "niveau_id").filter((r) => r.totalTrades > 0), [list]);
  const byEmotion = useMemo(() => groupByKey(list, "emotion").filter((r) => r.totalTrades > 0), [list]);

  const kRespect = useMemo(() => computeKPIs(list.filter((t) => t.respect_plan)), [list]);
  const kHorsPlan = useMemo(() => computeKPIs(list.filter((t) => !t.respect_plan)), [list]);

  const pf = k.profitFactor === Infinity ? "∞" : k.profitFactor.toFixed(2);

  const selectedCompte = comptes.find((c) => c.id === account);
  const capitalInitial = account === "all"
    ? comptes.reduce((s, c) => s + c.capital_initial, 0)
    : selectedCompte?.capital_initial ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {list.length} trade{list.length > 1 ? "s" : ""}
            {account !== "all" && selectedCompte && <> · {selectedCompte.nom}</>}
            {capitalInitial > 0 && <> · capital {capitalInitial.toLocaleString()}$</>}
          </p>
        </div>

        {/* Sélecteur de compte */}
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <Select value={account} onValueChange={setAccount}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🌐 Tous les comptes ({comptes.length})</SelectItem>
              {comptes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nom}{c.statut === "crame" ? " 🔒" : ""} · {c.type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedCompte?.statut === "crame" && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-400">
          🔒 Compte <strong>cramé</strong> — historique et statistiques consultables, mais en lecture seule (aucun nouveau trade possible).
        </div>
      )}

      {/* A. KPIs Globaux */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <KPICard label="Win Rate" value={`${Math.round(k.winRate * 100)}%`} hint={`${k.wins}W / ${k.losses}L / ${k.breakEven}BE`} tone={k.winRate >= 0.5 ? "win" : "loss"} icon={Target} trend={k.winRate >= 0.5 ? "up" : "down"} />
        <KPICard label="Profit Factor" value={pf} tone={k.profitFactor >= 1.5 ? "win" : k.profitFactor >= 1 ? "default" : "loss"} icon={Zap} trend={k.profitFactor >= 1 ? "up" : "down"} />
        <KPICard label="Total Net" value={`${k.totalR >= 0 ? "+" : ""}${k.totalR.toFixed(2)} R`} hint={`${k.totalUsd >= 0 ? "+" : ""}${k.totalUsd.toFixed(2)} $`} tone={k.totalR >= 0 ? "win" : "loss"} icon={DollarSign} trend={k.totalR >= 0 ? "up" : "down"} />
        <KPICard label="Espérance" value={`${k.expectancyR >= 0 ? "+" : ""}${k.expectancyR.toFixed(2)} R`} hint={`Avg W ${k.avgWinR.toFixed(2)} / Avg L ${k.avgLossR.toFixed(2)}`} tone={k.expectancyR >= 0 ? "win" : "loss"} icon={Brain} trend={k.expectancyR >= 0 ? "up" : "down"} />
        <KPICard label="Max Drawdown" value={`${k.maxDrawdownR.toFixed(2)} R`} tone="loss" icon={TrendingDown} />
      </div>

      <StreaksCard streaks={streaks} />

      <div className="grid gap-4 lg:grid-cols-2">
        <EquityCurve data={equity} />
        <CalendarHeatmap data={cal} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PeriodChart data={periodData} />
        <DoWChart data={dow} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PerfTable title="Performance par Setup" rows={bySetup} labels={setupLabels} columnLabel="Setup" />
        <PerfTable title="Performance par Niveau" rows={byNiveau} labels={niveauLabels} columnLabel="Niveau" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SessionPie trades={list} />
        <GroupedPerf title="Émotion vs Performance" rows={byEmotion} labels={EMOTION_LABEL} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className={cn("card-glass rounded-xl border border-emerald-500/20 p-5")}>
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
