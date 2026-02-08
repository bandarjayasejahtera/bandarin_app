import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, FileText, ArrowRight, Plus, Clock, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Cek User
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  // 2. Ambil Profile (Untuk Nama)
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // 3. Ambil Pesanan (Limit 5 terbaru)
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  const activeOrders = orders?.filter(o => o.status === 'process').length || 0;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
      
      {/* 1. SECTION GREETING & STATUS */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-xl md:text-2xl font-bold mb-1">
            Halo, {profile?.full_name || user.email?.split('@')[0]} 👋
          </h1>
          <p className="text-blue-100 text-sm mb-6">
            Ada <span className="font-bold text-yellow-400">{activeOrders} dokumen</span> sedang diproses.
          </p>
          
          <Link href="/dashboard/orders/new">
            <button className="bg-white text-blue-900 px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors shadow-md">
              <Plus className="h-4 w-4" /> Buat Pengajuan Baru
            </button>
          </Link>
        </div>
        
        {/* Dekorasi Background */}
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
           <Building2 className="w-32 h-32 text-white" />
        </div>
      </div>

      {/* 2. SECTION LAYANAN CEPAT (Grid Menu) */}
      <div>
        <h3 className="font-bold text-gray-800 mb-3 text-lg">Layanan Populer</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Pendirian PT", icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Pendirian CV", icon: FileText, color: "text-orange-600", bg: "bg-orange-50" },
            { label: "Urus NIB", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
            { label: "Lainnya", icon: ArrowRight, color: "text-gray-600", bg: "bg-gray-50" },
          ].map((item, idx) => (
            <Link href="/dashboard/orders/new" key={idx}>
              <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all cursor-pointer h-full">
                <div className={`h-10 w-10 rounded-full ${item.bg} flex items-center justify-center mb-2`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <span className="text-xs font-bold text-gray-700">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 3. SECTION RIWAYAT TERBARU (Mobile Card List) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 text-lg">Aktivitas Terakhir</h3>
          <Link href="/dashboard/orders" className="text-sm text-blue-600 font-semibold hover:underline">
            Lihat Semua
          </Link>
        </div>

        <div className="space-y-3">
          {orders && orders.length > 0 ? (
            orders.map((order) => (
              <div key={order.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 
                    ${order.status === 'process' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>
                    {order.status === 'process' ? <Clock className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{order.service_name}</h4>
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString("id-ID", {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <Badge className={`text-[10px] px-2 py-0.5 pointer-events-none ${
                    order.status === 'done' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 
                    order.status === 'process' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' : 
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {order.status === 'process' ? 'Proses' : order.status === 'done' ? 'Selesai' : 'Pending'}
                  </Badge>
                  <p className="text-xs font-bold text-gray-900 mt-1">
                    {order.amount ? `Rp${(order.amount / 1000).toFixed(0)}k` : '-'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed">
              <p className="text-gray-500 text-sm">Belum ada riwayat pesanan.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}