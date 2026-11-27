import { cn } from "@/lib/utils/cn";

export type EmblemKind = "winrate" | "pf" | "pnl" | "net" | "expectancy" | "drawdown" | "count";

// Dégradés par métrique — variés mais tenus (famille brass / viridian / cyan / coral)
const GRAD: Record<EmblemKind, [string, string]> = {
  winrate:    ["#1FC98A", "#0E9FA8"],
  pf:         ["#F0BE4C", "#C87A1C"],
  pnl:        ["#4FA8FF", "#3C63F0"],
  net:        ["#F2A64B", "#E0533D"],
  expectancy: ["#FF7FB0", "#E0479B"],
  drawdown:   ["#FF6B57", "#D63A2C"],
  count:      ["#8FA0AE", "#5B6B78"],
};

// Glyphe blanc par métrique (SVG, trait net)
function Glyph({ kind }: { kind: EmblemKind }) {
  const s = { fill: "none", stroke: "#fff", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (kind) {
    case "winrate": // cible
      return <g {...s}><circle cx="12" cy="12" r="7.5" /><circle cx="12" cy="12" r="3.6" /><circle cx="12" cy="12" r="0.4" fill="#fff" /></g>;
    case "pf": // balance
      return <g {...s}><path d="M12 5v13" /><path d="M6.5 18h11" /><path d="M5 8l7-2 7 2" /><path d="M5 8l-2 4.2a3 3 0 0 0 4 0L5 8z" /><path d="M19 8l-2 4.2a3 3 0 0 0 4 0L19 8z" /></g>;
    case "pnl": // pourcentage
      return <g {...s}><circle cx="8" cy="8" r="2" /><circle cx="16" cy="16" r="2" /><path d="M7 17L17 7" /></g>;
    case "net": // billets empilés
      return <g {...s}><rect x="4" y="7" width="16" height="10" rx="2" /><circle cx="12" cy="12" r="2.2" /><path d="M7.5 9.5v5M16.5 9.5v5" /></g>;
    case "expectancy": // dé (probabilité)
      return <g {...s}><rect x="5" y="5" width="14" height="14" rx="3" /><circle cx="9" cy="9" r="0.6" fill="#fff" /><circle cx="15" cy="9" r="0.6" fill="#fff" /><circle cx="12" cy="12" r="0.6" fill="#fff" /><circle cx="9" cy="15" r="0.6" fill="#fff" /><circle cx="15" cy="15" r="0.6" fill="#fff" /></g>;
    case "drawdown": // pente descendante
      return <g {...s}><path d="M4 7l5 5 3-2 8 7" /><path d="M20 17v-4M20 17h-4" /></g>;
    case "count": // pile
      return <g {...s}><path d="M5 8l7-3 7 3-7 3-7-3z" /><path d="M5 12l7 3 7-3" /><path d="M5 16l7 3 7-3" /></g>;
  }
}

export function MetricEmblem({ kind, className }: { kind: EmblemKind; className?: string }) {
  const [a, b] = GRAD[kind];
  const gid = `emb-${kind}`;
  return (
    <span className={cn("emblem relative inline-flex h-10 w-10 items-center justify-center rounded-[13px]", className)}
      style={{ backgroundImage: `linear-gradient(145deg, ${a}, ${b})`, boxShadow: `0 6px 16px -6px ${b}99, inset 0 1px 0 rgba(255,255,255,.35)` }}>
      <svg viewBox="0 0 24 24" className="h-5 w-5 drop-shadow-[0_1px_1px_rgba(0,0,0,.25)]" aria-hidden>
        <defs><linearGradient id={gid} /></defs>
        <Glyph kind={kind} />
      </svg>
    </span>
  );
}
