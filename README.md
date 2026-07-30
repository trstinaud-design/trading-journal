# Trading Journal

Journal de trading professionnel — Next.js 15 + Supabase.

## Fonctionnalités

- **Formulaire de saisie en 3 rangées** : Contexte/Psycho · Exécution/Risk (avec calculatrice de position) · Technique/Visuels (3 images par trade)
- **Setups & Niveaux dynamiques** : ajout inline depuis le formulaire
- **Dashboard analytics** : Win Rate · Profit Factor · Total R/$ · Espérance · Max Drawdown
- **Vues temporelles** : Equity curve, heatmap calendrier mensuelle, perf par jour de semaine
- **Analyses comparatives** : par setup, niveau, session, émotion, respect du plan
- **Galerie** filtrable avec vue comparative Avant/Après côte à côte
- **Multi-utilisateur** avec Row Level Security Supabase

## Stack

| Couche       | Tech |
|--------------|------|
| Frontend     | Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui |
| Formulaires  | React Hook Form + Zod |
| Graphiques   | Recharts |
| Auth + DB    | Supabase (Postgres + Storage + Auth) |
| Déploiement  | Vercel (front) + Supabase Cloud (DB/Storage) |

## Setup (pas à pas)

### 1. Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) → **New project**
2. Copie les credentials depuis Settings → API :
   - `Project URL`
   - `anon public key`
   - `service_role key` (garde-la secrète)

### 2. Exécuter la migration SQL

Dans le dashboard Supabase → **SQL Editor** → colle le contenu de `supabase/migrations/0001_init.sql` → **Run**.

Ça crée : tables (comptes/setups/niveaux/trades/trade_images) + policies RLS + trigger de seed automatique à l'inscription.

### 3. Créer le bucket de stockage

Dans Supabase → **Storage** → **New bucket** :
- Nom : `trade-images`
- Public : **NON** (accès par signed URL)

Puis dans **SQL Editor**, exécute les 3 policies de storage (commentées en bas du fichier migration) :

```sql
create policy "own storage read"
on storage.objects for select
using (bucket_id = 'trade-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "own storage write"
on storage.objects for insert
with check (bucket_id = 'trade-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "own storage delete"
on storage.objects for delete
using (bucket_id = 'trade-images' and auth.uid()::text = (storage.foldername(name))[1]);
```

### 4. Config env locale

```powershell
cp .env.example .env.local
```

Édite `.env.local` avec tes credentials Supabase.

### 5. Installer & lancer

```powershell
npm install
npm run dev
```

Ouvre http://localhost:3000 → **Créer un compte** → premier trade.

À l'inscription, un compte "démo" à 10 000$ + 5 setups + 5 niveaux sont créés automatiquement (voir trigger `seed_defaults_for_user` dans la migration).

## Structure

```
app/
  (app)/                 ← Routes protégées (layout avec sidebar)
    dashboard/           ← Analytics
    trades/              ← Liste + création
    gallery/             ← Galerie d'images + comparaison
    setups/              ← Gestion setups/niveaux/comptes
  login/                 ← Auth
  signup/
components/
  ui/                    ← shadcn primitives (Button, Card, Select, etc.)
  forms/                 ← trade-form, position-calculator, image-dropzone, dynamic-select
  dashboard/             ← kpi-card, equity-curve, dow-chart, calendar-heatmap, grouped-perf
  layout/                ← sidebar
lib/
  supabase/              ← client, server, middleware
  analytics/metrics.ts   ← computeKPIs, equityCurveR, byDayOfWeek, etc.
  utils/                 ← cn, pip-value (taille de position)
supabase/migrations/     ← 0001_init.sql (schéma + RLS + seed)
types/database.ts        ← Types TS des tables
```

## Notes

- La **valeur du pip** dans `lib/utils/pip-value.ts` est simplifiée. Ajuste selon ton broker (surtout pour l'or et les indices).
- Le **résultat en $** est auto-calculé à partir de `resultat_r × risque_pct × capital` — tu peux l'écraser manuellement pour les clôtures partielles.
- Le seed à l'inscription se déclenche via un trigger sur `auth.users` — désactive-le si tu ne veux pas de valeurs par défaut.
