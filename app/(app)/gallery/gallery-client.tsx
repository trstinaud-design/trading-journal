"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Pencil } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Lightbox, type LightboxImage } from "@/components/ui/lightbox";
import { PairFlag } from "@/components/ui/pair-flag";
import { cn } from "@/lib/utils/cn";

export type TradeGroup = {
  trade_id: string;
  date: string;
  paire: string;
  direction: "long" | "short";
  statut: string;
  resultat_r: number | null;
  setup: string | null;
  setup_id: string | null;
  images: { id: string; kind: "avant" | "pendant" | "apres"; url: string }[];
};

const STATUT_BADGE: Record<string, string> = {
  tp: "bg-emerald-500 text-white",
  sl: "bg-rose-500 text-white",
  be: "bg-amber-400 text-black",
  manuel: "bg-sky-500 text-white",
};
const KIND_LABEL: Record<string, string> = { avant: "Avant", pendant: "Pendant", apres: "Après" };

export function GalleryClient({ groups, setups }: { groups: TradeGroup[]; setups: { id: string; nom: string }[] }) {
  const [setupFilter, setSetupFilter] = useState("all");
  const [statutFilter, setStatutFilter] = useState("all");
  // Lightbox : liste d'images + index courant
  const [lb, setLb] = useState<{ images: LightboxImage[]; index: number } | null>(null);

  const filtered = useMemo(() => groups.filter((g) => {
    if (setupFilter !== "all" && g.setup_id !== setupFilter) return false;
    if (statutFilter !== "all" && g.statut !== statutFilter) return false;
    return true;
  }), [groups, setupFilter, statutFilter]);

  function openLightbox(g: TradeGroup, startIdx: number) {
    const images: LightboxImage[] = g.images.map((im) => ({
      url: im.url,
      kind: KIND_LABEL[im.kind] ?? im.kind,
      label: `${g.paire} · ${format(new Date(g.date), "d MMM yyyy HH:mm", { locale: fr })}`,
    }));
    setLb({ images, index: startIdx });
  }

  const totalImages = filtered.reduce((s, g) => s + g.images.length, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-3xl font-bold">Galerie de charts</h1>
        <p className="mt-1 text-sm text-muted-foreground">{filtered.length} trade{filtered.length > 1 ? "s" : ""} · {totalImages} image{totalImages > 1 ? "s" : ""}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={setupFilter} onValueChange={setSetupFilter}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Setup" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les setups</SelectItem>
            {setups.map((s) => <SelectItem key={s.id} value={s.id}>{s.nom}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statutFilter} onValueChange={setStatutFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="tp">TP</SelectItem>
            <SelectItem value="sl">SL</SelectItem>
            <SelectItem value="be">Break Even</SelectItem>
            <SelectItem value="manuel">Manuel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Une carte par trade */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((g) => (
          <Card key={g.trade_id} className="card-glass overflow-hidden">
            {/* En-tête du trade */}
            <div className="flex items-center justify-between gap-2 border-b border-border/50 p-3">
              <div className="flex items-center gap-2">
                <PairFlag paire={g.paire} />
                <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", g.direction === "long" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400")}>
                  {g.direction === "long" ? "BUY" : "SELL"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("rounded px-2 py-0.5 text-[10px] font-bold uppercase", STATUT_BADGE[g.statut] ?? "bg-muted text-foreground")}>
                  {g.statut}
                </span>
                {g.resultat_r !== null && (
                  <span className={cn("font-mono text-xs font-bold", g.resultat_r > 0 ? "text-emerald-400" : g.resultat_r < 0 ? "text-rose-400" : "text-muted-foreground")}>
                    {g.resultat_r > 0 ? "+" : ""}{g.resultat_r.toFixed(2)}R
                  </span>
                )}
                <Link href={`/trades/${g.trade_id}/edit`} className="rounded p-1 text-primary hover:bg-accent" title="Modifier le trade"><Pencil className="h-3.5 w-3.5" /></Link>
              </div>
            </div>

            {/* Images du trade */}
            <div className={cn("grid gap-1 p-2", g.images.length === 1 ? "grid-cols-1" : g.images.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
              {g.images.map((im, idx) => (
                <button
                  key={im.id}
                  type="button"
                  onClick={() => openLightbox(g, idx)}
                  className="group relative aspect-video overflow-hidden rounded-md bg-muted"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={im.url} alt={im.kind} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] uppercase text-white">{KIND_LABEL[im.kind]}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between px-3 pb-3 text-xs text-muted-foreground">
              <span>{g.setup ?? "—"}</span>
              <span>{format(new Date(g.date), "d MMM yyyy · HH:mm", { locale: fr })}</span>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-12 text-center text-sm text-muted-foreground">Aucune image pour ces filtres.</p>
        )}
      </div>

      {lb && <Lightbox images={lb.images} index={lb.index} onIndex={(i) => setLb({ ...lb, index: i })} onClose={() => setLb(null)} />}
    </div>
  );
}
