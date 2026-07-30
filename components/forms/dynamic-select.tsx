"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Option = { id: string; nom: string };
type TableName = "setups" | "niveaux";

type Props = {
  table: TableName;
  options: Option[];
  value: string | null;
  onChange: (id: string) => void;
  onCreated: (opt: Option) => void;
  label: string;
};

/** Select générique + bouton "+" qui crée une nouvelle ligne dans setups/niveaux. */
export function DynamicSelect({ table, options, value, onChange, onCreated, label }: Props) {
  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!nom.trim()) return toast.error("Nom requis");
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return toast.error("Non connecté"); }

    const { data, error } = await supabase
      .from(table)
      .insert({ user_id: user.id, nom: nom.trim(), description: description.trim() || null })
      .select("id, nom")
      .single();

    setSaving(false);
    if (error) return toast.error(error.message);
    if (data) {
      onCreated(data);
      onChange(data.id);
      toast.success(`${label} créé`);
      setOpen(false);
      setNom("");
      setDescription("");
    }
  }

  return (
    <div className="flex gap-2">
      <Select value={value ?? undefined} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder={`Choisir un ${label.toLowerCase()}`} /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.id} value={o.id}>{o.nom}</SelectItem>)}
        </SelectContent>
      </Select>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="icon"><Plus className="h-4 w-4" /></Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouveau {label.toLowerCase()}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nom</Label>
              <Input value={nom} onChange={(e) => setNom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Description (optionnel)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="button" onClick={create} disabled={saving}>
              {saving ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
