-- Remplace toutes les valeurs "chevauchement_ldn_ny" par "hors_timing"
update public.trades set session = 'hors_timing' where session = 'chevauchement_ldn_ny';
