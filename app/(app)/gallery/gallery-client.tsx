"use client";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type Item = {
  id: string;
  trade_id: string;
  kind: "avant" | "pendant" | "apres";
  url: string;
  date: string;
  paire: string;
  statut: string;
  setup: string | null;
  setup_id: string | null;
};

export function GalleryClient({ items, setups }: { items: Item[]; setups: { id: string; nom: string }[] }) {
  const [setupFilter, setSetupFilter] = useState<string>("all");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [openTradeId, setOpenTradeId] = useState<string | null>(null);
  const [comparePair, setComparePair] = useState<{ avant?: string; apres?: string; paire?: string } | null>(null);

  const filtered = useMemo(() => items.filter((i) => {
    if (setupFilter !== "all" && i.setup_id !== setupFilter) return false;
    if (statutFilter !== "all" && i.statut !== statutFilter) return false;
    return true;
  }), [items, setupFilter, statutFilter]);

  async function openCompare(tradeId: string, paire: string) {
    setOpenTradeId(tradeId);
    const supabase = createClient();
    const { data } = await supabase.from("trade_images").select("*").eq("trade_id", tradeId);
    const avant = data?.find((d) => d.kind === "avant");
    const apres = data?.find((d) => d.kind === "apres");
    const [a1, a2] = await Promise.all([
      avant ? supabase.storage.from("trade-images").createSignedUrl(avant.storage_path, 3600) : null,
      apres ? supabase.storage.from("trade-images").createSignedUrl(apres.storage_path, 3600) : null,
    ]);
    setComparePair({ avant: a1?.data?.signedUrl, apres: a2?.data?.signedUrl, paire });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Galerie de charts</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} image(s)</p>
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

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {filtered.map((it) => (
          <div key={it.id} className="group overflow-hidden rounded-lg border bg-card">
            <div className="relative aspect-video overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
              <span className={cn("absolute right-2 top-2 rounded px-2 py-0.5 text-[10px] font-semibold uppercase",
                it.statut === "tp" ? "bg-[hsl(var(--win))] text-white" :
                it.statut === "sl" ? "bg-[hsl(var(--loss))] text-white" : "bg-muted text-foreground")}>{it.statut}</span>
              <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[10px] uppercase text-white">{it.kind}</span>
            </div>
            <div className="p-2">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-semibold">{it.paire}</span>
                <span className="text-muted-foreground">{it.date && format(new Date(it.date), "yyyy-MM-dd HH:mm")}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="truncate text-xs text-muted-foreground">{it.setup ?? "—"}</span>
                <Button size="sm" variant="ghost" onClick={() => openCompare(it.trade_id, it.paire)}>Comparer</Button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="col-span-full text-center text-sm text-muted-foreground">Aucune image</p>}
      </div>

      <Dialog open={!!openTradeId} onOpenChange={(o) => { if (!o) { setOpenTradeId(null); setComparePair(null); } }}>
        <DialogContent className="max-w-6xl">
          <DialogHeader><DialogTitle>Avant / Après — {comparePair?.paire}</DialogTitle></DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs uppercase text-muted-foreground">Avant (analyse)</p>
              {comparePair?.avant
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={comparePair.avant} alt="avant" className="w-full rounded-md border" />
                : <p className="text-sm text-muted-foreground">Pas d&apos;image</p>}
            </div>
            <div>
              <p className="mb-1 text-xs uppercase text-muted-foreground">Après (résultat)</p>
              {comparePair?.apres
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={comparePair.apres} alt="apres" className="w-full rounded-md border" />
                : <p className="text-sm text-muted-foreground">Pas d&apos;image</p>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
