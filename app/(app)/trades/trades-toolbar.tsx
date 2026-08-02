"use client";
import Link from "next/link";
import { Download, Upload, Plus } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { tradesToCSV, downloadBlob } from "@/lib/utils/csv";

/** Toolbar de la page /trades : Nouveau + Import + Export. */
export function TradesToolbar() {
  async function exportCSV() {
    const supabase = createClient();
    const { data, error } = await supabase.from("trades").select("*, setups(nom), niveaux(nom)").order("date_entree");
    if (error) return toast.error(error.message);
    const csv = tradesToCSV((data ?? []) as never[]);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadBlob(csv, `trades-${stamp}.csv`);
    toast.success(`${data?.length ?? 0} trade(s) exporté(s)`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4" /> Export CSV</Button>
      <Button variant="outline" asChild><Link href="/trades/import"><Upload className="h-4 w-4" /> Import CSV</Link></Button>
      <Button asChild className="gradient-primary text-white shadow-lg shadow-primary/20 hover:opacity-90">
        <Link href="/trades/new"><Plus className="h-4 w-4" /> Nouveau trade</Link>
      </Button>
    </div>
  );
}
