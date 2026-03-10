// app/agent/layout.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Briefcase, User, LogOut, ShieldCheck } from "lucide-react";

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: agentProfile } = await supabase
    .from("agents")
    .select("name, agency_name")
    .eq("user_id", user.id)
    .single();

  const initial = agentProfile?.name?.charAt(0)?.toUpperCase() || "A";

  return (
    <div className="min-h-screen bg-cool-steel-50 flex flex-col">

      {/* ── TOP BAR ────────────────────────────────────────────────── */}
      <header className="bg-deep-space-blue-950 sticky top-0 z-50 border-b border-white/5">
        <div className="flex items-center justify-between px-5 py-3.5 max-w-lg mx-auto">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-tuscan-sun-500 flex items-center justify-center shadow-[0_0_14px_rgba(232,169,23,0.35)]">
              <ShieldCheck className="h-5 w-5 text-deep-space-blue-950" />
            </div>
            <div className="leading-none">
              <p className="text-[15px] font-black tracking-tight text-white">
                Bandarin <span className="text-tuscan-sun-400">Agent</span>
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cool-steel-400 mt-0.5">
                {agentProfile?.agency_name || "Official Partner"}
              </p>
            </div>
          </div>

          {/* Avatar */}
          <div className="h-9 w-9 rounded-full ring-2 ring-tuscan-sun-500/60 bg-deep-space-blue-800 flex items-center justify-center">
            <span className="text-sm font-black text-tuscan-sun-400">{initial}</span>
          </div>
        </div>
      </header>

      {/* ── CONTENT ────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-5 pb-28">
        {children}
      </main>

      {/* ── BOTTOM NAV ─────────────────────────────────────────────── */}
      <nav className="fixed bottom-4 inset-x-0 flex justify-center z-50 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1 bg-deep-space-blue-950/95 backdrop-blur-sm border border-white/10 rounded-2xl px-2 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
          <NavItem href="/agent" icon={<Briefcase className="h-5 w-5" />} label="Tugas" />
          <NavItem href="/agent/profile" icon={<User className="h-5 w-5" />} label="Profil" />
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex flex-col items-center gap-1 px-5 py-2 rounded-xl text-cool-steel-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-[10px] font-bold">Keluar</span>
            </button>
          </form>
        </div>
      </nav>
    </div>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 px-5 py-2 rounded-xl text-cool-steel-400 hover:text-tuscan-sun-400 transition-colors"
    >
      {icon}
      <span className="text-[10px] font-bold">{label}</span>
    </Link>
  );
}
