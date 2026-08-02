"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { parseCSV } from "@/lib/utils/csv";
import type { Direction, TradeStatus, Session, Emotion } from "@/types/database";

type Ref = { id: string; nom: string };

/** Nettoie un token pour matcher par nom (case-insensitive, trim). */
function findByName<T extends Ref>(items: T[], name: string | undefined): string | null {
  if (!name) return null;
  const norm = name.trim().toLowerCase();
  return items.find((x) => x.nom.trim().toLowerCase() === norm)?.id ?? null;
}

function parseNum(s: string | undefined): number | null {
  if (!s) return null;
  const n = Number(s.replace(",", "."));
  return isNaN(n) ? null : n;
}

const DIRS: Direction[] = ["long", "short"];
const STATUSES: TradeStatus[] = ["tp", "sl", "be", "manuel"];
const SESSIONS: Session[] = ["asie", "londres", "ny", "chevauchement_ldn_ny", "hors_timing"];
const EMOTIONS: Emotion[] = ["calme", "confiant", "impatient", "fomo", "revenge", "stresse"];

export function ImportClient({ comptes, setups, niveaux }: { comptes: Ref[]; setups: Ref[]; niveaux: Ref[] }) {
  const router = useRouter();
  const [compteId, setCompteId] = useState(comptes[0]?.id ?? "");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: number; ko: number; errors: string[] } | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setRows(parseCSV(String(reader.result ?? "")));
    reader.readAsText(f);
    setResult(null);
  }

  async function runImport() {
    if (rows.length === 0) return toast.error("Aucune ligne à importer");
    if (!compteId) return toast.error("Sélectionne un compte");
    setImporting(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setImporting(false); return toast.error("Non connecté"); }

    let ok = 0, ko = 0;
    const errors: string[] = [];

    // Insertions séquentielles pour reporter les erreurs précisément
    for (const [idx, r] of rows.entries()) {
      const direction = r.direction?.toLowerCase() as Direction;
      const statut = r.statut?.toLowerCase() as TradeStatus;
      const session = (r.session?.toLowerCase() || null) as Session | null;
      const emotion = (r.emotion?.toLowerCase() || null) as Emotion | null;

      if (!DIRS.includes(direction)) { ko++; errors.push(`Ligne ${idx + 2}: direction invalide "${r.direction}"`); continue; }
      if (!STATUSES.includes(statut)) { ko++; errors.push(`Ligne ${idx + 2}: statut invalide "${r.statut}"`); continue; }
      if (session && !SESSIONS.includes(session)) { ko++; errors.push(`Ligne ${idx + 2}: session invalide "${r.session}"`); continue; }
      if (emotion && !EMOTIONS.includes(emotion)) { ko++; errors.push(`Ligne ${idx + 2}: émotion invalide "${r.emotion}"`); continue; }
      if (!r.date_entree || !r.paire) { ko++; errors.push(`Ligne ${idx + 2}: date_entree ou paire manquante`); continue; }

      const payload = {
        user_id: user.id,
        compte_id: compteId,
        date_entree: new Date(r.date_entree).toISOString(),
        paire: r.paire.toUpperCase(),
        direction,
        session,
        emotion,
        prix_entree: parseNum(r.prix_entree),
        stop_loss: parseNum(r.stop_loss),
        take_profit: parseNum(r.take_profit),
        statut,
        risque_pct: parseNum(r.risque_pct),
        taille_lots: parseNum(r.taille_lots),
        resultat_r: parseNum(r.resultat_r),
        resultat_usd: parseNum(r.resultat_usd),
        setup_id: findByName(setups, r.setup),
        niveau_id: findByName(niveaux, r.niveau),
        respect_plan: r.respect_plan?.toLowerCase() !== "non",
        commentaire: r.commentaire || null,
      };

      const { error } = await supabase.from("trades").insert(payload);
      if (error) { ko++; errors.push(`Ligne ${idx + 2}: ${error.message}`); }
      else ok++;
    }

    setImporting(false);
    setResult({ ok, ko, errors: errors.slice(0, 20) });
    if (ok > 0) toast.success(`${ok} trade(s) importé(s)`);
    if (ko > 0) toast.error(`${ko} ligne(s) rejetée(s) — voir détails`);
    if (ok > 0 && ko === 0) setTimeout(() => router.push("/trades"), 1500);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-3xl font-bold">Import CSV</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Charge un CSV pour créer plusieurs trades d&apos;un coup. Format attendu : mêmes colonnes que l&apos;export.
        </p>
      </div>

      <Card className="card-glass">
        <CardHeader>
          <CardTitle className="text-base">1 · Sélectionne le compte cible</CardTitle>
          <CardDescription>Les trades importés seront rattachés à ce compte.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-w-xs">
            <Label>Compte</Label>
            <Select value={compteId} onValueChange={setCompteId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {comptes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="card-glass">
        <CardHeader>
          <CardTitle className="text-base">2 · Charge ton fichier CSV</CardTitle>
          <CardDescription>Headers attendus : date_entree, paire, direction, session, emotion, prix_entree, stop_loss, take_profit, statut, risque_pct, taille_lots, resultat_r, resultat_usd, setup, niveau, respect_plan, commentaire</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-input p-8 hover:bg-accent/50">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="mt-2 text-sm">Cliquer ou déposer un CSV</span>
            <input type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
          </label>

          {rows.length > 0 && (
            <div className="rounded-md border p-3 text-sm">
              ✅ <strong>{rows.length}</strong> ligne(s) détectée(s) — colonnes : <span className="text-muted-foreground">{Object.keys(rows[0]).join(", ")}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="card-glass">
        <CardHeader>
          <CardTitle className="text-base">3 · Lancer l&apos;import</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={runImport} disabled={importing || rows.length === 0 || !compteId} className="gradient-primary text-white">
            {importing ? "Import en cours..." : `Importer ${rows.length} trade(s)`}
          </Button>

          {result && (
            <div className="space-y-2">
              <p className="text-sm">
                <CheckCircle2 className="inline h-4 w-4 text-emerald-400" /> <strong>{result.ok}</strong> importé(s)
                {result.ko > 0 && <> · <AlertCircle className="inline h-4 w-4 text-rose-400" /> <strong>{result.ko}</strong> rejeté(s)</>}
              </p>
              {result.errors.length > 0 && (
                <ul className="max-h-48 overflow-y-auto rounded-md border bg-muted/30 p-2 text-xs">
                  {result.errors.map((e, i) => <li key={i} className="text-rose-400">• {e}</li>)}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
