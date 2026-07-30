-- Ajoute le % de risque par défaut sur chaque compte.
-- Utilisé pour l'auto-calcul de la taille de position dans le formulaire de trade.
alter table public.comptes
  add column if not exists default_risk_pct numeric(6,3) not null default 1.0;
