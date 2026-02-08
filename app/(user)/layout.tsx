//(user)/layout.tsx

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Home,
  FileText,
  MessageSquare,
  User,
  LogOut,
  ShieldCheck,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

export default async function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const signOut = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  };

  const DesktopSidebar = () => (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-white h-screen fixed left-0 top-0 z-50">
      <div className="h-16 flex items-center px-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-blue-900">
          <ShieldCheck className="h-8 w-8 rounded-lg bg-blue-900 text-white flex items-center justify-center" />
          Bandarin
        </Link>
      </div>
      <div className="flex-1 py-6 px-4 space-y-1">
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-50 text-blue-900 font-medium">
          <Home className="h-5 w-5" /> Dashboard
        </Link>
        <Link href="/dashboard/orders" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
          <FileText className="h-5 w-5" /> Pesanan Saya
        </Link>
        <Link href="/dashboard/chat" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
          <MessageSquare className="h-5 w-5" /> Konsultasi
        </Link>
        <Link href="/dashboard/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
          <User className="h-5 w-5" /> Akun
        </Link>
      </div>
      <div className="p-4 border-t">
        <form action={signOut}>
          <button className="flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg w-full font-medium">
            <LogOut className="h-5 w-5" /> Keluar
          </button>
        </form>
      </div>
    </aside>
  );

  const MobileBottomNav = () => (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t h-16 flex items-center justify-around z-50">
      <Link href="/dashboard" className="flex flex-col items-center gap-1 text-blue-900">
        <Home className="h-6 w-6" /><span className="text-[10px] font-medium">Home</span>
      </Link>
      <Link href="/dashboard/orders" className="flex flex-col items-center gap-1 text-gray-400">
        <FileText className="h-6 w-6" /><span className="text-[10px] font-medium">Pesanan</span>
      </Link>
      <Link href="/dashboard/chat" className="flex flex-col items-center gap-1 text-gray-400">
        <MessageSquare className="h-6 w-6" /><span className="text-[10px] font-medium">Chat</span>
      </Link>
      <Link href="/dashboard/profile" className="flex flex-col items-center gap-1 text-gray-400">
        <User className="h-6 w-6" /><span className="text-[10px] font-medium">Akun</span>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <DesktopSidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen pb-20 lg:pb-0">
        <header className="sticky top-0 z-40 h-16 bg-white/80 backdrop-blur-md border-b px-6 flex items-center justify-between">
          <div className="lg:hidden flex items-center gap-2 font-bold text-lg text-blue-900">
            <ShieldCheck className="h-6 w-6" /> Bandarin
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Button variant="ghost" size="icon"><Bell className="h-5 w-5" /></Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-orange-100 text-orange-700 font-bold">
                      {user.email?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Pengaturan</DropdownMenuItem>
                <DropdownMenuSeparator />
                <form action={signOut}>
                  <button type="submit" className="w-full text-left px-2 py-1.5 text-sm text-red-600">Keluar</button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}