//app/admin/layout.tsx
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
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

// IMPORT KOMPONEN NOTIFIKASI REAL-TIME
import { NotificationBell } from "@/components/dashboard/notification-bell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  
  // 1. Validasi Sesi Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Validasi Role Admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect("/login"); 
  }

  const navItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Manajemen Layanan', href: '/admin/services', icon: Layers },
    { label: 'Daftar Pesanan', href: '/admin/services/orders', icon: FileText },
    { label: 'Database Klien', href: '/admin/clients', icon: Users },
    { label: 'Pengaturan CRM', href: '/admin/settings', icon: Settings },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 h-16 flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800/50">
        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
          <ShieldCheck className="h-4 w-4 text-white" />
        </div>
        <span className="font-black text-lg tracking-tighter text-zinc-900 dark:text-white">
          BANDARIN<span className="text-blue-600">.</span>
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Main Menu</p>
        {navItems.map((item) => (
          <Link 
            key={item.href} 
            href={item.href}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all group"
          >
            <item.icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar className="h-8 w-8 border-2 border-white dark:border-zinc-800 shadow-sm">
            <AvatarFallback className="bg-blue-100 text-blue-700 text-[10px] font-bold uppercase">
              {profile.full_name?.charAt(0) || "A"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate">{profile.full_name}</p>
            <p className="text-[9px] text-zinc-500 truncate">{user.email}</p>
          </div>
        </div>
        <form action={async () => { 
          "use server"; 
          const sb = await createClient();
          await sb.auth.signOut();
          redirect("/"); 
        }}>
          <Button variant="ghost" size="sm" className="w-full justify-start text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 rounded-lg h-9 font-bold text-xs">
            <LogOut className="h-3.5 w-3.5 mr-2" /> Keluar
          </Button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-zinc-50/50 dark:bg-zinc-950 font-sans overflow-hidden">
      <aside className="w-64 hidden lg:flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 h-full z-50">
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="h-16 w-full sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <div className="max-w-7xl mx-auto h-full px-4 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Menu className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-72 border-r-0">
                    <VisuallyHidden><SheetTitle>Menu navigasi</SheetTitle></VisuallyHidden>
                    <SidebarContent />
                  </SheetContent>
                </Sheet>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-full">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Live System</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />
              
              {/* LONCENG NOTIFIKASI REAL-TIME */}
              <NotificationBell userId={user.id} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 lg:p-8 w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}