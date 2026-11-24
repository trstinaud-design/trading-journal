"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Pencil, Trash2, Image as ImageIcon, X, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lightbox, type LightboxImage } from "@/components/ui/lightbox";
import { PairFlag } from "@/components/ui/pair-flag";
import { cn } from "@/lib/utils/cn";
import { TradesToolbar } from "./trades-toolbar";
import type { Trade, Setup, Niveau } from "@/types/database";

const KIND_LABEL: Record<string, string> = { avant: "Avant", pendant: "Pendant", apres: "Après" };
const KIND_ORDER: Record<string, number> = { avant: 0, pendant: 1, apres: 2 };

type TradeRow = Trade & {
  setups?: { nom: string } | null;
  niveaux?: { nom: string } | null;
  comptes?: { nom: string; capital_initial: number; devise: string } | null;
};

const STATUT_COLOR: Record<string, string> = {
  tp: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
  sl: "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30",
  be: "bg-muted text-muted-foreground ring-1 ring-border",
  manuel: "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30",
};

const STATUT_LABEL: Record<string, string> = { tp: "WIN", sl: "LOSS", be: "BE", manuel: "MANUEL" };

const TABS = [
  { key: "all", label: "Tous" },
  { key: "tp", label: "Wins" },
  { key: "sl", label: "Losses" },
  { key: "be", label: "BE" },
] as const;

type TabKey = (typeof TABS)[number]["key"];
type SortKey = "date_desc" | "date_asc" | "r_desc" | "r_asc";

export function TradesView({
  trades,
  setups,
  niveaux,
}: {
  trades: TradeRow[];
  setups: Pick<Setup, "id" | "nom">[];
  niveaux: Pick<Niveau, "id" | "nom">[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("all");
  const [pair, setPair] = useState<string>("all");
  const [session, setSession] = useState<string>("all");
  const [direction, setDirection] = useState<string>("all");
  const [setupId, setSetupId] = useState<string>("all");
  const [emotion, setEmotion] = useState<string>("all");
  const [statut, setStatut] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("date_desc");

  // Options distinctes
  const distinctPairs = useMemo(() => [...new Set(trades.map((t) => t.paire))].sort(), [trades]);
  const distinctEmotions = useMemo(() => [...new Set(trades.map((t) => t.emotion).filter(Boolean) as string[])].sort(), [trades]);
  const distinctSessions = useMemo(() => [...new Set(trades.map((t) => t.session).filter(Boolean) as string[])].sort(), [trades]);

  const filtered = useMemo(() => {
    let list = trades;
    if (tab !== "all") list = list.filter((t) => t.statut === tab);
    if (pair !== "all") list = list.filter((t) => t.paire === pair);
    if (session !== "all") list = list.filter((t) => t.session === session);
    if (direction !== "all") list = list.filter((t) => t.direction === direction);
    if (setupId !== "all") list = list.filter((t) => t.setup_id === setupId);
    if (emotion !== "all") list = list.filter((t) => t.emotion === emotion);
    if (statut !== "all") list = list.filter((t) => t.statut === statut);
    if (dateFrom) list = list.filter((t) => t.date_entree >= dateFrom);
    if (dateTo) list = list.filter((t) => t.date_entree <= dateTo + "T23:59:59");

    // Tri
    list = [...list];
    if (sort === "date_desc") list.sort((a, b) => b.date_entree.localeCompare(a.date_entree));
    if (sort === "date_asc") list.sort((a, b) => a.date_entree.localeCompare(b.date_entree));
    if (sort === "r_desc") list.sort((a, b) => (b.resultat_r ?? 0) - (a.resultat_r ?? 0));
    if (sort === "r_asc") list.sort((a, b) => (a.resultat_r ?? 0) - (b.resultat_r ?? 0));

    return list;
  }, [trades, tab, pair, session, direction, setupId, emotion, statut, dateFrom, dateTo, sort]);

  // Compteurs par onglet
  const tabCounts = useMemo(() => ({
    all: trades.length,
    tp: trades.filter((t) => t.statut === "tp").length,
    sl: trades.filter((t) => t.statut === "sl").length,
    be: trades.filter((t) => t.statut === "be").length,
  }), [trades]);

  const activeFilters =
    (pair !== "all" ? 1 : 0) + (session !== "all" ? 1 : 0) + (direction !== "all" ? 1 : 0) +
    (setupId !== "all" ? 1 : 0) + (emotion !== "all" ? 1 : 0) + (statut !== "all" ? 1 : 0) +
    (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  function resetFilters() {
    setPair("all"); setSession("all"); setDirection("all"); setSetupId("all");
    setEmotion("all"); setStatut("all"); setDateFrom(""); setDateTo("");
  }

  // Lightbox pour voir les images d'un trade directement depuis la liste
  const [lb, setLb] = useState<{ images: LightboxImage[]; index: number } | null>(null);
  const [loadingImgs, setLoadingImgs] = useState<string | null>(null);

  async function openImages(t: TradeRow) {
    setLoadingImgs(t.id);
    const supabase = createClient();
    const { data } = await supabase.from("trade_images").select("*").eq("trade_id", t.id);
    if (!data || data.length === 0) { setLoadingImgs(null); return toast("Aucune image pour ce trade"); }
    const sorted = [...data].sort((a, b) => (KIND_ORDER[a.kind] ?? 9) - (KIND_ORDER[b.kind] ?? 9));
    const signed = await Promise.all(sorted.map(async (im) => {
      const { data: s } = await supabase.storage.from("trade-images").createSignedUrl(im.storage_path, 3600);
      return { url: s?.signedUrl ?? "", kind: KIND_LABEL[im.kind] ?? im.kind, label: `${t.paire} · ${format(new Date(t.date_entree), "d MMM yyyy HH:mm", { locale: fr })}` };
    }));
    setLoadingImgs(null);
    setLb({ images: signed.filter((i) => i.url), index: 0 });
  }

  async function deleteTrade(id: string, paire: string) {
    if (!confirm(`Supprimer le trade ${paire} ? Cette action est irréversible.`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("trades").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Trade supprimé");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-3xl font-bold">Mes trades</h1>
          <p className="mt-1 text-sm text-muted-foreground">{filtered.length} trade{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}</p>
        </div>
        <TradesToolbar />
      </div>

      {/* ═════════════ BARRE : ONGLETS + FILTRES (une seule ligne) ═════════════ */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Onglets à gauche */}
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors",
                tab === t.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                tab === t.key ? "bg-primary/15 text-primary" : "bg-muted-foreground/10 text-muted-foreground",
              )}>{tabCounts[t.key]}</span>
            </button>
          ))}
        </div>

        {/* Chips filtres à droite des onglets, wrap automatique */}
        <ChipSelect label="Paire" value={pair} onChange={setPair} options={[["all", "Toutes"], ...distinctPairs.map((p) => [p, p] as [string, string])]} />
        <ChipSelect label="Session" value={session} onChange={setSession} options={[["all", "Toutes"], ...distinctSessions.map((s) => [s, sessionLabel(s)] as [string, string])]} />
        <ChipSelect label="Dir." value={direction} onChange={setDirection} options={[["all", "Toutes"], ["long", "▲ Long"], ["short", "▼ Short"]]} />
        <ChipSelect label="Setup" value={setupId} onChange={setSetupId} options={[["all", "Tous"], ...setups.map((s) => [s.id, s.nom] as [string, string])]} />
        <ChipSelect label="Émotion" value={emotion} onChange={setEmotion} options={[["all", "Toutes"], ...distinctEmotions.map((e) => [e, emotionLabel(e)] as [string, string])]} />
        <ChipSelect label="Statut" value={statut} onChange={setStatut} options={[["all", "Tous"], ["tp", "WIN"], ["sl", "LOSS"], ["be", "BE"], ["manuel", "MANUEL"]]} />

        <div className="flex items-center gap-1">
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 w-32 text-xs" />
          <span className="text-xs text-muted-foreground">→</span>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 w-32 text-xs" />
        </div>

        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="h-8 w-auto min-w-[9rem] text-xs"><ArrowUpDown className="mr-1 h-3 w-3" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">Date ↓ (récent)</SelectItem>
            <SelectItem value="date_asc">Date ↑ (ancien)</SelectItem>
            <SelectItem value="r_desc">R ↓ (meilleur)</SelectItem>
            <SelectItem value="r_asc">R ↑ (pire)</SelectItem>
          </SelectContent>
        </Select>

        {activeFilters > 0 && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 text-xs">
            <X className="h-3 w-3" /> Reset ({activeFilters})
          </Button>
        )}
      </div>

      {/* ═════════════ TABLEAU ═════════════ */}
      <Card className="card-glass overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Paire</th>
              <th className="p-3">Dir.</th>
              <th className="p-3">Session</th>
              <th className="p-3">Setup</th>
              <th className="p-3">Niveau</th>
              <th className="p-3">Compte</th>
              <th className="p-3">Statut</th>
              <th className="p-3 text-right">R</th>
              <th className="p-3 text-right">$</th>
              <th className="p-3">Plan</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b transition-colors hover:bg-accent/40">
                <td className="p-3 whitespace-nowrap text-xs">{format(new Date(t.date_entree), "d MMM yy", { locale: fr })}<br /><span className="text-[10px] text-muted-foreground">{format(new Date(t.date_entree), "HH:mm")}</span></td>
                <td className="p-3"><PairFlag paire={t.paire} /></td>
                <td className="p-3">
                  <span className={cn("rounded px-2 py-0.5 text-[10px] font-bold", t.direction === "long" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400")}>
                    {t.direction === "long" ? "BUY" : "SELL"}
                  </span>
                </td>
                <td className="p-3 text-xs text-muted-foreground">{t.session ? sessionLabel(t.session) : "—"}</td>
                <td className="p-3">{t.setups?.nom ?? "—"}</td>
                <td className="p-3">{t.niveaux?.nom ?? "—"}</td>
                <td className="p-3">
                  {t.comptes ? (
                    <div className="leading-tight">
                      <span className="text-xs font-medium">{t.comptes.nom}</span>
                      <br />
                      <span className="text-[10px] text-muted-foreground tabular-nums">{t.comptes.capital_initial.toLocaleString()} {t.comptes.devise}</span>
                    </div>
                  ) : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="p-3">
                  <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold", STATUT_COLOR[t.statut])}>{STATUT_LABEL[t.statut]}</span>
                </td>
                <td className={cn("p-3 text-right font-mono tabular-nums", (t.resultat_r ?? 0) > 0 && "text-emerald-400", (t.resultat_r ?? 0) < 0 && "text-rose-400")}>
                  {t.resultat_r !== null ? `${t.resultat_r > 0 ? "+" : ""}${Number(t.resultat_r).toFixed(2)}` : "—"}
                </td>
                <td className={cn("p-3 text-right font-mono tabular-nums", (t.resultat_usd ?? 0) > 0 && "text-emerald-400", (t.resultat_usd ?? 0) < 0 && "text-rose-400")}>
                  {t.resultat_usd !== null ? `${t.resultat_usd > 0 ? "+" : ""}${Number(t.resultat_usd).toFixed(2)}$` : "—"}
                </td>
                <td className="p-3 text-center">{t.respect_plan ? "✓" : "✗"}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <button type="button" onClick={() => openImages(t)} disabled={loadingImgs === t.id} className="rounded p-1 text-sky-400 hover:bg-accent disabled:opacity-50" title="Voir les images du trade"><ImageIcon className="h-4 w-4" /></button>
                    <Link href={`/trades/${t.id}/edit`} className="rounded p-1 text-primary hover:bg-accent" title="Modifier"><Pencil className="h-4 w-4" /></Link>
                    <button type="button" onClick={() => deleteTrade(t.id, t.paire)} className="rounded p-1 text-destructive hover:bg-accent" title="Supprimer"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={12} className="p-8 text-center text-muted-foreground">
                {trades.length === 0 ? (<>Aucun trade — <Link href="/trades/new" className="text-primary underline">créer le premier</Link></>) : "Aucun trade ne correspond aux filtres"}
              </td></tr>
            )}
          </tbody>
        </table>
      </Card>

      {lb && <Lightbox images={lb.images} index={lb.index} onIndex={(i) => setLb({ ...lb, index: i })} onClose={() => setLb(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
function ChipSelect({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  const isActive = value !== "all";
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("h-8 w-auto min-w-[6.5rem] max-w-[10rem] gap-1 text-xs", isActive && "border-primary bg-primary/5 text-primary")}>
        <span className="text-[10px] uppercase opacity-70">{label}</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function sessionLabel(s: string): string {
  return { asie: "Asie", londres: "London", ny: "New York", chevauchement_ldn_ny: "London/NY", hors_timing: "Hors timing" }[s] ?? s;
}
function emotionLabel(e: string): string {
  return { calme: "Calme", confiant: "Confiant", impatient: "Impatient", fomo: "FOMO", revenge: "Revenge", stresse: "Stressé", surexcite: "Surexcité" }[e] ?? e;
}
