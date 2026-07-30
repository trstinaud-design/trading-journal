-- =====================================================================
-- Trading Journal — schéma initial
-- Multi-utilisateur avec Row Level Security (RLS) sur toutes les tables.
-- Chaque ligne appartient à un user_id (= auth.users.id de Supabase Auth).
-- =====================================================================

-- ENUMS
create type account_type as enum ('evaluation', 'prop_finance', 'reel', 'demo');
create type direction as enum ('long', 'short');
create type session as enum ('asie', 'londres', 'ny', 'chevauchement_ldn_ny');
create type emotion as enum ('calme', 'confiant', 'impatient', 'fomo', 'revenge', 'stresse');
create type trade_status as enum ('tp', 'sl', 'be', 'manuel');
create type image_kind as enum ('avant', 'pendant', 'apres');

-- COMPTES
create table public.comptes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nom text not null,
  type account_type not null,
  capital_initial numeric(14,2) not null default 0,
  devise text not null default 'USD',
  created_at timestamptz not null default now()
);
create index on public.comptes(user_id);

-- SETUPS (dynamiques, ajoutables par l'utilisateur)
create table public.setups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nom text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (user_id, nom)
);
create index on public.setups(user_id);

-- NIVEAUX (dynamiques)
create table public.niveaux (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nom text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (user_id, nom)
);
create index on public.niveaux(user_id);

-- TRADES
create table public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  compte_id uuid references public.comptes(id) on delete set null,

  -- Rangée 1 : Contexte
  date_entree timestamptz not null,
  paire text not null,
  direction direction not null,
  session session,
  emotion emotion,

  -- Rangée 2 : Exécution & Risk
  prix_entree numeric(18,8),
  stop_loss numeric(18,8),
  take_profit numeric(18,8),
  statut trade_status not null,
  risque_pct numeric(6,3),
  taille_lots numeric(14,4),
  resultat_r numeric(8,3),      -- multiples de R (peut être négatif)
  resultat_usd numeric(14,2),   -- gain/perte net en devise du compte

  -- Rangée 3 : Technique
  setup_id uuid references public.setups(id) on delete set null,
  niveau_id uuid references public.niveaux(id) on delete set null,
  respect_plan boolean not null default true,
  commentaire text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.trades(user_id, date_entree desc);
create index on public.trades(user_id, setup_id);
create index on public.trades(user_id, niveau_id);
create index on public.trades(user_id, statut);

-- Trigger updated_at
create or replace function public.set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger trg_trades_updated_at
before update on public.trades
for each row execute function public.set_updated_at();

-- IMAGES (jusqu'à 3 par trade : avant / pendant / apres)
create table public.trade_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trade_id uuid not null references public.trades(id) on delete cascade,
  kind image_kind not null,
  storage_path text not null,   -- chemin dans le bucket 'trade-images'
  created_at timestamptz not null default now(),
  unique (trade_id, kind)
);
create index on public.trade_images(user_id);
create index on public.trade_images(trade_id);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.comptes       enable row level security;
alter table public.setups        enable row level security;
alter table public.niveaux       enable row level security;
alter table public.trades        enable row level security;
alter table public.trade_images  enable row level security;

-- Policies génériques : un user ne voit et n'écrit que ses propres lignes.
create policy "own comptes"      on public.comptes      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own setups"       on public.setups       for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own niveaux"      on public.niveaux      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own trades"       on public.trades       for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own trade_images" on public.trade_images for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =====================================================================
-- Storage bucket pour les images (à créer via l'UI Supabase ou l'API).
-- Nom : trade-images  —  Public : NON (accès par signed URL).
-- Policy : un user ne peut lire/écrire que dans son propre dossier (user_id/...).
-- =====================================================================
-- Après avoir créé le bucket dans le dashboard Supabase, exécuter :
--
-- create policy "own storage read"
-- on storage.objects for select
-- using (bucket_id = 'trade-images' and auth.uid()::text = (storage.foldername(name))[1]);
--
-- create policy "own storage write"
-- on storage.objects for insert
-- with check (bucket_id = 'trade-images' and auth.uid()::text = (storage.foldername(name))[1]);
--
-- create policy "own storage delete"
-- on storage.objects for delete
-- using (bucket_id = 'trade-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================================
-- Seed helper : à l'inscription, on peut préremplir quelques setups/niveaux.
-- Trigger côté auth pour créer les valeurs par défaut à la première connexion.
-- =====================================================================
create or replace function public.seed_defaults_for_user() returns trigger as $$
begin
  insert into public.setups (user_id, nom, description) values
    (new.id, 'Order Block',       'OB haute probabilité en zone premium/discount'),
    (new.id, 'FVG',               'Fair Value Gap non mitigé'),
    (new.id, 'Breaker Block',     'BB avec confirmation MSS'),
    (new.id, 'Liquidity Sweep',   'Sweep + retour = confirmation directionnelle'),
    (new.id, 'CHOCH / MSS',       'Change of character sur LTF après liquidity grab')
  on conflict do nothing;

  insert into public.niveaux (user_id, nom, description) values
    (new.id, 'HTF Support/Résistance', 'S/R identifié sur H4 ou plus haut'),
    (new.id, 'Daily High/Low',         'Extrêmes du jour précédent (liquidité)'),
    (new.id, 'Weekly High/Low',        'Extrêmes de la semaine (liquidité HTF)'),
    (new.id, 'Session High/Low',       'Highs/Lows de la session en cours'),
    (new.id, 'Equal Highs/Lows',       'Zones de liquidité alignée')
  on conflict do nothing;

  insert into public.comptes (user_id, nom, type, capital_initial, devise) values
    (new.id, 'Compte principal', 'demo', 10000, 'USD');

  return new;
end;
$$ language plpgsql security definer;

create trigger trg_seed_on_signup
after insert on auth.users
for each row execute function public.seed_defaults_for_user();
