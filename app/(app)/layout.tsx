import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="relative flex min-h-screen flex-col lg:flex-row">
      {/* Fond papier millimétré discret — une seule teinte laiton qui descend du haut */}
      <div aria-hidden className="instrument-grid pointer-events-none fixed inset-0 -z-10" />
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,hsl(var(--primary)/0.06),transparent)]" />

      <div className="hidden lg:block">
        <Sidebar email={user.email ?? null} />
      </div>
      <MobileNav email={user.email ?? null} />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
    </div>
  );
}
