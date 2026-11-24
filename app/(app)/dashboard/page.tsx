import { createClient } from "@/lib/supabase/server";
import { DashboardView } from "./dashboard-view";
import type { Trade, Setup, Niveau, Compte } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const [{ data: trades }, { data: comptes }, { data: setups }, { data: niveaux }] = await Promise.all([
    supabase.from("trades").select("*").order("date_entree"),
    supabase.from("comptes").select("*").order("created_at"),
    supabase.from("setups").select("id, nom"),
    supabase.from("niveaux").select("id, nom"),
  ]);

  return (
    <DashboardView
      trades={(trades as Trade[]) ?? []}
      comptes={(comptes as Compte[]) ?? []}
      setups={(setups as Pick<Setup, "id" | "nom">[]) ?? []}
      niveaux={(niveaux as Pick<Niveau, "id" | "nom">[]) ?? []}
    />
  );
}
