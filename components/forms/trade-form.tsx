"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PositionCalculator } from "./position-calculator";
import { ImageDropzone } from "./image-dropzone";
import { DynamicSelect } from "./dynamic-select";
import { PartialExitsEditor } from "./partial-exits";
import { autoLotSize } from "@/lib/utils/pip-value";
import { sessionFromHour } from "@/lib/utils/session-from-time";
import type { Compte, Setup, Niveau, ImageKind, PartialExit, Trade } from "@/types/database";

const schema = z.object({
  compte_id: z.string().uuid(),
  date_entree: z.string().min(1),
  paire: z.string().min(1).max(20),
  direction: z.enum(["long", "short"]),
  session: z.enum(["asie", "londres", "ny", "chevauchement_ldn_ny", "hors_timing"]).nullable(),
  emotion: z.enum(["calme", "confiant", "impatient", "fomo", "revenge", "stresse"]).nullable(),

  prix_entree: z.number().nullable(),
  stop_loss: z.number().nullable(),
  take_profit: z.number().nullable(),
  statut: z.enum(["tp", "sl", "be", "manuel"]),
  risque_pct: z.number().min(0).max(100).nullable(),
  taille_lots: z.number().nullable(),
  resultat_r: z.number().nullable(),
  resultat_usd: z.number().nullable(),

  setup_id: z.string().uuid().nullable(),
  niveau_id: z.string().uuid().nullable(),
  respect_plan: z.boolean(),
  commentaire: z.string().nullable(),
  partial_exits: z.array(z.object({ price: z.number(), pct: z.number(), r_partial: z.number() })).default([]),
});
type FormValues = z.infer<typeof schema>;

const SESSIONS = [
  { value: "asie", label: "Asie" },
  { value: "londres", label: "Londres" },
  { value: "ny", label: "New York" },
  { value: "chevauchement_ldn_ny", label: "Chevauchement LDN/NY" },
  { value: "hors_timing", label: "Hors timing" },
] as const;
const EMOTIONS = [
  { value: "calme", label: "Calme" },
  { value: "confiant", label: "Confiant" },
  { value: "impatient", label: "Impatient" },
  { value: "fomo", label: "FOMO" },
  { value: "revenge", label: "Revenge trading" },
  { value: "stresse", label: "Stressé" },
] as const;
const STATUTS = [
  { value: "tp", label: "TP (Take Profit)" },
  { value: "sl", label: "SL (Stop Loss)" },
  { value: "be", label: "Break Even" },
  { value: "manuel", label: "Clôture manuelle" },
] as const;
const PAIRES_QUICK = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "GBPJPY", "US30", "NAS100"];

type Props = {
  comptes: Compte[];
  setups: Setup[];
  niveaux: Niveau[];
  /** Fournir un trade existant pour passer en mode édition. */
  initialTrade?: Trade;
};

export function TradeForm({ comptes, setups: initialSetups, niveaux: initialNiveaux, initialTrade }: Props) {
  const router = useRouter();
  const [setups, setSetups] = useState(initialSetups);
  const [niveaux, setNiveaux] = useState(initialNiveaux);
  const [images, setImages] = useState<Record<ImageKind, File | null>>({ avant: null, pendant: null, apres: null });
  const [submitting, setSubmitting] = useState(false);

  const isEditMode = !!initialTrade;
  const defaultCompte = initialTrade?.compte_id ?? comptes[0]?.id ?? "";
  const defaultCapital = comptes.find((c) => c.id === defaultCompte)?.capital_initial ?? 10000;

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialTrade ? {
      compte_id: initialTrade.compte_id ?? defaultCompte,
      date_entree: initialTrade.date_entree.slice(0, 16),
      paire: initialTrade.paire,
      direction: initialTrade.direction,
      session: initialTrade.session,
      emotion: initialTrade.emotion,
      prix_entree: initialTrade.prix_entree,
      stop_loss: initialTrade.stop_loss,
      take_profit: initialTrade.take_profit,
      statut: initialTrade.statut,
      risque_pct: initialTrade.risque_pct,
      taille_lots: initialTrade.taille_lots,
      resultat_r: initialTrade.resultat_r,
      resultat_usd: initialTrade.resultat_usd,
      setup_id: initialTrade.setup_id,
      niveau_id: initialTrade.niveau_id,
      respect_plan: initialTrade.respect_plan,
      commentaire: initialTrade.commentaire ?? "",
      partial_exits: initialTrade.partial_exits ?? [],
    } : {
      compte_id: defaultCompte,
      date_entree: new Date().toISOString().slice(0, 16),
      paire: "XAUUSD",
      direction: "long",
      session: "londres",
      emotion: "calme",
      prix_entree: null,
      stop_loss: null,
      take_profit: null,
      statut: "tp",
      risque_pct: 1,
      taille_lots: null,
      resultat_r: null,
      resultat_usd: null,
      setup_id: null,
      niveau_id: null,
      respect_plan: true,
      commentaire: "",
      partial_exits: [],
    },
  });

  const paire = watch("paire");
  const statut = watch("statut");
  const risquePct = watch("risque_pct");
  const compteId = watch("compte_id");
  const prixEntree = watch("prix_entree");
  const stopLoss = watch("stop_loss");
  const dateEntree = watch("date_entree");

  const compteCourant = useMemo(() => comptes.find((c) => c.id === compteId), [comptes, compteId]);
  const capitalCompte = compteCourant?.capital_initial ?? defaultCapital;

  // 🔁 Quand on change de compte : recharge automatiquement son % de risque par défaut.
  useEffect(() => {
    if (compteCourant?.default_risk_pct != null) setValue("risque_pct", compteCourant.default_risk_pct);
  }, [compteCourant?.id, compteCourant?.default_risk_pct, setValue]);

  // 🔁 Auto-calcul de la taille de lot dès que paire + entrée + SL + capital + risque% sont dispo.
  useEffect(() => {
    const lots = autoLotSize(paire, prixEntree, stopLoss, capitalCompte, risquePct ?? 0);
    if (lots > 0) setValue("taille_lots", Number(lots.toFixed(2)));
  }, [paire, prixEntree, stopLoss, capitalCompte, risquePct, setValue]);

  // 🔁 Détection auto de la session selon l'heure d'entrée (heure locale).
  useEffect(() => {
    if (!dateEntree) return;
    const s = sessionFromHour(dateEntree);
    setValue("session", s);
  }, [dateEntree, setValue]);

  // Auto-calc résultat_usd depuis résultat_r et risque_pct * capital (si tous saisis)
  const resultatR = watch("resultat_r");
  useEffect(() => {
    if (resultatR !== null && risquePct !== null) {
      const risqueUsd = (capitalCompte * risquePct) / 100;
      setValue("resultat_usd", Number((resultatR * risqueUsd).toFixed(2)));
    }
  }, [resultatR, risquePct, capitalCompte, setValue]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return toast.error("Non connecté"); }

    const payload = { ...values, user_id: user.id, date_entree: new Date(values.date_entree).toISOString() };
    let trade: { id: string } | null = null;
    let error: { message: string } | null = null;

    if (isEditMode && initialTrade) {
      // UPDATE mode
      const { data, error: e } = await supabase.from("trades").update(payload).eq("id", initialTrade.id).select("id").single();
      trade = data;
      error = e;
    } else {
      // INSERT mode
      const { data, error: e } = await supabase.from("trades").insert(payload).select("id").single();
      trade = data;
      error = e;
    }

    if (error || !trade) {
      setSubmitting(false);
      return toast.error(error?.message ?? "Erreur enregistrement trade");
    }

    // 2) Upload images (parallèle)
    const uploads = (Object.entries(images) as [ImageKind, File | null][])
      .filter(([, f]) => f)
      .map(async ([kind, file]) => {
        const path = `${user.id}/${trade.id}/${kind}-${Date.now()}.${file!.name.split(".").pop()}`;
        const { error: upErr } = await supabase.storage.from("trade-images").upload(path, file!);
        if (upErr) throw upErr;
        await supabase.from("trade_images").insert({ user_id: user.id, trade_id: trade.id, kind, storage_path: path });
      });

    try { await Promise.all(uploads); }
    catch (e) { toast.error("Trade créé mais erreur upload images : " + (e as Error).message); }

    setSubmitting(false);
    toast.success("Trade enregistré");
    router.push("/trades");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ================================ RANGÉE 1 ================================ */}
      <Card>
        <CardHeader><CardTitle className="text-base">1 · Contexte & Psychologie</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <div className="space-y-1">
            <Label>Compte</Label>
            <Controller name="compte_id" control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {comptes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nom} ({c.type})</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          </div>
          <div className="space-y-1">
            <Label>Date & heure</Label>
            <Input type="datetime-local" {...register("date_entree")} />
          </div>
          <div className="space-y-1">
            <Label>Paire / Actif</Label>
            <div className="flex gap-1">
              <Input {...register("paire")} className="uppercase" />
            </div>
            <div className="flex flex-wrap gap-1">
              {PAIRES_QUICK.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setValue("paire", p)}
                  className="rounded bg-muted px-2 py-0.5 text-[10px] hover:bg-accent"
                >{p}</button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label>Direction</Label>
            <Controller name="direction" control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="long">Long (Achat)</SelectItem>
                  <SelectItem value="short">Short (Vente)</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </div>
          <div className="space-y-1">
            <Label>Session <span className="text-[10px] text-muted-foreground">(auto)</span></Label>
            <Controller name="session" control={control} render={({ field }) => (
              <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SESSIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          </div>
          <div className="space-y-1">
            <Label>État mental</Label>
            <Controller name="emotion" control={control} render={({ field }) => (
              <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMOTIONS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          </div>
        </CardContent>
      </Card>

      {/* ================================ RANGÉE 2 ================================ */}
      <div className="space-y-3">
        <PositionCalculator
          paire={paire}
          defaultCapital={capitalCompte}
          onLotSize={(lots) => setValue("taille_lots", lots)}
        />
        <Card>
          <CardHeader><CardTitle className="text-base">2 · Exécution & Risk Management</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <div className="space-y-1">
              <Label>Prix d&apos;entrée</Label>
              <Input type="number" step="any" {...register("prix_entree", { setValueAs: (v) => v === "" ? null : Number(v) })} />
            </div>
            <div className="space-y-1">
              <Label>Stop Loss</Label>
              <Input type="number" step="any" {...register("stop_loss", { setValueAs: (v) => v === "" ? null : Number(v) })} />
            </div>
            <div className="space-y-1">
              <Label>Take Profit</Label>
              <Input type="number" step="any" {...register("take_profit", { setValueAs: (v) => v === "" ? null : Number(v) })} />
            </div>
            <div className="space-y-1">
              <Label>Statut</Label>
              <Controller name="statut" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-1">
              <Label>Risque (%)</Label>
              <Input type="number" step="0.1" {...register("risque_pct", { setValueAs: (v) => v === "" ? null : Number(v) })} />
            </div>
            <div className="space-y-1">
              <Label>Taille (lots) <span className="text-[10px] text-muted-foreground">(auto)</span></Label>
              <Input type="number" step="0.01" {...register("taille_lots", { setValueAs: (v) => v === "" ? null : Number(v) })} />
            </div>
            <div className="space-y-1">
              <Label>Résultat (R)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder={statut === "tp" ? "auto ex: 2" : statut === "sl" ? "-1" : "0"}
                {...register("resultat_r", { setValueAs: (v) => v === "" ? null : Number(v) })}
              />
            </div>
            <div className="space-y-1">
              <Label>Résultat ($) — auto</Label>
              <Input type="number" step="0.01" className="bg-muted"
                {...register("resultat_usd", { setValueAs: (v) => v === "" ? null : Number(v) })} />
            </div>
          </CardContent>
        </Card>
        <Controller name="partial_exits" control={control} render={({ field }) => (
          <PartialExitsEditor value={field.value ?? []} onChange={field.onChange} />
        )} />
      </div>

      {/* ================================ RANGÉE 3 ================================ */}
      <Card>
        <CardHeader><CardTitle className="text-base">3 · Technique, Discipline & Visuels</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <Label>Setup / Modèle</Label>
              <Controller name="setup_id" control={control} render={({ field }) => (
                <DynamicSelect
                  table="setups"
                  label="Setup"
                  options={setups.map((s) => ({ id: s.id, nom: s.nom }))}
                  value={field.value}
                  onChange={field.onChange}
                  onCreated={(opt) => setSetups((prev) => [...prev, { ...opt, user_id: "", description: null, created_at: "" }])}
                />
              )} />
            </div>
            <div className="space-y-1">
              <Label>Niveau / Zone clé</Label>
              <Controller name="niveau_id" control={control} render={({ field }) => (
                <DynamicSelect
                  table="niveaux"
                  label="Niveau"
                  options={niveaux.map((n) => ({ id: n.id, nom: n.nom }))}
                  value={field.value}
                  onChange={field.onChange}
                  onCreated={(opt) => setNiveaux((prev) => [...prev, { ...opt, user_id: "", description: null, created_at: "" }])}
                />
              )} />
            </div>
            <div className="flex items-end gap-3">
              <div>
                <Label>Respect du plan</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Controller name="respect_plan" control={control} render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )} />
                  <span className="text-sm text-muted-foreground">{watch("respect_plan") ? "Oui" : "Non"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <ImageDropzone kind="avant"   label="Chart Avant (Analyse)"  value={images.avant}   onChange={(f) => setImages((s) => ({ ...s, avant: f }))} />
            <ImageDropzone kind="pendant" label="Chart Pendant"           value={images.pendant} onChange={(f) => setImages((s) => ({ ...s, pendant: f }))} />
            <ImageDropzone kind="apres"   label="Chart Après (Résultat)" value={images.apres}   onChange={(f) => setImages((s) => ({ ...s, apres: f }))} />
          </div>

          <div className="space-y-1">
            <Label>Commentaires & auto-analyse</Label>
            <Textarea rows={4} {...register("commentaire")} placeholder="Ce que j'ai bien fait, ce que je dois améliorer..." />
          </div>
        </CardContent>
      </Card>

      {Object.keys(errors).length > 0 && (
        <p className="text-sm text-destructive">Certains champs sont invalides.</p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>Annuler</Button>
        <Button type="submit" disabled={submitting} className="gradient-primary text-white shadow-lg shadow-primary/20 hover:opacity-90">
          {submitting ? "Enregistrement..." : isEditMode ? "Mettre à jour" : "Enregistrer le trade"}
        </Button>
      </div>
    </form>
  );
}
