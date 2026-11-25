-- Archivage des setups / niveaux.
-- "Archivé" = retiré de la liste et des sélecteurs, MAIS conservé en base
-- pour que son nom reste affiché sur les anciens trades. Aucune donnée perdue.
alter table public.setups
  add column if not exists archived boolean not null default false;

alter table public.niveaux
  add column if not exists archived boolean not null default false;
