"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Plus, ListChecks, Images, Settings, LogOut, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trades/new", label: "Nouveau trade", icon: Plus, highlight: true },
  { href: "/trades", label: "Mes trades", icon: ListChecks },
  { href: "/gallery", label: "Galerie", icon: Images },
  { href: "/setups", label: "Setups & Niveaux", icon: Settings },
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
    <aside className="flex h-screen w-64 flex-col border-r border-border/60 card-glass p-4">
      <div className="mb-8 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary glow-primary">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold leading-tight">Trading Journal</h1>
          <p className="truncate text-[11px] text-muted-foreground">{email}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {links.map(({ href, label, icon: Icon, highlight }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-primary/15 text-primary shadow-sm"
                  : highlight
                    ? "text-foreground hover:bg-primary/10 hover:text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4 transition-transform", highlight && !active && "text-primary group-hover:scale-110")} />
              {label}
              {highlight && !active && (
                <span className="ml-auto text-[10px] font-semibold uppercase text-primary/70">Nouveau</span>
              )}
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
  );
}
