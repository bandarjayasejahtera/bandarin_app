import React from 'react';
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Layers, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  ShieldCheck,
  BellRing,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  
  // 1. Cek User Auth
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-2xl font-bold text-red-600">Anda belum login (No Session)</h1>
        <Link href="/login"><Button>Login Sekarang</Button></Link>
      </div>
    );
  }

  // 2. Proteksi Role Admin (DEBUG MODE: Tanpa Redirect)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*') // Ambil semua kolom untuk cek
    .eq('id', user.id)
    .single();

  // JIKA BUKAN ADMIN: TAMPILKAN ERROR DI LAYAR (JANGAN REDIRECT DULU)
  if (!profile || profile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-10 space-y-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-200 max-w-2xl w-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-100 rounded-full text-red-600">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-800">Akses Ditolak (Debug Mode)</h1>
          </div>
          
          <div className="space-y-4 text-sm font-mono bg-slate-900 text-green-400 p-6 rounded-xl overflow-x-auto">
            <p><strong>User Email:</strong> {user.email}</p>
            <p><strong>User ID:</strong> {user.id}</p>
            <p className={profile ? "text-blue-400" : "text-red-400"}>
              <strong>Profile Found:</strong> {profile ? "YES" : "NO (Cek RLS Policy)"}
            </p>
            <p><strong>Profile Error:</strong> {profileError ? JSON.stringify(profileError) : "None"}</p>
            <p className={profile?.role === 'admin' ? "text-green-400" : "text-red-500 font-bold"}>
              <strong>Current Role:</strong> '{profile?.role}' (Harus 'admin')
            </p>
          </div>

          <div className="mt-8 space-y-4 border-t pt-6">
            <h3 className="font-bold text-slate-700">Solusi Perbaikan:</h3>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>
                <strong>Jika Role masih 'user':</strong> Jalankan SQL update di Supabase.
              </li>
              <li>
                <strong>Jika Profile Found = NO:</strong> Masalah RLS Policy. Jalankan SQL Policy di bawah.
              </li>
            </ul>
            <div className="flex gap-4 mt-4">
               <Link href="/dashboard">
                <Button variant="outline">Kembali ke Dashboard User</Button>
               </Link>
               <form action={async () => {
                  "use server";
                  const supabase = await createClient();
                  await supabase.auth.signOut();
               }}>
                  <Button variant="destructive">Logout</Button>
               </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // JIKA ADMIN: TAMPILKAN LAYOUT NORMAL
  const signOut = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
  };

  const navItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Manajemen Layanan', href: '/admin/services', icon: Layers },
    { label: 'Daftar Pesanan', href: '/admin/services/orders', icon: FileText },
    { label: 'Database Klien', href: '/admin/clients', icon: Users },
    { label: 'Pengaturan CRM', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex transition-colors duration-500">
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

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50 dark:bg-slate-950">
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-40 transition-colors duration-500">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Live Pulse</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2" />
            <Button variant="outline" size="icon" className="rounded-full relative border-2 border-slate-100 dark:border-slate-800 bg-transparent">
              <BellRing className="h-4 w-4 text-slate-600 dark:text-slate-400" />
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