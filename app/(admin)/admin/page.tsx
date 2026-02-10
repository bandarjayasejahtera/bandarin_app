export const dynamic = "force-dynamic";

import { createClient } from "@/utils/supabase/server";
import { 
  Users, 
  TrendingUp, 
  Clock, 
  ArrowUpRight, 
  Activity,
  BarChart3,
  Rocket
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // 1. Sinkronisasi Data Real-time (Mencegah malfungsi data tidak muncul)
  const { data: apps } = await supabase
    .from('applications')
    .select('*, services(name), profiles(full_name, email)')
    .order('created_at', { ascending: false });

  // 2. Kalkulasi Business Intelligence (BI)
  const totalRevenue = apps?.filter(a => ['process', 'completed', 'quoted'].includes(a.status))
                         .reduce((acc, curr) => acc + (Number(curr.quoted_price) || 0), 0) || 0;
  
  const pendingReview = apps?.filter(a => a.status === 'pending').length || 0;
  const activeProjects = apps?.filter(a => a.status === 'process').length || 0;
  const conversionRate = apps?.length ? ((apps.filter(a => a.status !== 'pending').length / apps.length) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-10 pb-12 transition-all duration-500">
      
      {/* STRATEGIC HEADER - Auto Color Adaption */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
            Command Center
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Business Intelligence & Operasional Real-time.
          </p>
        </div>
        <div className="text-left md:text-right">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Waktu Sistem</p>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-200">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* METRIC CARDS (Optimal Level) - Auto Solar Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card Pipeline - Tetap Biru Signature */}
        <Card className="border-none bg-blue-600 shadow-2xl shadow-blue-500/20">
          <CardContent className="p-8 text-white relative overflow-hidden">
            <TrendingUp className="absolute right-[-20px] top-[-20px] h-32 w-32 text-white/10" />
            <p className="text-xs font-black uppercase tracking-widest text-blue-100 mb-2">Estimated Pipeline</p>
            <p className="text-3xl font-black">Rp {totalRevenue.toLocaleString('id-ID')}</p>
            <div className="mt-4 flex items-center text-[10px] font-bold bg-white/20 w-fit px-2 py-1 rounded-lg">
              <ArrowUpRight className="h-3 w-3 mr-1" /> Real-time Analytics
            </div>
          </CardContent>
        </Card>

        {/* Card Konversi - Deep Space Blue Gradient in Dark Mode */}
        <Card className="border-none bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-blue-950 shadow-xl shadow-slate-200/50 dark:shadow-none border dark:border-slate-800">
          <CardContent className="p-8">
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Konversi Layanan</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{conversionRate}%</p>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-4">
              <div className="bg-green-500 h-full rounded-full transition-all duration-1000" style={{ width: `${conversionRate}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-blue-950 shadow-xl shadow-slate-200/50 dark:shadow-none border dark:border-slate-800">
          <CardContent className="p-8">
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Perlu Review</p>
            <p className="text-3xl font-black text-orange-500">{pendingReview}</p>
            <div className="mt-4 p-2 bg-orange-500/10 rounded-lg w-fit">
               <Clock className="h-4 w-4 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-blue-950 shadow-xl shadow-slate-200/50 dark:shadow-none border dark:border-slate-800">
          <CardContent className="p-8">
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Proyek Aktif</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{activeProjects}</p>
            <div className="mt-4 p-2 bg-purple-500/10 rounded-lg w-fit">
               <Activity className="h-4 w-4 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* LIVE APPLICATION FEED - Solving Malfunction Visibility */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-black flex items-center gap-2 text-slate-900 dark:text-white">
              <Activity className="text-blue-600" /> Live Application Feed
            </h2>
            <Badge className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-none font-black px-4">
              SINKRONISASI AKTIF
            </Badge>
          </div>
          
          <div className="bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Pelanggan</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Layanan</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
                  {apps?.slice(0, 8).map((app: any) => (
                    <tr key={app.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-8 py-5">
                        <p className="text-sm font-black text-slate-900 dark:text-white">{app.profiles?.full_name || "No Name"}</p>
                        <p className="text-[10px] font-bold text-slate-400 tracking-tight">{app.profiles?.email}</p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{app.services?.name}</p>
                        <p className="text-[10px] font-medium text-slate-400">{new Date(app.created_at).toLocaleDateString('id-ID')}</p>
                      </td>
                      <td className="px-8 py-5">
                        <Badge variant="outline" className={`font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-lg border-2 ${
                          app.status === 'pending' 
                            ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/30' 
                            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30'
                        }`}>
                          {app.status}
                        </Badge>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <Link href={`/admin/orders/${app.id}`}>
                          <Button size="sm" className="bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-blue-600 dark:hover:bg-blue-400 text-white dark:font-black font-black text-[10px] rounded-xl transition-all h-9 px-4">
                            KELOLA
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {(!apps || apps.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <p className="text-slate-400 font-bold italic">Belum ada pengajuan baru yang terdeteksi.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* STRATEGIC TOOLS - Auto Theme Responsive */}
        <div className="space-y-8">
          <h2 className="text-xl font-black text-slate-900 dark:text-white px-1">Aksi Strategis</h2>
          <div className="grid gap-4">
            <Link href="/admin/services/new" className="group p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-100 dark:hover:shadow-blue-900/20 transition-all">
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Rocket size={24} />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white">Inovasi Layanan</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Ekspansi bisnis dengan membangun struktur form legalitas baru.</p>
            </Link>

            <Link href="/admin/orders" className="group p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-100 dark:hover:shadow-blue-900/20 transition-all">
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <BarChart3 size={24} />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white">Laporan Penjualan</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Analisis profitabilitas setiap kategori layanan legalitas.</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}