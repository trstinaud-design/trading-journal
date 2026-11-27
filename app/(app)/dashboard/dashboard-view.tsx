"use client";
import { useMemo, useState } from "react";
import { Wallet } from "lucide-react";
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
import { computeKPIs, equityCurveR, byDayOfWeek, byCalendarDay, groupByKey, groupByArrayKey, computeStreaks, byPeriod } from "@/lib/analytics/metrics";
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

const MONTHS_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

export function DashboardView({ trades, comptes, setups, niveaux }: Props) {
  const [account, setAccount] = useState<string>("all");
  const [year, setYear] = useState<string>("all");   // "all" | "2026"...
  const [month, setMonth] = useState<string>("all");  // "all" | "0".."11"

  const setupLabels = useMemo(() => Object.fromEntries(setups.map((s) => [s.id, s.nom])), [setups]);
  const niveauLabels = useMemo(() => Object.fromEntries(niveaux.map((n) => [n.id, n.nom])), [niveaux]);

  // Années présentes dans les trades (desc)
  const years = useMemo(
    () => [...new Set(trades.map((t) => new Date(t.date_entree).getFullYear()))].sort((a, b) => b - a),
    [trades],
  );

  // Filtre par compte + année + mois
  const list = useMemo(() => trades.filter((t) => {
    if (account !== "all" && t.compte_id !== account) return false;
    const d = new Date(t.date_entree);
    if (year !== "all" && d.getFullYear() !== Number(year)) return false;
    if (month !== "all" && d.getMonth() !== Number(month)) return false;
    return true;
  }), [trades, account, year, month]);

  const periodLabel = year === "all"
    ? (month === "all" ? "Depuis le début" : `${MONTHS_FR[Number(month)]} (toutes années)`)
    : (month === "all" ? `Année ${year}` : `${MONTHS_FR[Number(month)]} ${year}`);

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
  const bySetup = useMemo(() => groupByArrayKey(list, "setup_ids").filter((r) => r.totalTrades > 0), [list]);
  const byNiveau = useMemo(() => groupByArrayKey(list, "niveau_ids").filter((r) => r.totalTrades > 0), [list]);
  const byEmotion = useMemo(() => groupByKey(list, "emotion").filter((r) => r.totalTrades > 0), [list]);

  const kRespect = useMemo(() => computeKPIs(list.filter((t) => t.respect_plan)), [list]);
  const kHorsPlan = useMemo(() => computeKPIs(list.filter((t) => !t.respect_plan)), [list]);

  const pf = k.profitFactor === Infinity ? "∞" : k.profitFactor.toFixed(2);

  const selectedCompte = comptes.find((c) => c.id === account);
  const capitalInitial = account === "all"
    ? comptes.reduce((s, c) => s + c.capital_initial, 0)
    : selectedCompte?.capital_initial ?? 0;
  // P&L % = gain net en $ rapporté au capital initial (comme mitradacademy)
  const pnlPct = capitalInitial > 0 ? (k.totalUsd / capitalInitial) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {list.length} trade{list.length > 1 ? "s" : ""} · {periodLabel}
            {account !== "all" && selectedCompte && <> · {selectedCompte.nom}</>}
          </p>
        </div>

        {/* Sélecteurs : Année · Mois · Compte */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">📅 Toutes années</SelectItem>
              {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les mois</SelectItem>
              {MONTHS_FR.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <Select value={account} onValueChange={setAccount}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
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
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <KPICard index={0} label="Win Rate" value={`${Math.round(k.winRate * 100)}%`} hint={`${k.wins}W / ${k.losses}L / ${k.breakEven}BE`} tone={k.winRate >= 0.5 ? "win" : "loss"} emblem="winrate" trend={k.winRate >= 0.5 ? "up" : "down"} />
        <KPICard index={1} label="Profit Factor" value={pf} tone={k.profitFactor >= 1.5 ? "win" : k.profitFactor >= 1 ? "default" : "loss"} emblem="pf" trend={k.profitFactor >= 1 ? "up" : "down"} />
        <KPICard index={2} label="P&L %" value={`${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%`} hint={capitalInitial > 0 ? `sur ${capitalInitial.toLocaleString()}$` : "capital non défini"} tone={pnlPct >= 0 ? "win" : "loss"} emblem="pnl" trend={pnlPct >= 0 ? "up" : "down"} />
        <KPICard index={3} label="Total Net" value={`${k.totalR >= 0 ? "+" : ""}${k.totalR.toFixed(2)} R`} hint={`${k.totalUsd >= 0 ? "+" : ""}${k.totalUsd.toFixed(2)} $`} tone={k.totalR >= 0 ? "win" : "loss"} emblem="net" trend={k.totalR >= 0 ? "up" : "down"} />
        <KPICard index={4} label="Espérance" value={`${k.expectancyR >= 0 ? "+" : ""}${k.expectancyR.toFixed(2)} R`} hint={`Avg W ${k.avgWinR.toFixed(2)} / Avg L ${k.avgLossR.toFixed(2)}`} tone={k.expectancyR >= 0 ? "win" : "loss"} emblem="expectancy" trend={k.expectancyR >= 0 ? "up" : "down"} />
        <KPICard index={5} label="Max Drawdown" value={`${k.maxDrawdownR.toFixed(2)} R`} tone="loss" emblem="drawdown" />
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
