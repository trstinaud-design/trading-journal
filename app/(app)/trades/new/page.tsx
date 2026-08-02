import { createClient } from "@/lib/supabase/server";
import { TradeForm } from "@/components/forms/trade-form";

export default async function NewTradePage() {
  const supabase = await createClient();
  const [{ data: comptes }, { data: setups }, { data: niveaux }] = await Promise.all([
    supabase.from("comptes").select("*").order("created_at"),
    supabase.from("setups").select("*").order("nom"),
    supabase.from("niveaux").select("*").order("nom"),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-3xl font-bold">Nouveau trade</h1>
          <p className="mt-1 text-sm text-muted-foreground">Contexte → Exécution → Technique &amp; visuels</p>
        </div>
      </div>
      <TradeForm comptes={comptes ?? []} setups={setups ?? []} niveaux={niveaux ?? []} />
    </div>
  );
}
