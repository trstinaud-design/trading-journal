-- Ajoute une valeur "hors_timing" pour les trades pris en dehors des
-- fenêtres d'activité principales (Asie/Londres/NY).
alter type session add value if not exists 'hors_timing';
