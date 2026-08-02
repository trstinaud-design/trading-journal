import { createClient } from "@/lib/supabase/server";
import { ImportClient } from "./import-client";

export default async function ImportPage() {
  const supabase = await createClient();
  const [{ data: comptes }, { data: setups }, { data: niveaux }] = await Promise.all([
    supabase.from("comptes").select("id, nom"),
    supabase.from("setups").select("id, nom"),
    supabase.from("niveaux").select("id, nom"),
  ]);
  return <ImportClient comptes={comptes ?? []} setups={setups ?? []} niveaux={niveaux ?? []} />;
}
