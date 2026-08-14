import { createClient } from "@/lib/supabase/server";
import { SetupsClient } from "./setups-client";

export default async function SetupsPage() {
  const supabase = await createClient();
  const [{ data: setups }, { data: niveaux }] = await Promise.all([
    supabase.from("setups").select("*").order("nom"),
    supabase.from("niveaux").select("*").order("nom"),
  ]);
  return <SetupsClient setups={setups ?? []} niveaux={niveaux ?? []} />;
}
