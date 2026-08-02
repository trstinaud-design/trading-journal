#!/usr/bin/env node
/**
 * Import mitradacademy → trading-journal (Supabase)
 *
 * Usage :
 *   1. Assure-toi que les migrations 0001-0005 sont exécutées sur Supabase
 *   2. Exporte les 2 variables d'env :
 *        SUPABASE_URL       = https://xxx.supabase.co
 *        SUPABASE_SERVICE_ROLE_KEY = clé service_role (BYPASS RLS)
 *        USER_EMAIL         = email de ton compte trading-journal (pour retrouver ton user_id)
 *   3. node scripts/import-mitrad.mjs
 *
 * Corrige automatiquement les erreurs de calcul :
 *   - LOSS avec result_r = 0  → force -1R
 *   - WIN  avec result_r = 0  → reclassé en BE
 */
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USER_EMAIL   = process.env.USER_EMAIL;

if (!SUPABASE_URL || !SERVICE_KEY || !USER_EMAIL) {
  console.error("❌ Env vars manquantes : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, USER_EMAIL");
  process.exit(1);
}

const supa = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// ── MAPPING ────────────────────────────────────────────────────────────────
const STATUS = { WIN: "tp", LOSS: "sl", BE: "be" };
const DIRECTION = { BUY: "long", SELL: "short" };
const SESSION = {
  "London": "londres",
  "London/NY Overlap": "chevauchement_ldn_ny",
  "New York": "ny",
  "Asia": "asie",
};
const EMOTION = {
  "Confiant": "confiant",
  "FOMO": "fomo",
  "Neutre": "calme",
  "Revenge Trading": "revenge",
  "Stressé": "stresse",
  "Surexcité": "surexcite",
};

// ── 1. TROUVE L'UTILISATEUR ────────────────────────────────────────────────
console.log(`🔎 Recherche user ${USER_EMAIL}...`);
const { data: usersList, error: uErr } = await supa.auth.admin.listUsers();
if (uErr) { console.error("Erreur listUsers:", uErr.message); process.exit(1); }
const user = usersList.users.find((u) => u.email === USER_EMAIL);
if (!user) {
  console.error(`❌ Utilisateur ${USER_EMAIL} introuvable. Crée-le d'abord sur trading-journal.`);
  process.exit(1);
}
console.log(`✅ User trouvé : ${user.id}`);

// ── 2. LECTURE DE L'EXPORT ─────────────────────────────────────────────────
const raw = await readFile(new URL("./mitradacademy-export.json", import.meta.url), "utf8");
const data = JSON.parse(raw);
const trades = data.trades_account_17 ?? [];
const accounts = data.accounts ?? [];
console.log(`📥 ${trades.length} trades à importer sur ${accounts.length} compte(s)`);

// ── 3. CRÉE / RÉCUPÈRE LES COMPTES ─────────────────────────────────────────
const comptesMap = new Map(); // mitrad_id → new_id
for (const a of accounts) {
  const nom = a.name + " (import)";
  const capital = parseFloat(a.capital) || 0;

  // Cherche existant
  const { data: existing } = await supa.from("comptes").select("id").eq("user_id", user.id).eq("nom", nom).maybeSingle();
  if (existing) {
    comptesMap.set(a.id, existing.id);
    console.log(`  ↪️  Compte ${nom} déjà existant : ${existing.id}`);
    continue;
  }

  const { data: inserted, error: e } = await supa
    .from("comptes")
    .insert({ user_id: user.id, nom, type: "prop_finance", capital_initial: capital, devise: "USD", default_risk_pct: 1 })
    .select("id")
    .single();
  if (e) { console.error(`❌ Compte ${nom}:`, e.message); continue; }
  comptesMap.set(a.id, inserted.id);
  console.log(`  ✅ Compte créé ${nom} → ${inserted.id}`);
}

// ── 4. CRÉE / RÉCUPÈRE LES SETUPS ──────────────────────────────────────────
const setupsMap = new Map(); // nom mitrad → new_id
const distinctSetups = [...new Set(trades.map((t) => t.setup).filter(Boolean))];
console.log(`🎯 ${distinctSetups.length} setups distincts à traiter`);
for (const nom of distinctSetups) {
  const { data: existing } = await supa.from("setups").select("id").eq("user_id", user.id).eq("nom", nom).maybeSingle();
  if (existing) { setupsMap.set(nom, existing.id); continue; }
  const { data: inserted, error: e } = await supa.from("setups").insert({ user_id: user.id, nom }).select("id").single();
  if (e) console.error(`  ❌ Setup ${nom}:`, e.message);
  else { setupsMap.set(nom, inserted.id); console.log(`  ✅ Setup ${nom}`); }
}

// ── 5. IMPORT DES TRADES + IMAGES ──────────────────────────────────────────
let ok = 0, ko = 0, imgOk = 0, imgKo = 0, corrections = 0;
const errors = [];

for (const [i, t] of trades.entries()) {
  const rowNum = i + 1;

  // Corrections automatiques
  let resultR = parseFloat(t.result_r);
  let resultUsd = parseFloat(t.result_dollar);
  let status = STATUS[t.status];

  if (t.status === "LOSS" && resultR === 0) {
    resultR = -1; resultUsd = -(parseFloat(t.result_dollar) === 0 ? 50 : Math.abs(resultUsd) || 50);
    corrections++;
    console.log(`  ⚙️  Trade #${t.id}: LOSS 0R → corrigé en -1R`);
  }
  if (t.status === "WIN" && resultR === 0) {
    status = "be";
    corrections++;
    console.log(`  ⚙️  Trade #${t.id}: WIN 0R → reclassé en BE`);
  }

  const compteId = comptesMap.get(t.trading_account_id);
  const setupId = t.setup ? setupsMap.get(t.setup) : null;

  const payload = {
    user_id: user.id,
    compte_id: compteId,
    date_entree: t.date,
    paire: t.pair,
    direction: DIRECTION[t.direction] ?? "long",
    session: SESSION[t.session] ?? null,
    emotion: EMOTION[t.emotion] ?? null,
    prix_entree: parseFloat(t.entry_price) || null,
    stop_loss: parseFloat(t.stop_loss) || null,
    take_profit: parseFloat(t.take_profit) || null,
    statut: status,
    risque_pct: 1,
    taille_lots: parseFloat(t.lot_size) || null,
    resultat_r: resultR,
    resultat_usd: resultUsd,
    setup_id: setupId,
    niveau_id: null,
    respect_plan: !!t.plan_respected,
    commentaire: [t.entry_note, t.exit_note, t.note].filter(Boolean).join("\n---\n") || null,
    partial_exits: [],
  };

  const { data: inserted, error: e } = await supa.from("trades").insert(payload).select("id").single();
  if (e) {
    ko++;
    errors.push(`#${t.id}: ${e.message}`);
    console.log(`  ❌ Trade ${rowNum}/${trades.length} #${t.id}: ${e.message}`);
    continue;
  }
  ok++;

  // Upload de l'image (base64 → Storage)
  if (t.screenshot?.startsWith("data:image/")) {
    try {
      const [meta, b64] = t.screenshot.split(",");
      const ext = /image\/(\w+)/.exec(meta)?.[1] ?? "png";
      const buf = Buffer.from(b64, "base64");
      const path = `${user.id}/${inserted.id}/apres.${ext}`;
      const { error: upErr } = await supa.storage.from("trade-images").upload(path, buf, {
        contentType: `image/${ext}`,
        upsert: true,
      });
      if (upErr) throw upErr;
      await supa.from("trade_images").insert({
        user_id: user.id, trade_id: inserted.id, kind: "apres", storage_path: path,
      });
      imgOk++;
    } catch (err) {
      imgKo++;
      console.log(`  ⚠️  Trade #${t.id}: image OK trade mais upload KO: ${err.message}`);
    }
  }

  if (rowNum % 5 === 0) console.log(`  📈 ${rowNum}/${trades.length}...`);
}

console.log("");
console.log("=".repeat(60));
console.log("IMPORT TERMINÉ");
console.log("=".repeat(60));
console.log(`✅ ${ok} trades importés`);
console.log(`❌ ${ko} trades en erreur`);
console.log(`🖼️  ${imgOk} images uploadées, ${imgKo} en erreur`);
console.log(`⚙️  ${corrections} corrections de calcul appliquées`);
if (errors.length > 0) {
  console.log("\nDétail erreurs :");
  errors.slice(0, 10).forEach((e) => console.log("  " + e));
}
