"use client";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { ImageDropzone } from "./image-dropzone";
import { MultiDynamicSelect } from "./multi-dynamic-select";
import { PartialExitsEditor } from "./partial-exits";
import { autoLotSize, riskPctFromLots } from "@/lib/utils/pip-value";
import { sessionFromHour } from "@/lib/utils/session-from-time";
import { cn } from "@/lib/utils/cn";
import { pairIcons } from "@/components/ui/pair-flag";
import { TimeframePicker } from "@/components/ui/timeframe-picker";
import type { Compte, Setup, Niveau, ImageKind, PartialExit, Trade, Timeframe } from "@/types/database";

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

  setup_ids: z.array(z.string().uuid()).default([]),
  niveau_ids: z.array(z.string().uuid()).default([]),
  setup_timeframes: z.array(z.string()).default([]),
  niveau_timeframes: z.array(z.string()).default([]),
  respect_plan: z.boolean(),
  commentaire: z.string().nullable(),
  partial_exits: z.array(z.object({ price: z.number(), pct: z.number(), r_partial: z.number() })).default([]),
});
type FormValues = z.infer<typeof schema>;

const SESSIONS = [
  { value: "asie", label: "Asie" },
  { value: "londres", label: "Londres" },
  { value: "ny", label: "New York" },
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
// Couleurs par statut (TP vert, SL rouge, BE jaune, Manuel bleu)
const STATUT_TEXT: Record<string, string> = {
  tp: "text-emerald-400", sl: "text-rose-400", be: "text-amber-400", manuel: "text-sky-400",
};
const STATUT_TRIGGER: Record<string, string> = {
  tp: "border-emerald-500/50 text-emerald-400",
  sl: "border-rose-500/50 text-rose-400",
  be: "border-amber-500/50 text-amber-400",
  manuel: "border-sky-500/50 text-sky-400",
};
// Couleurs par session
const SESSION_DOT: Record<string, string> = {
  asie: "bg-violet-400", londres: "bg-orange-400", ny: "bg-blue-400", hors_timing: "bg-rose-400",
};
const PAIRES_QUICK = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "GBPJPY", "US30", "NAS100"];

/** Libellés lisibles pour l'affichage des erreurs. */
const FIELD_LABELS: Record<string, string> = {
  compte_id: "Compte",
  date_entree: "Date & heure",
  paire: "Paire / Actif",
  direction: "Direction",
  session: "Session",
  emotion: "État mental",
  prix_entree: "Prix d'entrée",
  stop_loss: "Stop Loss",
  take_profit: "Take Profit",
  statut: "Statut",
  risque_pct: "Risque (%)",
  taille_lots: "Taille (lots)",
  resultat_r: "Résultat (R)",
  resultat_usd: "Résultat ($)",
  setup_ids: "Setups",
  niveau_ids: "Niveaux",
  setup_timeframes: "Timeframes du setup",
  niveau_timeframes: "Timeframes du niveau",
  respect_plan: "Respect du plan",
  commentaire: "Commentaire",
  partial_exits: "Sorties partielles",
};

type Props = {
  comptes: Compte[];
  setups: Setup[];
  niveaux: Niveau[];
  /** Fournir un trade existant pour passer en mode édition. */
  initialTrade?: Trade;
  /** URLs signées des images déjà enregistrées (mode édition). */
  existingImages?: Partial<Record<ImageKind, string>>;
};

export function TradeForm({ comptes, setups: initialSetups, niveaux: initialNiveaux, initialTrade, existingImages }: Props) {
  const router = useRouter();
  const [setups, setSetups] = useState(initialSetups);
  const [niveaux, setNiveaux] = useState(initialNiveaux);
  const [images, setImages] = useState<Record<ImageKind, File | null>>({ avant: null, pendant: null, apres: null });
  const [submitting, setSubmitting] = useState(false);
  // Quelle valeur l'utilisateur pilote : 'risk' → calcule les lots ; 'lots' → calcule le risque.
  const [riskSource, setRiskSource] = useState<"risk" | "lots">("risk");

  const isEditMode = !!initialTrade;
  // Comptes sélectionnables : on masque les comptes cramés (lecture seule),
  // sauf celui déjà rattaché au trade en cours d'édition.
  const comptesVisibles = comptes.filter((c) => c.statut !== "crame" || c.id === initialTrade?.compte_id);
  const premierActif = comptes.find((c) => c.statut !== "crame");
  const defaultCompte = initialTrade?.compte_id ?? premierActif?.id ?? comptes[0]?.id ?? "";
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
      setup_ids: initialTrade.setup_ids?.length ? initialTrade.setup_ids : (initialTrade.setup_id ? [initialTrade.setup_id] : []),
      niveau_ids: initialTrade.niveau_ids?.length ? initialTrade.niveau_ids : (initialTrade.niveau_id ? [initialTrade.niveau_id] : []),
      setup_timeframes: initialTrade.setup_timeframes ?? [],
      niveau_timeframes: initialTrade.niveau_timeframes ?? [],
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
      setup_ids: [],
      niveau_ids: [],
      setup_timeframes: [],
      niveau_timeframes: [],
      respect_plan: true,
      commentaire: "",
      partial_exits: [],
    },
  });

  /** Bordure rouge + halo si le champ a une erreur zod. */
  const errCls = (name: keyof FormValues) =>
    errors[name] ? "border-destructive ring-1 ring-destructive/40 focus-visible:ring-destructive" : "";

  // En mode édition : on bloque les auto-calculs au 1er rendu pour NE PAS
  // écraser les valeurs enregistrées (session, R, risque, lots...). Ils se
  // réactivent dès que l'utilisateur modifie un champ.
  const skipAuto = useRef(isEditMode);

  const paire = watch("paire");
  const statut = watch("statut");
  const risquePct = watch("risque_pct");
  const compteId = watch("compte_id");
  const prixEntree = watch("prix_entree");
  const stopLoss = watch("stop_loss");
  const dateEntree = watch("date_entree");
  const setupIds = watch("setup_ids");
  const niveauIds = watch("niveau_ids");
  const firstSetupId = setupIds?.[0];
  const firstNiveauId = niveauIds?.[0];

  // 🔁 Pré-remplit les timeframes du trade avec ceux par défaut du 1er setup choisi (si vide).
  useEffect(() => {
    if (skipAuto.current) return;
    if (!firstSetupId) return;
    const s = setups.find((x) => x.id === firstSetupId);
    if (s?.timeframes?.length && (watch("setup_timeframes") ?? []).length === 0) {
      setValue("setup_timeframes", s.timeframes);
    }
  }, [firstSetupId, setups, setValue, watch]);

  useEffect(() => {
    if (skipAuto.current) return;
    if (!firstNiveauId) return;
    const n = niveaux.find((x) => x.id === firstNiveauId);
    if (n?.timeframes?.length && (watch("niveau_timeframes") ?? []).length === 0) {
      setValue("niveau_timeframes", n.timeframes);
    }
  }, [firstNiveauId, niveaux, setValue, watch]);

  const compteCourant = useMemo(() => comptes.find((c) => c.id === compteId), [comptes, compteId]);
  const capitalCompte = compteCourant?.capital_initial ?? defaultCapital;

  // 🔁 Quand on change de compte : recharge automatiquement son % de risque par défaut.
  useEffect(() => {
    if (skipAuto.current) return;
    if (compteCourant?.default_risk_pct != null) {
      setRiskSource("risk");
      setValue("risque_pct", compteCourant.default_risk_pct);
    }
  }, [compteCourant?.id, compteCourant?.default_risk_pct, setValue]);

  const tailleLots = watch("taille_lots");

  // 🔁 Sens RISQUE → LOTS : quand l'utilisateur pilote le risque %, calcule la taille de lot.
  useEffect(() => {
    if (skipAuto.current) return;
    if (riskSource !== "risk") return;
    const lots = autoLotSize(paire, prixEntree, stopLoss, capitalCompte, risquePct ?? 0);
    if (lots > 0) {
      const rounded = Number(lots.toFixed(2));
      if (rounded !== tailleLots) setValue("taille_lots", rounded);
    }
  }, [riskSource, paire, prixEntree, stopLoss, capitalCompte, risquePct, tailleLots, setValue]);

  // 🔁 Sens LOTS → RISQUE : quand l'utilisateur pilote les lots, calcule le risque % en temps réel.
  useEffect(() => {
    if (skipAuto.current) return;
    if (riskSource !== "lots") return;
    const risk = riskPctFromLots(paire, prixEntree, stopLoss, capitalCompte, tailleLots ?? 0);
    if (risk > 0) {
      const rounded = Number(risk.toFixed(3));
      if (rounded !== risquePct) setValue("risque_pct", rounded);
    }
  }, [riskSource, paire, prixEntree, stopLoss, capitalCompte, tailleLots, risquePct, setValue]);

  // 🔁 Détection auto de la session selon l'heure d'entrée (heure locale).
  useEffect(() => {
    if (skipAuto.current) return;
    if (!dateEntree) return;
    const s = sessionFromHour(dateEntree);
    setValue("session", s);
  }, [dateEntree, setValue]);

  // 🔁 Auto-calcul du résultat R selon le statut et les prix
  //   TP     → R = |TP - entrée| / |SL - entrée|  (positif)
  //   SL     → R = -1
  //   BE     → R = 0
  //   MANUEL → l'utilisateur saisit lui-même
  const takeProfit = watch("take_profit");
  useEffect(() => {
    if (skipAuto.current) return;
    if (statut === "sl") {
      setValue("resultat_r", -1);
    } else if (statut === "be") {
      setValue("resultat_r", 0);
    } else if (statut === "tp" && prixEntree != null && stopLoss != null && takeProfit != null) {
      const risque = Math.abs(prixEntree - stopLoss);
      const gain = Math.abs(takeProfit - prixEntree);
      if (risque > 0) setValue("resultat_r", Number((gain / risque).toFixed(2)));
    }
  }, [statut, prixEntree, stopLoss, takeProfit, setValue]);

  // Auto-calc résultat_usd depuis résultat_r et risque_pct * capital (si tous saisis)
  const resultatR = watch("resultat_r");
  useEffect(() => {
    if (skipAuto.current) return;
    if (resultatR !== null && risquePct !== null) {
      const risqueUsd = (capitalCompte * risquePct) / 100;
      setValue("resultat_usd", Number((resultatR * risqueUsd).toFixed(2)));
    }
  }, [resultatR, risquePct, capitalCompte, setValue]);

  // Réactive les auto-calculs APRÈS le premier rendu (déclaré en dernier pour
  // que tous les effets auto ci-dessus aient déjà été ignorés au chargement).
  useEffect(() => {
    const id = setTimeout(() => { skipAuto.current = false; }, 0);
    return () => clearTimeout(id);
  }, []);

  const compteCrame = compteCourant?.statut === "crame";

  async function onSubmit(values: FormValues) {
    if (compteCrame) return toast.error("Ce compte est cramé (lecture seule). Choisis un autre compte.");
    setSubmitting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return toast.error("Non connecté"); }

    const payload = {
      ...values,
      user_id: user.id,
      date_entree: new Date(values.date_entree).toISOString(),
      // Compat : setup_id / niveau_id = 1er élément des tableaux
      setup_id: values.setup_ids[0] ?? null,
      niveau_id: values.niveau_ids[0] ?? null,
    };
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

    // 2) Upload images (parallèle). upsert → remplace proprement une image existante (mode édition).
    const uploads = (Object.entries(images) as [ImageKind, File | null][])
      .filter(([, f]) => f)
      .map(async ([kind, file]) => {
        const path = `${user.id}/${trade.id}/${kind}-${Date.now()}.${file!.name.split(".").pop()}`;
        const { error: upErr } = await supabase.storage.from("trade-images").upload(path, file!);
        if (upErr) throw upErr;
        await supabase.from("trade_images").upsert(
          { user_id: user.id, trade_id: trade.id, kind, storage_path: path },
          { onConflict: "trade_id,kind" },
        );
      });

    try { await Promise.all(uploads); }
    catch (e) { toast.error("Trade créé mais erreur upload images : " + (e as Error).message); }

    setSubmitting(false);
    toast.success("Trade enregistré");
    router.push("/trades");
    router.refresh();
  }

  // Scroll vers l'encart d'erreurs quand la validation zod échoue
  const onInvalid = () => {
    setTimeout(() => {
      document.getElementById("form-errors")?.scrollIntoView({ behavior: "smooth", block: "center" });
      toast.error("Corrige les champs en rouge avant d'enregistrer");
    }, 50);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
      {/* ================================ RANGÉE 1 ================================ */}
      <Card>
        <CardHeader><CardTitle className="text-base">1 · Contexte & Psychologie</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <div className="space-y-1">
            <Label>Compte</Label>
            <Controller name="compte_id" control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className={errCls("compte_id")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {comptesVisibles.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nom} ({c.type}){c.statut === "crame" ? " 🔒 cramé" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
          </div>
          <div className="space-y-1">
            <Label>Date & heure</Label>
            <Input type="datetime-local" className={errCls("date_entree")} {...register("date_entree")} />
          </div>
          <div className="space-y-1">
            <Label className="flex items-center gap-1.5">
              Paire / Actif
              {paire && <span className="text-base leading-none">{pairIcons(paire)}</span>}
            </Label>
            <div className="flex gap-1">
              <Input {...register("paire")} className={`uppercase ${errCls("paire")}`} />
            </div>
            <div className="flex flex-wrap gap-1">
              {PAIRES_QUICK.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setValue("paire", p)}
                  className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] hover:bg-accent"
                >{pairIcons(p)} {p}</button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label>Direction</Label>
            <Controller name="direction" control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className={cn("font-semibold", errCls("direction"),
                  field.value === "long" ? "border-emerald-500/50 text-emerald-400" : "border-rose-500/50 text-rose-400")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="long"><span className="font-semibold text-emerald-400">▲ BUY (Long)</span></SelectItem>
                  <SelectItem value="short"><span className="font-semibold text-rose-400">▼ SELL (Short)</span></SelectItem>
                </SelectContent>
              </Select>
            )} />
          </div>
          <div className="space-y-1">
            <Label>Session <span className="text-[10px] text-muted-foreground">(auto)</span></Label>
            <Controller name="session" control={control} render={({ field }) => (
              <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                <SelectTrigger className={errCls("session")}>
                  <span className="flex items-center gap-2">
                    {field.value && <span className={cn("h-2.5 w-2.5 rounded-full", SESSION_DOT[field.value])} />}
                    <SelectValue />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {SESSIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <span className="flex items-center gap-2">
                        <span className={cn("h-2.5 w-2.5 rounded-full", SESSION_DOT[s.value])} />
                        {s.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
          </div>
          <div className="space-y-1">
            <Label>État mental</Label>
            <Controller name="emotion" control={control} render={({ field }) => (
              <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                <SelectTrigger className={errCls("emotion")}><SelectValue /></SelectTrigger>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>2 · Exécution &amp; Risk Management</span>
              <span className="text-xs font-normal text-muted-foreground">
                Capital du compte : <strong className="text-foreground tabular-nums">${capitalCompte.toLocaleString()}</strong>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <div className="space-y-1">
              <Label>Prix d&apos;entrée</Label>
              <Input type="number" step="any" className={errCls("prix_entree")} {...register("prix_entree", { setValueAs: (v) => v === "" ? null : Number(v) })} />
            </div>
            <div className="space-y-1">
              <Label>Stop Loss</Label>
              <Input type="number" step="any" className={errCls("stop_loss")} {...register("stop_loss", { setValueAs: (v) => v === "" ? null : Number(v) })} />
            </div>
            <div className="space-y-1">
              <Label>Take Profit</Label>
              <Input type="number" step="any" className={errCls("take_profit")} {...register("take_profit", { setValueAs: (v) => v === "" ? null : Number(v) })} />
            </div>
            <div className="space-y-1">
              <Label>Statut</Label>
              <Controller name="statut" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={cn("font-semibold", errCls("statut"), STATUT_TRIGGER[field.value])}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUTS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        <span className={cn("font-semibold", STATUT_TEXT[s.value])}>{s.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-1">
              <Label>Risque (%) {riskSource === "risk" && <span className="text-[10px] text-primary">● pilote</span>}</Label>
              <Input type="number" step="any" className={errCls("risque_pct")} onFocus={() => setRiskSource("risk")} {...register("risque_pct", { setValueAs: (v) => v === "" ? null : Number(v) })} />
            </div>
            <div className="space-y-1">
              <Label>Taille (lots) {riskSource === "lots" ? <span className="text-[10px] text-primary">● pilote</span> : <span className="text-[10px] text-muted-foreground">(auto)</span>}</Label>
              <Input type="number" step="0.01" className={errCls("taille_lots")} onFocus={() => setRiskSource("lots")} {...register("taille_lots", { setValueAs: (v) => v === "" ? null : Number(v) })} />
            </div>
            <div className="space-y-1">
              <Label>Résultat (R) <span className="text-[10px] text-muted-foreground">(auto)</span></Label>
              <Input
                type="number"
                step="0.01"
                className={errCls("resultat_r")}
                placeholder={statut === "tp" ? "calcul auto TP/SL" : statut === "sl" ? "-1" : statut === "be" ? "0" : "à saisir"}
                {...register("resultat_r", { setValueAs: (v) => v === "" ? null : Number(v) })}
              />
            </div>
            <div className="space-y-1">
              <Label>Résultat ($) — auto</Label>
              <Input type="number" step="0.01" className={`bg-muted ${errCls("resultat_usd")}`}
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
              <Label>Setup(s) / Modèle(s) <span className="text-[10px] text-muted-foreground">(plusieurs possibles)</span></Label>
              <Controller name="setup_ids" control={control} render={({ field }) => (
                <MultiDynamicSelect
                  table="setups"
                  label="Setup"
                  options={setups.map((s) => ({ id: s.id, nom: s.nom, archived: s.archived }))}
                  value={field.value ?? []}
                  onChange={field.onChange}
                  onCreated={(opt) => setSetups((prev) => [...prev, { ...opt, user_id: "", description: null, timeframes: [], archived: false, created_at: "" }])}
                />
              )} />
              {setupIds?.length > 0 && (
                <div className="pt-1">
                  <Label className="text-[11px] text-muted-foreground">Timeframe(s) du setup</Label>
                  <Controller name="setup_timeframes" control={control} render={({ field }) => (
                    <TimeframePicker value={(field.value ?? []) as Timeframe[]} onChange={field.onChange} size="sm" />
                  )} />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Label>Niveau(x) / Zone(s) clé <span className="text-[10px] text-muted-foreground">(plusieurs possibles)</span></Label>
              <Controller name="niveau_ids" control={control} render={({ field }) => (
                <MultiDynamicSelect
                  table="niveaux"
                  label="Niveau"
                  options={niveaux.map((n) => ({ id: n.id, nom: n.nom, archived: n.archived }))}
                  value={field.value ?? []}
                  onChange={field.onChange}
                  onCreated={(opt) => setNiveaux((prev) => [...prev, { ...opt, user_id: "", description: null, timeframes: [], archived: false, created_at: "" }])}
                />
              )} />
              {niveauIds?.length > 0 && (
                <div className="pt-1">
                  <Label className="text-[11px] text-muted-foreground">Timeframe(s) du niveau</Label>
                  <Controller name="niveau_timeframes" control={control} render={({ field }) => (
                    <TimeframePicker value={(field.value ?? []) as Timeframe[]} onChange={field.onChange} size="sm" />
                  )} />
                </div>
              )}
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
            <ImageDropzone kind="avant"   label="Chart Avant (Analyse)"  value={images.avant}   existingUrl={existingImages?.avant}   onChange={(f) => setImages((s) => ({ ...s, avant: f }))} />
            <ImageDropzone kind="pendant" label="Chart Pendant"           value={images.pendant} existingUrl={existingImages?.pendant} onChange={(f) => setImages((s) => ({ ...s, pendant: f }))} />
            <ImageDropzone kind="apres"   label="Chart Après (Résultat)" value={images.apres}   existingUrl={existingImages?.apres}   onChange={(f) => setImages((s) => ({ ...s, apres: f }))} />
          </div>
          {isEditMode && (existingImages?.avant || existingImages?.pendant || existingImages?.apres) && (
            <p className="text-[11px] text-muted-foreground">💡 Les images affichées sont celles déjà enregistrées. Dépose une nouvelle image pour la remplacer.</p>
          )}

          <div className="space-y-1">
            <Label>Commentaires & auto-analyse</Label>
            <Textarea rows={4} className={errCls("commentaire")} {...register("commentaire")} placeholder="Ce que j'ai bien fait, ce que je dois améliorer..." />
          </div>
        </CardContent>
      </Card>

      {Object.keys(errors).length > 0 && (
        <div id="form-errors" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <p className="mb-1 font-semibold text-destructive">⚠ Corrige les champs suivants :</p>
          <ul className="ml-4 list-disc space-y-0.5 text-destructive/90">
            {Object.entries(errors).map(([field, err]) => (
              <li key={field}>
                <strong>{FIELD_LABELS[field] ?? field}</strong> : {(err as { message?: string })?.message ?? "invalide"}
              </li>
            ))}
          </ul>
        </div>
      )}

      {compteCrame && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-400">
          🔒 Ce compte est marqué <strong>cramé</strong> (lecture seule). Ses trades restent visibles mais tu ne peux pas en ajouter. Sélectionne un autre compte pour enregistrer.
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>Annuler</Button>
        <Button type="submit" disabled={submitting || compteCrame} className="gradient-primary text-white shadow-lg shadow-primary/20 hover:opacity-90">
          {submitting ? "Enregistrement..." : isEditMode ? "Mettre à jour" : "Enregistrer le trade"}
        </Button>
      </div>
    </form>
  );
}
