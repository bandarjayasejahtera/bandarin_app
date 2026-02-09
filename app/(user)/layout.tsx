// app/(user)/layout.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  LogOut,
  ShieldCheck,
  Bell,
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
import { GreetingPopup } from "@/components/ui/greeting-popup"; // Impor komponen Greeting

export default async function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient(); //
  const { data: { user } } = await supabase.auth.getUser(); //

  if (!user) redirect("/login"); //

  const signOut = async () => {
    "use server";
    const supabase = await createClient(); //
    await supabase.auth.signOut(); //
    redirect("/login"); //
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Komponen Greeting Popup yang mengambil data acak dari Supabase */}
      <GreetingPopup />
      
      {/* Header Standar Modern (Tanpa logika Kidal/Kanan) */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary group">
            <div className="p-1.5 bg-primary/10 rounded-lg group-hover:bg-primary transition-colors duration-300">
              <ShieldCheck className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
            </div>
            <span className="tracking-tight">Bandarin</span>
          </Link>
        </div>

        {/* Menu Aksi */}
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          
          <Button variant="ghost" size="icon" className="relative hover:bg-accent rounded-full h-9 w-9">
            <Bell className="h-5 w-5" />
            {/* Indikator Notifikasi */}
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-tuscan-sun-500 rounded-full border-2 border-card"></span>
          </Button>

          <div className="h-8 w-px bg-border mx-1 hidden sm:block"></div>

          {/* Menu Profil */}
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
              align="end"
              className="w-64 mt-2 p-2 shadow-2xl border-border bg-card animate-in slide-in-from-top-2"
            >
              <div className="px-3 py-3 mb-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Informasi Akun</p>
                <p className="text-sm font-bold truncate leading-none">{user.email}</p>
              </div>
              
              <DropdownMenuSeparator className="bg-border" />
              
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="flex items-center gap-3 cursor-pointer py-2.5 px-3 rounded-md hover:bg-accent group">
                  <LayoutDashboard className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-sm">Dashboard Saya</span>
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link href="/dashboard/orders" className="flex items-center gap-3 cursor-pointer py-2.5 px-3 rounded-md hover:bg-accent group">
                  <FileText className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-sm">Pengajuan Saya</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="flex items-center gap-3 cursor-pointer py-2.5 px-3 rounded-md hover:bg-accent group">
                  <Settings className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-sm">Pengaturan Profil</span>
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-border" />
              
              <form action={signOut} className="w-full">
                <button type="submit" className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-destructive font-bold hover:bg-destructive/10 rounded-md transition-colors">
                  <LogOut className="h-4 w-4" />
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