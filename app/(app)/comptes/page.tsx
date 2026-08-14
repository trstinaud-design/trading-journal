import { createClient } from "@/lib/supabase/server";
import { ComptesClient } from "./comptes-client";

export default async function ComptesPage() {
  const supabase = await createClient();
  const { data: comptes } = await supabase.from("comptes").select("*").order("created_at");
  return <ComptesClient comptes={comptes ?? []} />;
}
