/**
 * Taille d'un pip pour la paire donnée (en unités de prix).
 * - Forex majors (EURUSD, GBPUSD...) : 0.0001
 * - Paires JPY : 0.01
 * - XAUUSD / XAGUSD : 0.01
 * - Indices (US30, NAS100, SPX500) : 1.0
 */
export function pipSize(paire: string): number {
  const p = paire.toUpperCase();
  if (p === "XAUUSD" || p === "GOLD") return 0.01;
  if (p === "XAGUSD" || p === "SILVER") return 0.001;
  if (p.startsWith("US30") || p.startsWith("NAS") || p.startsWith("SPX")) return 1;
  if (p.endsWith("JPY")) return 0.01;
  return 0.0001;
}

/**
 * Valeur d'un pip pour 1 lot standard (100 000 unités), en USD.
 * Approximations pour les paires majors ; à ajuster selon ton broker.
 */
export function pipValuePerLot(paire: string): number {
  const p = paire.toUpperCase();
  if (p === "XAUUSD" || p === "GOLD") return 100;      // 1 lot = 100 oz, pip=0.01 → 1$/tick × 100
  if (p === "XAGUSD" || p === "SILVER") return 50;
  if (p.startsWith("US30") || p.startsWith("NAS") || p.startsWith("SPX")) return 1; // 1 point = 1$/lot
  if (p.endsWith("JPY")) return 9.09;                  // approx pour paires JPY
  return 10;                                            // forex major par défaut
}

/** Distance de stop en pips à partir d'un prix d'entrée et d'un stop loss. */
export function stopDistancePips(paire: string, prixEntree: number, stopLoss: number): number {
  const diff = Math.abs(prixEntree - stopLoss);
  return diff / pipSize(paire);
}

/**
 * Calcule la taille de position en lots.
 * risqueUsd = risque en $
 * slPips    = distance de SL en pips (ou points pour indices/or)
 */
export function computeLotSize(paire: string, risqueUsd: number, slPips: number): number {
  if (slPips <= 0) return 0;
  const pv = pipValuePerLot(paire);
  return risqueUsd / (slPips * pv);
}

/**
 * Raccourci : à partir de prix_entree + stop_loss + capital + risque%, renvoie la taille en lots.
 * Renvoie 0 si un paramètre manque ou incohérent.
 */
export function autoLotSize(paire: string, prixEntree: number | null, stopLoss: number | null, capital: number, riskPct: number): number {
  if (!paire || prixEntree == null || stopLoss == null || prixEntree === stopLoss || capital <= 0 || riskPct <= 0) return 0;
  const risqueUsd = (capital * riskPct) / 100;
  const slPips = stopDistancePips(paire, prixEntree, stopLoss);
  return computeLotSize(paire, risqueUsd, slPips);
}

/**
 * Calcul INVERSE : à partir d'une taille de lot saisie manuellement, retrouve le % de risque.
 * risqueUsd = lots × slPips × pipValue  →  riskPct = risqueUsd / capital × 100
 * Renvoie 0 si un paramètre manque ou incohérent.
 */
export function riskPctFromLots(paire: string, prixEntree: number | null, stopLoss: number | null, capital: number, lots: number): number {
  if (!paire || prixEntree == null || stopLoss == null || prixEntree === stopLoss || capital <= 0 || lots <= 0) return 0;
  const slPips = stopDistancePips(paire, prixEntree, stopLoss);
  const risqueUsd = lots * slPips * pipValuePerLot(paire);
  return (risqueUsd / capital) * 100;
}
