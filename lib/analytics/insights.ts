import type { Trade } from "@/types/database";
import { computeKPIs, byDayOfWeek, type KPIs } from "./metrics";

export type ComboRow = {
  key: string;         // libellé lisible (ex: "Order Block + FVG · Londres")
  parts: string[];     // parties individuelles pour affichage badge
  n: number;
  winRate: number;     // 0-1
  totalR: number;
  profitFactor: number;
  expectancyR: number;
};

/**
 * Retourne les meilleures/pires combinaisons de colonnes.
 * @param trades  trades avec resultat_r renseigné
 * @param columns liste des colonnes à combiner (ex: ["setup_id", "niveau_id", "session"])
 * @param labels  map id → nom pour setup_id / niveau_id
 * @param minTrades minimum de trades pour qu'une combo soit significative
 */
export function combineBy(
  trades: Trade[],
  columns: (keyof Trade)[],
  labels: Record<string, Record<string, string>>,
  minTrades = 3,
): ComboRow[] {
  const map = new Map<string, Trade[]>();

  for (const t of trades) {
    // Ignore les trades sans les valeurs pour toutes les colonnes demandées
    if (columns.some((c) => t[c] === null || t[c] === undefined)) continue;
    const parts = columns.map((c) => {
      const raw = String(t[c]);
      // Traduction id → nom si dispo
      return labels[c as string]?.[raw] ?? raw;
    });
    const key = parts.join(" · ");
    (map.get(key) ?? map.set(key, []).get(key)!).push(t);
  }

  return [...map.entries()]
    .map(([key, ts]) => {
      const k = computeKPIs(ts);
      return {
        key,
        parts: key.split(" · "),
        n: k.totalTrades,
        winRate: k.winRate,
        totalR: Number(k.totalR.toFixed(2)),
        profitFactor: k.profitFactor === Infinity ? 999 : Number(k.profitFactor.toFixed(2)),
        expectancyR: Number(k.expectancyR.toFixed(2)),
      };
    })
    .filter((r) => r.n >= minTrades)
    .sort((a, b) => b.totalR - a.totalR);
}

// ============================================================================
// GÉNÉRATION DE CONSEILS
// ============================================================================

export type Advice = {
  tone: "positive" | "warning" | "info" | "tip";
  title: string;
  text: string;
};

const SESSION_LABEL: Record<string, string> = {
  asie: "session Asie", londres: "session Londres", ny: "session New York",
  chevauchement_ldn_ny: "chevauchement Londres/NY", hors_timing: "trades hors timing",
};
const EMOTION_LABEL: Record<string, string> = {
  calme: "calme", confiant: "confiant", impatient: "impatient",
  fomo: "FOMO", revenge: "revenge trading", stresse: "stressé",
};

/**
 * Génère des conseils basés sur des règles simples appliquées aux stats.
 * Volontairement conservateur : n'affirme rien avec < 5 trades.
 */
export function generateAdvice(
  trades: Trade[],
  labels: { setup: Record<string, string>; niveau: Record<string, string> },
): Advice[] {
  const advice: Advice[] = [];
  const k = computeKPIs(trades);

  // Pas assez de données
  if (k.totalTrades < 5) {
    advice.push({
      tone: "info",
      title: "Encore trop peu de trades",
      text: `Tu n'as que ${k.totalTrades} trade${k.totalTrades > 1 ? "s" : ""}. Les analyses statistiques deviennent fiables à partir de 20-30 trades. Continue à logger.`,
    });
    return advice;
  }

  // 1. État général
  if (k.profitFactor >= 1.5 && k.expectancyR > 0.3) {
    advice.push({
      tone: "positive",
      title: `Tu es rentable — PF ${k.profitFactor.toFixed(2)}`,
      text: `Espérance de +${k.expectancyR.toFixed(2)}R par trade. Continue sur cette lancée, ne change pas ta méthode.`,
    });
  } else if (k.profitFactor < 1) {
    advice.push({
      tone: "warning",
      title: "Tu es en perte cumulée",
      text: `Profit Factor ${k.profitFactor.toFixed(2)} < 1. Repasse en démo, isole ce qui marche via cette page, coupe le reste.`,
    });
  }

  // 2. Meilleur jour
  const days = byDayOfWeek(trades).filter((d) => d.n >= 3);
  if (days.length > 0) {
    const bestDay = [...days].sort((a, b) => b.netR - a.netR)[0];
    const worstDay = [...days].sort((a, b) => a.netR - b.netR)[0];
    if (bestDay && bestDay.netR > 0) {
      advice.push({
        tone: "positive",
        title: `${bestDay.jour} est ton meilleur jour`,
        text: `+${bestDay.netR}R sur ${bestDay.n} trades (WR ${bestDay.winRate}%). Priorise ce jour.`,
      });
    }
    if (worstDay && worstDay.netR < -1 && worstDay.jour !== bestDay?.jour) {
      advice.push({
        tone: "warning",
        title: `${worstDay.jour} est ton pire jour`,
        text: `${worstDay.netR}R sur ${worstDay.n} trades (WR ${worstDay.winRate}%). Envisage de skip ce jour ou de réduire la taille.`,
      });
    }
  }

  // 3. Impact du respect du plan
  const respect = trades.filter((t) => t.respect_plan);
  const horsPlan = trades.filter((t) => !t.respect_plan);
  if (respect.length >= 5 && horsPlan.length >= 3) {
    const kR = computeKPIs(respect);
    const kH = computeKPIs(horsPlan);
    const diff = kR.totalR - kH.totalR;
    if (diff > 2) {
      advice.push({
        tone: "tip",
        title: "La discipline te rapporte",
        text: `Tes trades dans le plan (+${kR.totalR.toFixed(2)}R) surperforment tes trades hors-plan (${kH.totalR.toFixed(2)}R) de ${diff.toFixed(2)}R. Le sur-trading te coûte cher.`,
      });
    }
  }

  // 4. Impact de l'émotion
  const byEmo = new Map<string, Trade[]>();
  for (const t of trades) {
    if (!t.emotion) continue;
    (byEmo.get(t.emotion) ?? byEmo.set(t.emotion, []).get(t.emotion)!).push(t);
  }
  const emoRows = [...byEmo.entries()]
    .filter(([, ts]) => ts.length >= 3)
    .map(([emo, ts]) => ({ emo, ...computeKPIs(ts) }))
    .sort((a, b) => a.expectancyR - b.expectancyR);

  const worstEmo = emoRows[0];
  if (worstEmo && worstEmo.expectancyR < -0.3 && ["fomo", "revenge", "stresse", "impatient"].includes(worstEmo.emo)) {
    advice.push({
      tone: "warning",
      title: `Ton pire état mental : ${EMOTION_LABEL[worstEmo.emo]}`,
      text: `Espérance de ${worstEmo.expectancyR.toFixed(2)}R quand tu es ${EMOTION_LABEL[worstEmo.emo]}. Quand tu ressens ça → prends une pause, ne prends pas de trade.`,
    });
  }

  // 5. Pire session
  const bySession = new Map<string, Trade[]>();
  for (const t of trades) {
    if (!t.session) continue;
    (bySession.get(t.session) ?? bySession.set(t.session, []).get(t.session)!).push(t);
  }
  const sessRows = [...bySession.entries()]
    .filter(([, ts]) => ts.length >= 4)
    .map(([s, ts]) => ({ s, ...computeKPIs(ts) }))
    .sort((a, b) => a.totalR - b.totalR);

  if (sessRows[0] && sessRows[0].totalR < -1) {
    advice.push({
      tone: "warning",
      title: `Évite la ${SESSION_LABEL[sessRows[0].s]}`,
      text: `${sessRows[0].totalR.toFixed(2)}R cumulés sur ${sessRows[0].totalTrades} trades. Cette session ne te réussit pas.`,
    });
  }
  if (sessRows[sessRows.length - 1] && sessRows[sessRows.length - 1].totalR > 2) {
    const best = sessRows[sessRows.length - 1];
    advice.push({
      tone: "positive",
      title: `Ton créneau en or : ${SESSION_LABEL[best.s]}`,
      text: `+${best.totalR.toFixed(2)}R sur ${best.totalTrades} trades (WR ${Math.round(best.winRate * 100)}%). Concentre-toi sur ce moment.`,
    });
  }

  // 6. Streak
  const chrono = [...trades]
    .filter((t) => t.resultat_r !== null && t.resultat_r !== 0)
    .sort((a, b) => a.date_entree.localeCompare(b.date_entree));
  let cur = 0;
  let curType: "w" | "l" | null = null;
  for (const t of chrono) {
    const type = (t.resultat_r ?? 0) > 0 ? "w" : "l";
    if (type === curType) cur += 1;
    else { curType = type; cur = 1; }
  }
  if (curType === "l" && cur >= 3) {
    advice.push({
      tone: "warning",
      title: `${cur} pertes consécutives`,
      text: "Séquence rouge en cours. Réduis la taille (ou pause 24h) jusqu'à retrouver un vert. Le tilt tue les comptes.",
    });
  }

  // 7. Meilleure combinaison setup+niveau
  const combos = combineBy(trades, ["setup_id", "niveau_id"], { setup_id: labels.setup, niveau_id: labels.niveau }, 3);
  if (combos.length > 0 && combos[0].totalR > 2 && combos[0].winRate > 0.55) {
    advice.push({
      tone: "tip",
      title: `Ton meilleur combo : ${combos[0].key}`,
      text: `+${combos[0].totalR}R sur ${combos[0].n} trades (WR ${Math.round(combos[0].winRate * 100)}%, PF ${combos[0].profitFactor}). Cherche activement cette configuration.`,
    });
  }

  return advice;
}
