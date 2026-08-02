import type { Trade } from "@/types/database";

export type KPIs = {
  totalTrades: number;
  wins: number;
  losses: number;
  breakEven: number;
  winRate: number;          // 0-1
  profitFactor: number;     // gains / |losses|
  totalR: number;
  totalUsd: number;
  avgWinR: number;
  avgLossR: number;         // valeur absolue
  expectancyR: number;      // WinRate*avgWin - LossRate*avgLoss
  maxDrawdownR: number;
};

/** Ne compte pas les trades sans résultat_r renseigné. */
export function computeKPIs(trades: Trade[]): KPIs {
  const scored = trades.filter((t) => t.resultat_r !== null);
  const total = scored.length;

  const wins = scored.filter((t) => (t.resultat_r ?? 0) > 0);
  const losses = scored.filter((t) => (t.resultat_r ?? 0) < 0);
  const be = scored.filter((t) => (t.resultat_r ?? 0) === 0);

  const totalR = scored.reduce((s, t) => s + (t.resultat_r ?? 0), 0);
  const totalUsd = trades.reduce((s, t) => s + (t.resultat_usd ?? 0), 0);

  const gainsR = wins.reduce((s, t) => s + (t.resultat_r ?? 0), 0);
  const lossesR = Math.abs(losses.reduce((s, t) => s + (t.resultat_r ?? 0), 0));
  const profitFactor = lossesR > 0 ? gainsR / lossesR : gainsR > 0 ? Infinity : 0;

  const avgWinR = wins.length ? gainsR / wins.length : 0;
  const avgLossR = losses.length ? lossesR / losses.length : 0;
  const winRate = total ? wins.length / total : 0;
  const lossRate = total ? losses.length / total : 0;
  const expectancyR = winRate * avgWinR - lossRate * avgLossR;

  // Max Drawdown en R sur la courbe d'equity chronologique
  const chrono = [...scored].sort((a, b) => a.date_entree.localeCompare(b.date_entree));
  let peak = 0, cum = 0, maxDD = 0;
  for (const t of chrono) {
    cum += t.resultat_r ?? 0;
    if (cum > peak) peak = cum;
    const dd = peak - cum;
    if (dd > maxDD) maxDD = dd;
  }

  return {
    totalTrades: total,
    wins: wins.length,
    losses: losses.length,
    breakEven: be.length,
    winRate,
    profitFactor,
    totalR,
    totalUsd,
    avgWinR,
    avgLossR,
    expectancyR,
    maxDrawdownR: maxDD,
  };
}

/** Courbe cumulée en R (points chronologiques). */
export function equityCurveR(trades: Trade[]) {
  const chrono = [...trades]
    .filter((t) => t.resultat_r !== null)
    .sort((a, b) => a.date_entree.localeCompare(b.date_entree));
  let cum = 0;
  return chrono.map((t) => {
    cum += t.resultat_r ?? 0;
    return { date: t.date_entree.slice(0, 10), cumR: Number(cum.toFixed(3)) };
  });
}

/** Groupe par jour de semaine — Lundi à Vendredi uniquement (marchés fermés le weekend). */
const WEEKDAYS_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
export function byDayOfWeek(trades: Trade[]) {
  const buckets: Record<number, Trade[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (const t of trades) {
    const d = new Date(t.date_entree).getDay();
    if (d >= 1 && d <= 5) buckets[d].push(t);
  }
  return WEEKDAYS_FR.map((label, i) => {
    const kpis = computeKPIs(buckets[i + 1]);
    return {
      jour: label,
      netR: Number(kpis.totalR.toFixed(2)),
      winRate: Math.round(kpis.winRate * 100),
      n: buckets[i + 1].length,
    };
  });
}

/** Agrège par jour calendaire pour heatmap : { date: "YYYY-MM-DD", netR, netUsd, n } */
export function byCalendarDay(trades: Trade[]) {
  const map = new Map<string, { netR: number; netUsd: number; n: number }>();
  for (const t of trades) {
    const key = t.date_entree.slice(0, 10);
    const cur = map.get(key) ?? { netR: 0, netUsd: 0, n: 0 };
    cur.netR += t.resultat_r ?? 0;
    cur.netUsd += t.resultat_usd ?? 0;
    cur.n += 1;
    map.set(key, cur);
  }
  return [...map.entries()].map(([date, v]) => ({ date, ...v }));
}

/** Agrège par clef (setup_id, niveau_id, session, emotion...) → KPIs */
export function groupByKey<K extends keyof Trade>(trades: Trade[], key: K) {
  const map = new Map<string, Trade[]>();
  for (const t of trades) {
    const k = String(t[key] ?? "—");
    (map.get(k) ?? map.set(k, []).get(k)!).push(t);
  }
  return [...map.entries()].map(([k, ts]) => ({ key: k, ...computeKPIs(ts) }));
}
