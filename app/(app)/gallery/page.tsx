import { createClient } from "@/lib/supabase/server";
import { GalleryClient, type TradeGroup } from "./gallery-client";
import type { Trade, TradeImage, Setup } from "@/types/database";

const KIND_ORDER: Record<string, number> = { avant: 0, pendant: 1, apres: 2 };

export default async function GalleryPage() {
  const supabase = await createClient();
  const [{ data: images }, { data: trades }, { data: setups }] = await Promise.all([
    supabase.from("trade_images").select("*"),
    supabase.from("trades").select("*").order("date_entree", { ascending: false }),
    supabase.from("setups").select("id, nom"),
  ]);

  const imgs = (images as TradeImage[]) ?? [];
  const tradesList = (trades as Trade[]) ?? [];
  const setupsMap = new Map((setups as Pick<Setup, "id" | "nom">[] ?? []).map((s) => [s.id, s.nom]));

  // Signe toutes les URLs (bucket privé)
  const signed = await Promise.all(
    imgs.map(async (img) => {
      const { data } = await supabase.storage.from("trade-images").createSignedUrl(img.storage_path, 3600);
      return { ...img, url: data?.signedUrl ?? "" };
    }),
  );

  // Regroupe les images par trade
  const imagesByTrade = new Map<string, typeof signed>();
  for (const img of signed) {
    (imagesByTrade.get(img.trade_id) ?? imagesByTrade.set(img.trade_id, []).get(img.trade_id)!).push(img);
  }

  // Construit un groupe par trade (seulement les trades qui ont au moins 1 image)
  const groups: TradeGroup[] = tradesList
    .filter((t) => imagesByTrade.has(t.id))
    .map((t) => {
      const tradeImgs = (imagesByTrade.get(t.id) ?? []).sort((a, b) => (KIND_ORDER[a.kind] ?? 9) - (KIND_ORDER[b.kind] ?? 9));
      return {
        trade_id: t.id,
        date: t.date_entree,
        paire: t.paire,
        direction: t.direction,
        statut: t.statut,
        resultat_r: t.resultat_r,
        setup: t.setup_id ? setupsMap.get(t.setup_id) ?? null : null,
        setup_id: t.setup_id,
        images: tradeImgs.map((im) => ({ id: im.id, kind: im.kind, url: im.url })),
      };
    });

  return <GalleryClient groups={groups} setups={(setups as Pick<Setup, "id" | "nom">[] ?? [])} />;
}
