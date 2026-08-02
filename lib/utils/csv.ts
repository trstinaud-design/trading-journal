import type { Trade } from "@/types/database";

const HEADERS = [
  "date_entree", "paire", "direction", "session", "emotion",
  "prix_entree", "stop_loss", "take_profit", "statut",
  "risque_pct", "taille_lots", "resultat_r", "resultat_usd",
  "setup", "niveau", "respect_plan", "commentaire",
] as const;

/** Sérialise un tableau de trades en CSV RFC 4180. */
export function tradesToCSV(trades: (Trade & { setups?: { nom: string } | null; niveaux?: { nom: string } | null })[]): string {
  const esc = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const lines = [HEADERS.join(",")];
  for (const t of trades) {
    lines.push([
      t.date_entree, t.paire, t.direction, t.session ?? "", t.emotion ?? "",
      t.prix_entree ?? "", t.stop_loss ?? "", t.take_profit ?? "", t.statut,
      t.risque_pct ?? "", t.taille_lots ?? "", t.resultat_r ?? "", t.resultat_usd ?? "",
      t.setups?.nom ?? "", t.niveaux?.nom ?? "", t.respect_plan ? "oui" : "non", t.commentaire ?? "",
    ].map(esc).join(","));
  }
  return lines.join("\n");
}

/** Télécharge un blob côté client. */
export function downloadBlob(content: string, filename: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Parse un CSV en tableau d'objets (première ligne = headers). Gère quotes et échappements. */
export function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++;
    } else {
      if (c === '"') { inQuotes = true; i++; continue; }
      if (c === ",") { row.push(field); field = ""; i++; continue; }
      if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); rows.push(row); row = []; field = ""; i++; continue;
      }
      field += c; i++;
    }
  }
  if (field !== "" || row.length > 0) { row.push(field); rows.push(row); }

  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).filter((r) => r.some((v) => v.trim() !== "")).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = (r[idx] ?? "").trim(); });
    return obj;
  });
}
