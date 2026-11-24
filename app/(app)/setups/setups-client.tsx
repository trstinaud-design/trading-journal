"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TimeframePicker } from "@/components/ui/timeframe-picker";
import type { Setup, Niveau, Timeframe } from "@/types/database";

export function SetupsClient({ setups, niveaux }: { setups: Setup[]; niveaux: Niveau[] }) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-3xl font-bold">Setups &amp; Niveaux</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gère les listes personnalisables utilisées dans le formulaire de trade. Les <strong>comptes</strong> sont dans leur propre page (menu de gauche).</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <List table="setups" title="Setups" items={setups} onChange={() => router.refresh()} />
        <List table="niveaux" title="Niveaux" items={niveaux} onChange={() => router.refresh()} />
      </div>
    </div>
  );
}

function List({ table, title, items, onChange }: { table: "setups" | "niveaux"; title: string; items: (Setup | Niveau)[]; onChange: () => void }) {
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [timeframes, setTimeframes] = useState<Timeframe[]>([]);
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!nom.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from(table).insert({ user_id: user.id, nom: nom.trim(), description: description.trim() || null, timeframes });
    setSaving(false);
    if (error) return toast.error(error.message);
    setNom(""); setDescription(""); setTimeframes([]); onChange();
    toast.success("Ajouté");
  }

  async function updateTimeframes(id: string, tfs: Timeframe[]) {
    const supabase = createClient();
    const { error } = await supabase.from(table).update({ timeframes: tfs }).eq("id", id);
    if (error) return toast.error(error.message);
    onChange();
  }

  async function remove(id: string) {
    if (!confirm("Supprimer ?")) return;
    const supabase = createClient();
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return toast.error(error.message);
    onChange();
  }

  const singular = table === "setups" ? "setup" : "niveau";

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 rounded-lg border border-dashed p-3">
          <div className="flex gap-2">
            <Input placeholder={`Nom du ${singular}`} value={nom} onChange={(e) => setNom(e.target.value)} />
            <Button size="icon" onClick={add} disabled={saving}><Plus className="h-4 w-4" /></Button>
          </div>
          <Input placeholder="Description (optionnel)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="space-y-1">
            <Label className="text-xs">Timeframes (où ce {singular} est identifié)</Label>
            <TimeframePicker value={timeframes} onChange={setTimeframes} size="sm" />
          </div>
        </div>
        <ul className="divide-y">
          {items.map((it) => (
            <li key={it.id} className="space-y-1.5 py-2.5">
              <div className="flex items-center justify-between gap-2">
                {table === "setups" ? (
                  <Link href={`/setups/${it.id}`} className="group flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-primary">{it.nom} <ChevronRight className="inline h-3 w-3 opacity-0 group-hover:opacity-100" /></p>
                    {it.description && <p className="truncate text-xs text-muted-foreground">{it.description}</p>}
                  </Link>
                ) : (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{it.nom}</p>
                    {it.description && <p className="truncate text-xs text-muted-foreground">{it.description}</p>}
                  </div>
                )}
                <Button variant="ghost" size="icon" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
              <TimeframePicker value={it.timeframes ?? []} onChange={(tfs) => updateTimeframes(it.id, tfs)} size="sm" />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

