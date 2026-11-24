-- Timeframes choisis POUR CE TRADE (où le setup / le niveau a été pris).
-- Additif, aucune donnée existante touchée.
alter table public.trades
  add column if not exists setup_timeframes text[] not null default '{}';

alter table public.trades
  add column if not exists niveau_timeframes text[] not null default '{}';
