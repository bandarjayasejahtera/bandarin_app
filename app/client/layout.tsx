// app/client/layout.tsx
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
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { Suspense } from "react";

export default async function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) redirect("/login");

  // Ambil profil untuk pengaturan UI (Handedness)
  const { data: profile } = await supabase
    .from('profiles')
    .select('handedness, full_name')
    .eq('id', user.id)
    .single();

  const isLeftHanded = profile?.handedness === 'left';

  const signOut = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <GreetingPopup />
      
      <header className={`sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-6 h-16 flex items-center justify-between ${isLeftHanded ? "flex-row-reverse" : "flex-row"}`}>
        
        {/* Brand Logo */}
        <div className={`flex items-center gap-6 ${isLeftHanded ? "flex-row-reverse" : "flex-row"}`}>
          <Link href="/client" className="flex items-center gap-2 font-bold text-xl text-primary group">
            <div className="p-1.5 bg-primary/10 rounded-lg group-hover:bg-primary transition-all duration-300">
              <ShieldCheck className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
            </div>
            <span className="tracking-tight hidden sm:block">Bandarin</span>
          </Link>
        </div>

        {/* Action Menu */}
        <div className={`flex items-center gap-2 sm:gap-4 ${isLeftHanded ? "flex-row-reverse" : "flex-row"}`}>
          <ThemeToggle />
          
          {/* Real-time Notification dengan Suspense */}
          <Suspense fallback={<div className="h-8 w-8 animate-pulse bg-muted rounded-full" />}>
            <NotificationBell userId={user.id} />
          </Suspense>

          <div className="h-8 w-px bg-border mx-1 hidden sm:block"></div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-1 rounded-full ring-2 ring-primary/10 hover:ring-primary/40 h-9 w-9">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground font-black text-[10px]">
                    {profile?.full_name?.substring(0, 2).toUpperCase() || user.email?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent 
              align={isLeftHanded ? "start" : "end"} 
              className="w-64 mt-2 p-2 shadow-2xl"
            >
              <div className={`px-3 py-3 mb-1 ${isLeftHanded ? "text-right" : "text-left"}`}>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Akun Anda</p>
                <p className="text-sm font-bold truncate leading-none">{user.email}</p>
              </div>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem asChild>
                <Link href="/client" className={`flex items-center gap-3 cursor-pointer ${isLeftHanded ? "flex-row-reverse" : ""}`}>
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="font-semibold text-sm">Dashboard Utama</span>
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link href="/client/applications" className={`flex items-center gap-3 cursor-pointer ${isLeftHanded ? "flex-row-reverse" : ""}`}>
                  <FileText className="h-4 w-4" />
                  <span className="font-semibold text-sm">Riwayat Layanan</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/client/profile" className={`flex items-center gap-3 cursor-pointer ${isLeftHanded ? "flex-row-reverse" : ""}`}>
                  <Settings className="h-4 w-4" />
                  <span className="font-semibold text-sm">Pengaturan</span>
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <form action={signOut} className="w-full">
                <button type="submit" className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 rounded-md transition-colors ${isLeftHanded ? "flex-row-reverse" : ""}`}>
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