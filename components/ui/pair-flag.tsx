import { cn } from "@/lib/utils/cn";

// Drapeau emoji par devise
const CURRENCY_FLAG: Record<string, string> = {
  USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", JPY: "🇯🇵", CHF: "🇨🇭",
  CAD: "🇨🇦", AUD: "🇦🇺", NZD: "🇳🇿", CNH: "🇨🇳", CNY: "🇨🇳",
  SGD: "🇸🇬", HKD: "🇭🇰", SEK: "🇸🇪", NOK: "🇳🇴", MXN: "🇲🇽",
  ZAR: "🇿🇦", TRY: "🇹🇷", PLN: "🇵🇱",
};

// Icône pour matières premières / indices / crypto
const SPECIAL_ICON: { test: (p: string) => boolean; icon: string }[] = [
  { test: (p) => p.startsWith("XAU") || p === "GOLD", icon: "🥇" },
  { test: (p) => p.startsWith("XAG") || p === "SILVER", icon: "🥈" },
  { test: (p) => p.includes("OIL") || p.startsWith("WTI") || p.startsWith("UKOIL") || p.startsWith("USOIL") || p.startsWith("BRENT"), icon: "🛢️" },
  { test: (p) => p.startsWith("US30") || p.startsWith("DJ") || p.startsWith("DOW"), icon: "🇺🇸" },
  { test: (p) => p.startsWith("NAS") || p.startsWith("US100") || p.startsWith("NDX"), icon: "💻" },
  { test: (p) => p.startsWith("SPX") || p.startsWith("US500") || p.startsWith("SP500"), icon: "📊" },
  { test: (p) => p.startsWith("GER") || p.startsWith("DAX") || p.startsWith("DE40"), icon: "🇩🇪" },
  { test: (p) => p.startsWith("UK100") || p.startsWith("FTSE"), icon: "🇬🇧" },
  { test: (p) => p.startsWith("JP225") || p.startsWith("NIK") || p.startsWith("NKY"), icon: "🇯🇵" },
  { test: (p) => p.startsWith("BTC"), icon: "₿" },
  { test: (p) => p.startsWith("ETH"), icon: "Ξ" },
];

/** Renvoie l'icône / les drapeaux représentant une paire ou un actif. */
export function pairIcons(paire: string): string {
  const p = paire.toUpperCase().replace(/[^A-Z0-9]/g, "");

  // Cas spéciaux (or, indices, crypto)
  for (const s of SPECIAL_ICON) {
    if (s.test(p)) {
      // Paire type XAUUSD → icône + drapeau du quote (USD)
      const quote = p.slice(-3);
      const quoteFlag = CURRENCY_FLAG[quote];
      return quoteFlag && !s.test(quote) ? `${s.icon}${quoteFlag}` : s.icon;
    }
  }

  // Forex standard : 6 lettres = base(3) + quote(3)
  if (p.length === 6) {
    const base = CURRENCY_FLAG[p.slice(0, 3)];
    const quote = CURRENCY_FLAG[p.slice(3, 6)];
    if (base && quote) return `${base}${quote}`;
  }
  return "📈";
}

/** Affiche les drapeaux + le nom de la paire. */
export function PairFlag({ paire, className }: { paire: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="text-base leading-none" aria-hidden>{pairIcons(paire)}</span>
      <span className="font-medium">{paire}</span>
    </span>
  );
}
