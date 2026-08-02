import { Lightbulb, AlertTriangle, CheckCircle2, Info, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { combineBy, generateAdvice, type Advice } from "@/lib/analytics/insights";
import { cn } from "@/lib/utils/cn";
import type { Trade, Setup, Niveau } from "@/types/database";

const SESSION_LABEL: Record<string, string> = {
  asie: "Asie", londres: "Londres", ny: "New York",
  chevauchement_ldn_ny: "Chevauch. LDN/NY", hors_timing: "Hors timing",
};
const EMOTION_LABEL: Record<string, string> = {
  calme: "Calme", confiant: "Confiant", impatient: "Impatient",
  fomo: "FOMO", revenge: "Revenge", stresse: "Stressé",
};

const TONE_STYLES: Record<Advice["tone"], { bg: string; icon: React.ElementType; iconColor: string; border: string }> = {
  positive: { bg: "bg-emerald-500/10", icon: CheckCircle2, iconColor: "text-emerald-400", border: "border-emerald-500/30" },
  warning:  { bg: "bg-rose-500/10",    icon: AlertTriangle,iconColor: "text-rose-400",    border: "border-rose-500/30" },
  info:     { bg: "bg-sky-500/10",     icon: Info,         iconColor: "text-sky-400",     border: "border-sky-500/30" },
  tip:      { bg: "bg-amber-500/10",   icon: Lightbulb,    iconColor: "text-amber-400",   border: "border-amber-500/30" },
};

export default async function InsightsPage() {
  const supabase = await createClient();
  const [{ data: trades }, { data: setups }, { data: niveaux }] = await Promise.all([
    supabase.from("trades").select("*").order("date_entree"),
    supabase.from("setups").select("id, nom"),
    supabase.from("niveaux").select("id, nom"),
  ]);

  const list = (trades as Trade[]) ?? [];
  const setupLabels = Object.fromEntries((setups as Pick<Setup, "id" | "nom">[] ?? []).map((s) => [s.id, s.nom]));
  const niveauLabels = Object.fromEntries((niveaux as Pick<Niveau, "id" | "nom">[] ?? []).map((n) => [n.id, n.nom]));
  const allLabels: Record<string, Record<string, string>> = {
    setup_id: setupLabels,
    niveau_id: niveauLabels,
    session: SESSION_LABEL,
    emotion: EMOTION_LABEL,
  };

  const advice = generateAdvice(list, { setup: setupLabels, niveau: niveauLabels });

  const bySetupNiveau = combineBy(list, ["setup_id", "niveau_id"], allLabels, 3);
  const bySetupNiveauSession = combineBy(list, ["setup_id", "niveau_id", "session"], allLabels, 2);
  const byPairSession = combineBy(list, ["paire", "session"], allLabels, 3);
  const bySetupPair = combineBy(list, ["setup_id", "paire"], allLabels, 3);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-3xl font-bold">Insights</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Analyses avancées et conseils basés sur tes {list.length} trade{list.length > 1 ? "s" : ""}.
        </p>
      </div>

      {/* ============ CONSEILS ============ */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">💡 Conseils personnalisés</h2>
        {advice.length === 0 ? (
          <Card className="card-glass">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Pas encore assez de données pour te donner des conseils fiables. Reviens après quelques trades.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {advice.map((a, i) => {
              const s = TONE_STYLES[a.tone];
              const Icon = s.icon;
              return (
                <div key={i} className={cn("rounded-xl border p-4", s.bg, s.border)}>
                  <div className="flex items-start gap-3">
                    <Icon className={cn("mt-0.5 h-5 w-5 flex-shrink-0", s.iconColor)} />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">{a.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{a.text}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ============ MEILLEURES COMBINAISONS ============ */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ComboCard title="🏆 Meilleures combinaisons Setup + Niveau" rows={bySetupNiveau} />
        <ComboCard title="🎯 Combos Setup + Niveau + Session" rows={bySetupNiveauSession} />
        <ComboCard title="💱 Meilleures combinaisons Paire + Session" rows={byPairSession} />
        <ComboCard title="🧠 Meilleures combinaisons Setup + Paire" rows={bySetupPair} />
      </div>

      {/* ============ COMBOS À ÉVITER ============ */}
      {bySetupNiveau.some((r) => r.totalR < 0) && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">⚠️ Combos à éviter</h2>
          <Card className="card-glass border-rose-500/30">
            <CardContent className="p-4">
              <ul className="space-y-2">
                {bySetupNiveau.filter((r) => r.totalR < -1).slice(0, 5).map((r) => (
                  <li key={r.key} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0">
                    <span className="text-sm">{r.key}</span>
                    <span className="text-sm font-mono text-rose-400">{r.totalR.toFixed(2)} R · {r.n} trades · WR {Math.round(r.winRate * 100)}%</span>
                  </li>
                ))}
                {bySetupNiveau.filter((r) => r.totalR < -1).length === 0 && (
                  <li className="text-sm text-muted-foreground">Aucun combo significativement perdant. 👍</li>
                )}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

function ComboCard({ title, rows }: { title: string; rows: ReturnType<typeof combineBy> }) {
  const top = rows.filter((r) => r.totalR > 0).slice(0, 5);
  return (
    <Card className="card-glass">
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {top.length === 0 ? (
          <p className="text-sm text-muted-foreground">Pas assez de données pour cette combinaison.</p>
        ) : (
          <ol className="space-y-2">
            {top.map((r, i) => (
              <li key={r.key} className="flex items-start gap-3 rounded-lg border border-border/50 p-2.5 transition-colors hover:bg-accent/30">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-1">
                    {r.parts.map((p, j) => (
                      <span key={j} className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase">{p}</span>
                    ))}
                  </div>
                  <div className="mt-1 flex items-baseline gap-3 text-xs text-muted-foreground">
                    <span className="text-sm font-bold text-emerald-400">+{r.totalR} R</span>
                    <span>{r.n} trades</span>
                    <span>WR {Math.round(r.winRate * 100)}%</span>
                    <span>PF {r.profitFactor === 999 ? "∞" : r.profitFactor}</span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
