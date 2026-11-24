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
      {/* Aurora décorative : révèle l'effet verre de la navbar */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[32rem] w-[32rem] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute left-1/3 -top-20 h-[28rem] w-[28rem] rounded-full bg-[hsl(var(--gold))]/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[30rem] w-[30rem] rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="hidden lg:block">
        <Sidebar email={user.email ?? null} />
      </div>
      <MobileNav email={user.email ?? null} />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
    </div>
  );
}
