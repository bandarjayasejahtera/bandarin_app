import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  LogOut,
  ShieldCheck,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { GreetingPopup } from "@/components/ui/greeting-popup";

// IMPORT KOMPONEN NOTIFIKASI BARU
import { NotificationBell } from "@/components/dashboard/notification-bell";

export default async function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // AMBIL DATA PROFIL UNTUK FITUR HANDEDNESS
  const { data: profile } = await supabase
    .from('profiles')
    .select('handedness')
    .eq('id', user.id)
    .single();

  const isLeftHanded = profile?.handedness === 'left';

  const signOut = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <GreetingPopup />
      
      {/* HEADER DENGAN LOGIKA KIDAL/KANAN */}
      <header className={`sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-6 h-16 flex items-center justify-between ${isLeftHanded ? "flex-row-reverse" : "flex-row"}`}>
        
        {/* BRAND LOGO */}
        <div className={`flex items-center gap-6 ${isLeftHanded ? "flex-row-reverse" : "flex-row"}`}>
          <Link href="/dashboard" className={`flex items-center gap-2 font-bold text-xl text-primary group ${isLeftHanded ? "flex-row-reverse" : "flex-row"}`}>
            <div className="p-1.5 bg-primary/10 rounded-lg group-hover:bg-primary transition-colors duration-300">
              <ShieldCheck className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
            </div>
            <span className="tracking-tight">Bandarin</span>
          </Link>
        </div>

        {/* MENU AKSI */}
        <div className={`flex items-center gap-2 sm:gap-4 ${isLeftHanded ? "flex-row-reverse" : "flex-row"}`}>
          <ThemeToggle />
          
          {/* INTEGRASI LONCENG NOTIFIKASI REAL-TIME */}
          <NotificationBell userId={user.id} />

          <div className="h-8 w-px bg-border mx-1 hidden sm:block"></div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-1 rounded-full ring-2 ring-primary/10 hover:ring-primary/40 h-9 w-9">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground font-black text-[10px]">
                    {user.email?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent 
              align={isLeftHanded ? "start" : "end"} 
              className="w-64 mt-2 p-2 shadow-2xl border-border bg-card"
            >
              <div className={`px-3 py-3 mb-1 ${isLeftHanded ? "text-right" : "text-left"}`}>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Informasi Akun</p>
                <p className="text-sm font-bold truncate leading-none">{user.email}</p>
                <p className="text-[9px] text-primary font-bold mt-2 uppercase tracking-tighter">
                  Mode: {isLeftHanded ? "Kidal (Left)" : "Kanan (Right)"}
                </p>
              </div>
              
              <DropdownMenuSeparator className="bg-border" />
              
              {/* ITEM: DASHBOARD SAYA */}
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className={`flex items-center gap-3 cursor-pointer py-2.5 px-3 rounded-md hover:bg-accent group ${isLeftHanded ? "flex-row-reverse text-right" : ""}`}>
                  <LayoutDashboard className="h-5 w-5 text-slate-600 group-hover:text-primary transition-colors" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">Dashboard Utama</span>
                </Link>
              </DropdownMenuItem>
              
              {/* ITEM: PENGAJUAN SAYA (Update ke /applications) */}
              <DropdownMenuItem asChild>
                <Link href="/dashboard/applications" className={`flex items-center gap-3 cursor-pointer py-2.5 px-3 rounded-md hover:bg-accent group ${isLeftHanded ? "flex-row-reverse text-right" : ""}`}>
                  <FileText className="h-5 w-5 text-slate-600 group-hover:text-primary transition-colors" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">Riwayat Pengajuan</span>
                </Link>
              </DropdownMenuItem>

              {/* ITEM: PENGATURAN PROFIL */}
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className={`flex items-center gap-3 cursor-pointer py-2.5 px-3 rounded-md hover:bg-accent group ${isLeftHanded ? "flex-row-reverse text-right" : ""}`}>
                  <Settings className="h-5 w-5 text-slate-600 group-hover:text-primary transition-colors" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">Pengaturan Profil</span>
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-border" />
              
              {/* ITEM: KELUAR */}
              <form action={signOut} className="w-full">
                <button type="submit" className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 font-bold hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors ${isLeftHanded ? "flex-row-reverse text-right" : ""}`}>
                  <LogOut className="h-5 w-5 text-slate-600 group-hover:text-destructive" />
                  <span>Keluar</span>
                </button>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}