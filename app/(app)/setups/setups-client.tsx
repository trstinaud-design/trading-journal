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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Setup, Niveau, Compte, AccountType } from "@/types/database";

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "evaluation", label: "Évaluation" },
  { value: "prop_finance", label: "Prop Firm Financé" },
  { value: "reel", label: "Compte Réel" },
  { value: "demo", label: "Démo" },
];

export function SetupsClient({ setups, niveaux, comptes }: { setups: Setup[]; niveaux: Niveau[]; comptes: Compte[] }) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Setups, Niveaux & Comptes</h1>
        <p className="text-sm text-muted-foreground">Gère les listes personnalisables utilisées dans le formulaire de trade.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <List table="setups" title="Setups" items={setups} onChange={() => router.refresh()} />
        <List table="niveaux" title="Niveaux" items={niveaux} onChange={() => router.refresh()} />
        <ComptesList items={comptes} onChange={() => router.refresh()} />
      </div>
    </div>
  );
}

function List({ table, title, items, onChange }: { table: "setups" | "niveaux"; title: string; items: (Setup | Niveau)[]; onChange: () => void }) {
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!nom.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from(table).insert({ user_id: user.id, nom: nom.trim(), description: description.trim() || null });
    setSaving(false);
    if (error) return toast.error(error.message);
    setNom(""); setDescription(""); onChange();
    toast.success("Ajouté");
  }

  async function remove(id: string) {
    if (!confirm("Supprimer ?")) return;
    const supabase = createClient();
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return toast.error(error.message);
    onChange();
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input placeholder="Nom" value={nom} onChange={(e) => setNom(e.target.value)} />
            <Button size="icon" onClick={add} disabled={saving}><Plus className="h-4 w-4" /></Button>
          </div>
          <Input placeholder="Description (optionnel)" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <ul className="divide-y">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between gap-2 py-2">
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
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function ComptesList({ items, onChange }: { items: Compte[]; onChange: () => void }) {
  const [nom, setNom] = useState("");
  const [type, setType] = useState<AccountType>("demo");
  const [capital, setCapital] = useState<number>(10000);
  const [devise, setDevise] = useState("USD");
  const [risk, setRisk] = useState<number>(1);

  async function add() {
    if (!nom.trim()) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("comptes").insert({ user_id: user.id, nom, type, capital_initial: capital, devise, default_risk_pct: risk });
    if (error) return toast.error(error.message);
    setNom(""); onChange(); toast.success("Compte ajouté");
  }

  async function updateRisk(id: string, newRisk: number) {
    const supabase = createClient();
    const { error } = await supabase.from("comptes").update({ default_risk_pct: newRisk }).eq("id", id);
    if (error) return toast.error(error.message);
    onChange();
  }

  async function remove(id: string) {
    if (!confirm("Supprimer ce compte ?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("comptes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    onChange();
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Comptes</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Input placeholder="Nom (ex: FTMO 100k)" value={nom} onChange={(e) => setNom(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Devise</Label>
              <Input value={devise} onChange={(e) => setDevise(e.target.value.toUpperCase())} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Capital initial</Label>
              <Input type="number" value={capital} onChange={(e) => setCapital(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Risque défaut (%)</Label>
              <Input type="number" step="0.1" value={risk} onChange={(e) => setRisk(Number(e.target.value))} />
            </div>
          </div>
          <Button onClick={add} className="w-full"><Plus className="h-4 w-4" /> Ajouter</Button>
        </div>
        <ul className="divide-y">
          {items.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.nom}</p>
                <p className="text-xs text-muted-foreground">{c.type} • {c.capital_initial.toLocaleString()} {c.devise}</p>
              </div>
              <div className="flex items-center gap-1">
                <Label className="text-xs">Risque</Label>
                <Input
                  type="number"
                  step="0.1"
                  className="h-8 w-16 text-xs"
                  defaultValue={c.default_risk_pct}
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (v !== c.default_risk_pct) updateRisk(c.id, v);
                  }}
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
