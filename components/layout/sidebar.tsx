"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Plus, ListChecks, Images, Settings, LogOut, Sparkles, Wallet, Palette } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trades/new", label: "Nouveau trade", icon: Plus, highlight: true },
  { href: "/trades", label: "Mes trades", icon: ListChecks },
  { href: "/insights", label: "Insights", icon: Sparkles },
  { href: "/gallery", label: "Galerie", icon: Images },
  { href: "/comptes", label: "Comptes", icon: Wallet },
  { href: "/setups", label: "Setups & Niveaux", icon: Settings },
  { href: "/parametres", label: "Apparence", icon: Palette },
];

export function Sidebar({ email }: { email: string | null }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r liquid-glass p-4">
      <div className="mb-8 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-md gradient-gold">
          <span className="font-display text-sm font-extrabold text-[hsl(192_40%_8%)]">◆</span>
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-sm font-bold leading-tight tracking-tight">Instrument</h1>
          <p className="truncate text-[11px] text-muted-foreground">{email}</p>
        </div>
      </div>

      <nav className="relative flex-1 space-y-1">
        {links.map(({ href, label, icon: Icon, highlight }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                active
                  ? "nav-active bg-primary/15 text-primary shadow-sm ring-1 ring-primary/20"
                  : highlight
                    ? "text-foreground hover:bg-primary/10 hover:text-primary"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground hover:backdrop-blur-sm",
              )}
            >
              <Icon className={cn("h-4 w-4 transition-transform duration-300", highlight && !active && "text-primary group-hover:scale-110", active && "scale-110")} />
              <span className="font-display">{label}</span>
              {highlight && !active && (
                <span className="ml-auto text-[10px] font-semibold uppercase text-primary/70">Nouveau</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 pt-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="flex-1 justify-start text-muted-foreground hover:text-destructive" onClick={logout}>
            <LogOut className="h-4 w-4" /> Déconnexion
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
