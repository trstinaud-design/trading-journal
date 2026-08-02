import { createClient } from "@/lib/supabase/server";
import { TradesView } from "./trades-view";
import type { Setup, Niveau } from "@/types/database";

export default async function TradesPage() {
  const supabase = await createClient();
  const [{ data: trades }, { data: setups }, { data: niveaux }] = await Promise.all([
    supabase.from("trades").select("*, setups(nom), niveaux(nom)").order("date_entree", { ascending: false }),
    supabase.from("setups").select("id, nom"),
    supabase.from("niveaux").select("id, nom"),
  ]);
  return <TradesView trades={trades ?? []} setups={(setups as Pick<Setup, "id" | "nom">[]) ?? []} niveaux={(niveaux as Pick<Niveau, "id" | "nom">[]) ?? []} />;
}
