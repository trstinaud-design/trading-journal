#!/usr/bin/env node
// Analyse le fichier JSON exporté depuis mitradacademy — affiche stats et mapping nécessaire.
import { readFile } from "node:fs/promises";

const data = JSON.parse(await readFile(new URL("./mitradacademy-export.json", import.meta.url), "utf8"));
const trades = data.trades_account_17 ?? [];
const accounts = data.accounts ?? [];

const distinct = (k) => [...new Set(trades.map((t) => t[k]))].sort();

// Détection des erreurs de calcul (LOSS ou WIN avec result_r = 0)
const badLoss = trades.filter((t) => t.status === "LOSS" && parseFloat(t.result_r) === 0);
const badWin  = trades.filter((t) => t.status === "WIN"  && parseFloat(t.result_r) === 0);

// Taille moyenne des screenshots (base64)
const screenshotBytes = trades.reduce((s, t) => s + (t.screenshot?.length ?? 0), 0);
const avgKb = Math.round(screenshotBytes / trades.length / 1024);

console.log("=".repeat(60));
console.log("EXPORT MITRADACADEMY — Analyse");
console.log("=".repeat(60));
console.log("Comptes :", accounts.map((a) => `${a.id}=${a.name} ($${a.capital})`).join(", "));
console.log("Trades   :", trades.length);
console.log("");
console.log("Valeurs distinctes :");
console.log("  statuts     :", distinct("status").join(", "));
console.log("  directions  :", distinct("direction").join(", "));
console.log("  sessions    :", distinct("session").join(", "));
console.log("  setups      :", distinct("setup").join(", "));
console.log("  emotions    :", distinct("emotion").join(", "));
console.log("  pairs       :", distinct("pair").join(", "));
console.log("");
console.log("Erreurs de calcul détectées :");
console.log(`  ${badLoss.length} LOSS avec result_r = 0  → à corriger en -1R`);
console.log(`  ${badWin.length}  WIN  avec result_r = 0  → à examiner`);
if (badLoss.length > 0) {
  console.log("  IDs des LOSS erronés :", badLoss.map((t) => t.id).join(", "));
}
if (badWin.length > 0) {
  console.log("  IDs des WIN erronés  :", badWin.map((t) => t.id).join(", "));
}
console.log("");
console.log("Screenshots :");
console.log(`  ${trades.filter((t) => t.screenshot).length}/${trades.length} trades ont un screenshot (moyenne ${avgKb} KB en base64)`);
console.log(`  Poids total : ${(screenshotBytes / 1024 / 1024).toFixed(2)} MB`);
