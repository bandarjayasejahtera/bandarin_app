//(admin)/layout.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  FileText,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // TODO: Fetch role from profiles or auth metadata
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  if (!isAdmin) redirect("/dashboard"); // Bukan admin -> ke user dashboard

  const signOut = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden lg:flex w-64 flex-col border-r bg-white">
        <div className="h-16 flex items-center px-6 border-b">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-xl text-slate-900">
            <ShieldCheck className="h-8 w-8 text-blue-600" />
            Admin
          </Link>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-1">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
          >
            <LayoutDashboard className="h-5 w-5" /> Dashboard
          </Link>
          <Link
            href="/admin/products"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
          >
            <Package className="h-5 w-5" /> Produk
          </Link>
          <Link
            href="/admin/orders"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
          >
            <FileText className="h-5 w-5" /> Semua Pesanan
          </Link>
        </nav>
        <div className="p-4 border-t">
          <form action={signOut}>
            <Button variant="ghost" className="w-full justify-start text-red-600">
              <LogOut className="h-4 w-4 mr-2" /> Keluar
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 lg:pl-64">
        <div className="border-b bg-white px-6 h-16 flex items-center">
          <span className="text-sm text-slate-500">Admin Panel</span>
        </div>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}