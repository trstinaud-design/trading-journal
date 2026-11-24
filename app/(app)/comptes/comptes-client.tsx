"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Wallet, Flame, CheckCircle2, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import type { Compte, AccountType, AccountStatus } from "@/types/database";

const ACCOUNT_TYPES: { value: AccountType; label: string; description: string }[] = [
  { value: "evaluation", label: "Évaluation Prop Firm", description: "Phase de challenge avant le compte financé" },
  { value: "prop_finance", label: "Prop Firm Financé", description: "Compte financé actif chez une prop firm" },
  { value: "reel", label: "Compte Réel", description: "Tes propres fonds sur un broker" },
  { value: "demo", label: "Démo / Backtest", description: "Argent virtuel pour tester" },
];

const TYPE_COLORS: Record<AccountType, string> = {
  evaluation: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30",
  prop_finance: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30",
  reel: "bg-primary/10 text-primary ring-1 ring-primary/30",
  demo: "bg-muted text-muted-foreground ring-1 ring-border",
};

export function ComptesClient({ comptes }: { comptes: Compte[] }) {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [type, setType] = useState<AccountType>("demo");
  const [capital, setCapital] = useState<number>(10000);
  const [devise, setDevise] = useState("USD");
  const [risk, setRisk] = useState<number>(1);
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!nom.trim()) return toast.error("Nom requis");
    if (capital <= 0) return toast.error("Capital invalide");
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return toast.error("Non connecté"); }

    const { error } = await supabase.from("comptes").insert({
      user_id: user.id, nom: nom.trim(), type, capital_initial: capital, devise, default_risk_pct: risk,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    setNom(""); setCapital(10000); setRisk(1); setDevise("USD"); setType("demo");
    router.refresh();
    toast.success("Compte créé");
  }

  async function updateField(id: string, field: "capital_initial" | "default_risk_pct" | "nom" | "devise", value: number | string) {
    const supabase = createClient();
    const { error } = await supabase.from("comptes").update({ [field]: value }).eq("id", id);
    if (error) return toast.error(error.message);
    router.refresh();
  }

  async function remove(id: string, nom: string) {
    if (!confirm(`Supprimer le compte "${nom}" ? Les trades associés perdront leur référence mais ne seront PAS supprimés.`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("comptes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    router.refresh();
    toast.success("Compte supprimé");
  }

  // Marque le compte comme cramé (lecture seule) — AUCUNE donnée n'est effacée.
  async function setStatut(id: string, statut: AccountStatus, nom: string) {
    if (statut === "crame" && !confirm(`Marquer "${nom}" comme CRAMÉ ? Le compte reste visible avec tout son historique, mais passe en lecture seule (aucun nouveau trade). Réversible.`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("comptes").update({ statut }).eq("id", id);
    if (error) return toast.error(error.message);
    router.refresh();
    toast.success(statut === "crame" ? "Compte marqué cramé 🔒" : "Compte réactivé ✓");
  }

  // Valide le compte → type financé (prop_finance). Conserve toutes les données.
  async function validateFunded(id: string, nom: string) {
    if (!confirm(`Valider "${nom}" comme compte FINANCÉ (funded) ? Le type passe à « Prop Firm Financé ». Aucune donnée n'est effacée.`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("comptes").update({ type: "prop_finance" }).eq("id", id);
    if (error) return toast.error(error.message);
    router.refresh();
    toast.success("Compte validé financé ✅");
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" />
          <h1 className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-3xl font-bold">Mes comptes</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Gère tes comptes de trading (prop firm, réel, démo). Le compte sélectionné dans le formulaire de trade fournit automatiquement son capital et son % de risque par défaut.
        </p>
      </div>

      {/* ═════ Formulaire de création ═════ */}
      <Card className="card-glass">
        <CardHeader>
          <CardTitle className="text-base">Créer un nouveau compte</CardTitle>
          <CardDescription>Renseigne les infos une fois — elles seront réutilisées automatiquement à chaque trade.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1 lg:col-span-2">
            <Label>Nom du compte</Label>
            <Input placeholder="Ex: FTMO 100k, IC Markets réel..." value={nom} onChange={(e) => setNom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{a.label}</span>
                      <span className="text-[10px] text-muted-foreground">{a.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Capital initial</Label>
            <Input type="number" value={capital} onChange={(e) => setCapital(Number(e.target.value))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Devise</Label>
              <Input value={devise} onChange={(e) => setDevise(e.target.value.toUpperCase())} maxLength={5} />
            </div>
            <div className="space-y-1">
              <Label>Risque défaut %</Label>
              <Input type="number" step="any" value={risk} onChange={(e) => setRisk(Number(e.target.value))} />
            </div>
          </div>
          <div className="lg:col-span-5">
            <Button onClick={add} disabled={saving} className="w-full gradient-primary text-white shadow-lg shadow-primary/20 hover:opacity-90 md:w-auto">
              <Plus className="h-4 w-4" /> {saving ? "Création..." : "Ajouter le compte"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ═════ Liste des comptes ═════ */}
      <Card className="card-glass">
        <CardHeader>
          <CardTitle className="text-base">Comptes existants ({comptes.length})</CardTitle>
          <CardDescription>Clique sur une valeur pour la modifier (elle s&apos;enregistre quand tu quittes le champ).</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {comptes.length === 0 ? (
            <div className="p-8 text-center">
              <Wallet className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Aucun compte. Crée ton premier compte ci-dessus.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Nom</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3 text-right">Capital</th>
                  <th className="p-3">Devise</th>
                  <th className="p-3 text-right">Risque défaut</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {comptes.map((c) => {
                  const typeLabel = ACCOUNT_TYPES.find((a) => a.value === c.type)?.label ?? c.type;
                  const crame = c.statut === "crame";
                  return (
                    <tr key={c.id} className={cn("border-b border-border/40 last:border-0 hover:bg-accent/30", crame && "opacity-60")}>
                      <td className="p-3">
                        <Input defaultValue={c.nom} className="h-8 border-transparent bg-transparent hover:border-input" onBlur={(e) => e.target.value !== c.nom && updateField(c.id, "nom", e.target.value)} />
                      </td>
                      <td className="p-3">
                        <span className={`rounded-md px-2 py-1 text-[10px] font-semibold ${TYPE_COLORS[c.type]}`}>{typeLabel}</span>
                      </td>
                      <td className="p-3">
                        {crame ? (
                          <span className="rounded-md bg-rose-500/15 px-2 py-1 text-[10px] font-semibold text-rose-400 ring-1 ring-rose-500/30">🔒 Cramé</span>
                        ) : (
                          <span className="rounded-md bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/30">● Actif</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <Input type="number" defaultValue={c.capital_initial} className="h-8 w-32 text-right border-transparent bg-transparent hover:border-input" onBlur={(e) => Number(e.target.value) !== c.capital_initial && updateField(c.id, "capital_initial", Number(e.target.value))} />
                      </td>
                      <td className="p-3">
                        <Input defaultValue={c.devise} maxLength={5} className="h-8 w-16 border-transparent bg-transparent uppercase hover:border-input" onBlur={(e) => e.target.value.toUpperCase() !== c.devise && updateField(c.id, "devise", e.target.value.toUpperCase())} />
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Input type="number" step="any" defaultValue={c.default_risk_pct} className="h-8 w-20 text-right border-transparent bg-transparent hover:border-input" onBlur={(e) => Number(e.target.value) !== c.default_risk_pct && updateField(c.id, "default_risk_pct", Number(e.target.value))} />
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          {c.type !== "prop_finance" && !crame && (
                            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-emerald-400 hover:bg-emerald-500/10" onClick={() => validateFunded(c.id, c.nom)} title="Valider → compte financé">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Valider
                            </Button>
                          )}
                          {crame ? (
                            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-emerald-400 hover:bg-emerald-500/10" onClick={() => setStatut(c.id, "actif", c.nom)} title="Réactiver">
                              <RotateCcw className="h-3.5 w-3.5" /> Réactiver
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-amber-400 hover:bg-amber-500/10" onClick={() => setStatut(c.id, "crame", c.nom)} title="Marquer cramé">
                              <Flame className="h-3.5 w-3.5" /> Cramé
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => remove(c.id, c.nom)} title="Supprimer">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
