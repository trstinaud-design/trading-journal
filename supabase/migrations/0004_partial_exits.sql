-- Sorties partielles : tableau JSON de { price, pct, r_partial }
-- Chaque objet représente une clôture partielle du trade.
alter table public.trades
  add column if not exists partial_exits jsonb not null default '[]'::jsonb;

-- Index GIN pour requêtes éventuelles sur les exits
create index if not exists trades_partial_exits_gin on public.trades using gin (partial_exits);
