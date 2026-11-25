-- =====================================================================
-- Plusieurs setups / niveaux par trade.
-- Additif : on AJOUTE des colonnes tableau et on migre les valeurs
-- existantes dedans. Les anciennes colonnes setup_id / niveau_id sont
-- CONSERVÉES (toujours = 1er élément) pour compatibilité. Zéro perte.
-- =====================================================================
alter table public.trades
  add column if not exists setup_ids uuid[] not null default '{}';

alter table public.trades
  add column if not exists niveau_ids uuid[] not null default '{}';

-- Backfill : recopie le setup_id / niveau_id unique existant dans le tableau
update public.trades
  set setup_ids = array[setup_id]
  where setup_id is not null and (setup_ids is null or setup_ids = '{}');

update public.trades
  set niveau_ids = array[niveau_id]
  where niveau_id is not null and (niveau_ids is null or niveau_ids = '{}');
