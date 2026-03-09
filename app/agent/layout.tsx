// app/agent/layout.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Briefcase, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Ambil nama agent
  const { data: agentProfile } = await supabase
    .from("agents")
    .select("name, agency_name")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Mobile Topbar */}
      <header className="bg-sky-600 text-white sticky top-0 z-50 shadow-md px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-extrabold text-lg leading-tight">Agent Portal</h1>
          <p className="text-[10px] text-sky-100 uppercase tracking-widest font-medium">
            {agentProfile?.agency_name || "Tim Lapangan"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
            {agentProfile?.name?.charAt(0) || "A"}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto p-4 pb-24">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around p-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 lg:max-w-md lg:left-1/2 lg:-translate-x-1/2 lg:rounded-t-2xl lg:border-x">
        <Link href="/agent" className="flex flex-col items-center p-2 text-sky-600">
          <Briefcase className="h-6 w-6 mb-1" />
          <span className="text-[10px] font-bold">Tugas</span>
        </Link>
        <Link href="/agent/profile" className="flex flex-col items-center p-2 text-slate-400 hover:text-sky-600 transition-colors">
          <User className="h-6 w-6 mb-1" />
          <span className="text-[10px] font-bold">Profil</span>
        </Link>
        <form action="/auth/signout" method="post" className="flex">
          <button type="submit" className="flex flex-col items-center p-2 text-slate-400 hover:text-red-500 transition-colors">
            <LogOut className="h-6 w-6 mb-1" />
            <span className="text-[10px] font-bold">Keluar</span>
          </button>
        </form>
      </nav>
    </div>
  );
}