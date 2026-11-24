import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TradeForm } from "@/components/forms/trade-form";
import type { Trade, TradeImage, ImageKind } from "@/types/database";

export default async function EditTradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: trade }, { data: comptes }, { data: setups }, { data: niveaux }, { data: imgs }] = await Promise.all([
    supabase.from("trades").select("*").eq("id", id).single(),
    supabase.from("comptes").select("*").order("created_at"),
    supabase.from("setups").select("*").order("nom"),
    supabase.from("niveaux").select("*").order("nom"),
    supabase.from("trade_images").select("*").eq("trade_id", id),
  ]);

  if (!trade) return notFound();

  // Signe les URLs des images déjà enregistrées pour les afficher dans le formulaire
  const existingImages: Partial<Record<ImageKind, string>> = {};
  for (const img of (imgs as TradeImage[]) ?? []) {
    const { data } = await supabase.storage.from("trade-images").createSignedUrl(img.storage_path, 3600);
    if (data?.signedUrl) existingImages[img.kind] = data.signedUrl;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link href="/trades" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Retour à la liste
      </Link>
      <div>
        <h1 className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-3xl font-bold">Modifier le trade</h1>
        <p className="mt-1 text-sm text-muted-foreground">{(trade as Trade).paire} · {new Date((trade as Trade).date_entree).toLocaleString("fr-FR")}</p>
      </div>
      <TradeForm
        comptes={comptes ?? []}
        setups={setups ?? []}
        niveaux={niveaux ?? []}
        initialTrade={trade as Trade}
        existingImages={existingImages}
      />
    </div>
  );
}
