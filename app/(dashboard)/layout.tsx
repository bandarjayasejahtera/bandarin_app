import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  LogOut, 
  ShieldCheck,
  User,
  Bell,
  Menu
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const signOut = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  };

  // Komponen Sidebar Navigation
  const SidebarNav = ({ mobile = false }) => (
    <div className="flex h-full flex-col gap-2">
      <div className={`flex h-16 items-center border-b ${mobile ? 'px-0' : 'px-6'}`}>
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-deep-space-blue-950">
          <div className="h-8 w-8 bg-tuscan-sun-500 rounded-lg flex items-center justify-center shadow-sm">
            <ShieldCheck className="text-white h-5 w-5" />
          </div>
          <span className="bg-gradient-to-r from-deep-space-blue-900 to-deep-space-blue-700 bg-clip-text text-transparent">
            Bandarin
          </span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-4 text-sm font-medium">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg bg-deep-space-blue-50 px-3 py-2.5 text-deep-space-blue-900 transition-all hover:bg-deep-space-blue-100"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/dashboard/orders"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-cool-steel-600 transition-all hover:text-deep-space-blue-900 hover:bg-cool-steel-100"
          >
            <FileText className="h-4 w-4" />
            Pesanan Saya
          </Link>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-cool-steel-600 transition-all hover:text-deep-space-blue-900 hover:bg-cool-steel-100"
          >
            <Settings className="h-4 w-4" />
            Pengaturan
          </Link>
        </nav>
      </div>
      <div className="p-4 border-t bg-cool-steel-50/50">
        <form action={signOut}>
          <Button variant="ghost" className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
            <LogOut className="h-4 w-4" />
            Keluar Aplikasi
          </Button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-cool-steel-50/30 w-full">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden w-64 border-r bg-white shadow-sm lg:block fixed inset-y-0 z-50">
        <SidebarNav />
      </aside>

      {/* MOBILE CONTENT & HEADER */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* HEADER */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-white/80 px-6 backdrop-blur-md shadow-sm">
          
          {/* Mobile Menu Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden shrink-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4">
              <SidebarNav mobile />
            </SheetContent>
          </Sheet>

          <div className="w-full flex-1">
            <h1 className="text-sm font-medium text-cool-steel-500 hidden md:block">
              Selamat datang kembali, <span className="text-deep-space-blue-700 font-semibold">{user.email?.split('@')[0]}</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-cool-steel-500">
              <Bell className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full ring-2 ring-white shadow-sm">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-tuscan-sun-100 text-tuscan-sun-700 font-bold">
                      {user.email?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profil</DropdownMenuItem>
                <DropdownMenuItem>Langganan</DropdownMenuItem>
                <DropdownMenuSeparator />
                <form action={signOut} className="w-full">
                  <button className="w-full text-left px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-sm">
                    Keluar
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}