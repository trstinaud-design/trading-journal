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
      {/* Fond : halo laiton en haut + lueur viridian en bas, sur grain fin */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(60%_42%_at_50%_-8%,hsl(var(--primary)/0.10),transparent_70%),radial-gradient(45%_40%_at_100%_108%,hsl(var(--win)/0.07),transparent_70%)]" />
      <div aria-hidden className="grain pointer-events-none fixed inset-0 -z-10" />

      <div className="hidden lg:block">
        <Sidebar email={user.email ?? null} />
      </div>
      <MobileNav email={user.email ?? null} />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
    </div>
  );
}
