import { createClient } from "@/lib/supabase/server";
import { GalleryClient } from "./gallery-client";
import type { Trade, TradeImage, Setup } from "@/types/database";

export default async function GalleryPage() {
  const supabase = await createClient();
  const [{ data: images }, { data: trades }, { data: setups }] = await Promise.all([
    supabase.from("trade_images").select("*").order("created_at", { ascending: false }),
    supabase.from("trades").select("*"),
    supabase.from("setups").select("id, nom"),
  ]);

  const imgs = (images as TradeImage[]) ?? [];

  // Signer les URLs (bucket privé)
  const signed = await Promise.all(
    imgs.map(async (img) => {
      const { data } = await supabase.storage.from("trade-images").createSignedUrl(img.storage_path, 3600);
      return { ...img, url: data?.signedUrl ?? "" };
    }),
  );

  const tradesMap = new Map((trades as Trade[] ?? []).map((t) => [t.id, t]));
  const setupsMap = new Map((setups as Pick<Setup, "id" | "nom">[] ?? []).map((s) => [s.id, s.nom]));

  const items = signed.map((img) => {
    const t = tradesMap.get(img.trade_id);
    return {
      id: img.id,
      trade_id: img.trade_id,
      kind: img.kind,
      url: img.url,
      date: t?.date_entree ?? "",
      paire: t?.paire ?? "",
      statut: t?.statut ?? "",
      setup: t?.setup_id ? setupsMap.get(t.setup_id) ?? null : null,
      setup_id: t?.setup_id ?? null,
    };
  });

  const setupOptions = (setups as Pick<Setup, "id" | "nom">[] ?? []);

  return <GalleryClient items={items} setups={setupOptions} />;
}
