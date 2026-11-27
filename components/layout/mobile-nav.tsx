"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Plus, ListChecks, Images, Settings, LogOut, Menu, X, Sparkles, Wallet, Palette } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trades/new", label: "Nouveau trade", icon: Plus },
  { href: "/trades", label: "Mes trades", icon: ListChecks },
  { href: "/insights", label: "Insights", icon: Sparkles },
  { href: "/gallery", label: "Galerie", icon: Images },
  { href: "/comptes", label: "Comptes", icon: Wallet },
  { href: "/setups", label: "Setups & Niveaux", icon: Settings },
  { href: "/parametres", label: "Apparence", icon: Palette },
];

/** Top-bar mobile avec drawer sidebar. Visible < lg. */
export function MobileNav({ email }: { email: string | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Ferme le drawer au changement de route
  useEffect(() => { setOpen(false); }, [pathname]);
  // Empêche le scroll du body quand le drawer est ouvert
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Top bar mobile */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b liquid-glass px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md gradient-gold"><span className="font-display text-xs font-extrabold text-[hsl(192_40%_8%)]">◆</span></div>
          <span className="font-display text-sm font-bold tracking-tight">Instrument</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col liquid-glass p-4 duration-300 animate-in slide-in-from-left" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-md gradient-gold">
                  <span className="font-display text-sm font-extrabold text-[hsl(192_40%_8%)]">◆</span>
                </div>
                <div className="min-w-0">
                  <h1 className="font-display text-sm font-bold leading-tight tracking-tight">Instrument</h1>
                  <p className="truncate text-[11px] text-muted-foreground">{email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Fermer le menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-display">{label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-border/60 pt-3">
              <div className="flex items-center justify-between">
                <Button variant="ghost" className="flex-1 justify-start text-muted-foreground hover:text-destructive" onClick={logout}>
                  <LogOut className="h-4 w-4" /> Déconnexion
                </Button>
                <ThemeToggle />
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
