import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Calendar, User, Mail, Briefcase } from "lucide-react";
import { OrderDetailClient } from "./order-detail-client";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Ambil detail aplikasi lengkap
  const { data: order } = await supabase
    .from("applications")
    .select(`
      *,
      profiles (full_name, email, phone),
      services (name, description)
    `)
    .eq("id", id)
    .single();

  if (!order) notFound();

  // 2. Ambil daftar staff/agen (profil dengan role 'admin' atau 'agent') 
  // untuk pilihan penugasan
  const { data: agents } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["admin", "agent"]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/orders" 
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ChevronLeft className="h-6 w-6 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Kelola Pengajuan: {order.services?.name}
          </h1>
          <p className="text-slate-500 text-sm">ID: {order.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri: Detail Pengguna & Form Data (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <OrderDetailClient order={order} agents={agents || []} />
        </div>

        {/* Kolom Kanan: Ringkasan & Kontak (1/3) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 border-b pb-2">Informasi Klien</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium">{order.profiles?.full_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-600">{order.profiles?.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-600">Diajukan: {new Date(order.created_at).toLocaleDateString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}