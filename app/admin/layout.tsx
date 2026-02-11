import React from 'react';
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Layers, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  ShieldCheck,
  BellRing
} from "lucide-react";
import { Button } from "@/components/ui/button";

// IMPORT KOMPONEN THEME TOGGLE
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Proteksi Role Admin
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect("/dashboard");

  const signOut = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  };

  const navItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Manajemen Layanan', href: '/admin/services', icon: Layers },
    { label: 'Daftar Pesanan', href: '/admin/orders', icon: FileText },
    { label: 'Database Klien', href: '/admin/clients', icon: Users },
    { label: 'Pengaturan CRM', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex transition-colors duration-500">
      {/* SIDEBAR STRATEGIS - Tetap Gelap untuk Kontras Profesional */}
      <aside className="w-72 bg-slate-950 dark:bg-black text-slate-300 flex flex-col sticky top-0 h-screen shadow-2xl border-r border-slate-800/50">
        <div className="p-8 border-b border-slate-800/50 flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <span className="font-black text-xl tracking-tighter text-white">BANDARIN<span className="text-blue-500">.</span></span>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-900 hover:text-white transition-all font-bold text-sm group">
              <item.icon className="h-5 w-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800/50 space-y-4">
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Logged in as</p>
            <p className="text-xs font-bold text-white truncate">{user.email}</p>
          </div>
          <form action={signOut}>
            <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 font-bold rounded-xl">
              <LogOut className="h-4 w-4 mr-3" /> Keluar
            </Button>
          </form>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50 dark:bg-slate-950">
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-40 transition-colors duration-500">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Live Pulse</span>
          </div>

          <div className="flex items-center gap-4">
            {/* SEMATAN FITUR AUTO SOLAR */}
            <ThemeToggle />

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2" />

            <Button variant="outline" size="icon" className="rounded-full relative border-2 border-slate-100 dark:border-slate-800 bg-transparent">
              <BellRing className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-blue-600 rounded-full border-2 border-white dark:border-slate-900"></span>
            </Button>
          </div>
        </header>

        <div className="p-10 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}