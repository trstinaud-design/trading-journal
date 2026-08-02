import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TradeForm } from "@/components/forms/trade-form";
import type { Trade } from "@/types/database";

export default async function EditTradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: trade }, { data: comptes }, { data: setups }, { data: niveaux }] = await Promise.all([
    supabase.from("trades").select("*").eq("id", id).single(),
    supabase.from("comptes").select("*").order("created_at"),
    supabase.from("setups").select("*").order("nom"),
    supabase.from("niveaux").select("*").order("nom"),
  ]);

  if (!trade) return notFound();

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
      />
    </div>
  );
}
