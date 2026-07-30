import type { Session } from "@/types/database";

/**
 * Détecte la session de marché en fonction de l'heure locale (Europe/Paris).
 * Plages définies :
 *   - 00h → 08h  Asie
 *   - 09h → 12h  Londres
 *   - 14h → 18h  New York
 *   - 22h → 24h  Asie (préouverture Tokyo)
 *   - reste (08h, 12h-14h, 18h-22h)  Hors timing
 *
 * @param input heure locale sur 0..23, Date, ou string ISO
 */
export function sessionFromHour(input: number | Date | string): Session {
  let h: number;
  if (typeof input === "number") h = input;
  else if (input instanceof Date) h = input.getHours();
  else h = new Date(input).getHours();

  if (h >= 0 && h < 8) return "asie";
  if (h >= 22) return "asie";
  if (h >= 9 && h < 12) return "londres";
  if (h >= 14 && h < 18) return "ny";
  return "hors_timing";
}
