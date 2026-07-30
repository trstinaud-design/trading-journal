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
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Nouveau trade</h1>
        <p className="text-sm text-muted-foreground">Contexte → Exécution → Technique & visuels</p>
      </div>
      <TradeForm comptes={comptes ?? []} setups={setups ?? []} niveaux={niveaux ?? []} />
    </div>
  );
}
