-- =====================================================================
-- Migration additive : statut de compte + timeframes sur setups/niveaux.
-- AUCUNE donnée existante n'est supprimée ou modifiée.
-- =====================================================================

-- Statut du compte : 'actif' (défaut) ou 'crame' (lecture seule, données conservées)
alter table public.comptes
  add column if not exists statut text not null default 'actif';

-- Timeframes auxquels un setup / niveau est identifié (tableau de texte)
alter table public.setups
  add column if not exists timeframes text[] not null default '{}';

alter table public.niveaux
  add column if not exists timeframes text[] not null default '{}';
