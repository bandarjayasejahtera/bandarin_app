// app/admin/page.tsx
export const dynamic = "force-dynamic";

import { createClient } from "@/utils/supabase/server";
import { 
  ArrowUpRight, 
  Activity,
  BarChart3,
  Rocket,
  Clock4,
  CheckCircle2,
  Briefcase,
  MoreHorizontal,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Tipe untuk Status
type ApplicationStatus = 'all' | 'pending' | 'quoted' | 'process' | 'review' | 'completed' | 'cancelled';

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: activeFilter = 'all' } = await searchParams;
  const supabase = await createClient();

  // --- 1. DATA FETCHING (TABEL) ---
  let query = supabase
    .from('applications')
    // PERBAIKAN DI SINI:
    // Kita menambahkan penunjuk FK eksplisit untuk 'profiles' juga (!applications_userid_fkey)
    // agar Supabase tahu kita ingin mengambil data 'User Pembuat', bukan 'Agent'.
    .select(`
      *, 
      services:services!applications_service_id_fkey(name), 
      profiles:profiles!applications_userid_fkey(full_name, email)
    `)
    .order('created_at', { ascending: false });

  if (activeFilter !== 'all') {
    query = query.eq('status', activeFilter);
  }

  const { data: rawData, error: tableError } = await query;
  
  if (tableError) {
    console.error("Error fetching table data:", JSON.stringify(tableError, null, 2));
  }

  // Fallback ke array kosong jika data null
  const filteredApps = rawData || [];

  // --- 2. DATA FETCHING (METRIK) ---
  const { data: metricsData, error: metricsError } = await supabase
    .from('applications')
    .select('status, quoted_price');

  if (metricsError) {
    console.error("Error fetching metrics:", JSON.stringify(metricsError, null, 2));
  }

  const allApps = metricsData || [];

  // --- 3. CALCULATIONS ---
  const totalRevenue = allApps
    .filter(a => ['process', 'completed', 'quoted'].includes(a.status))
    .reduce((acc, curr) => acc + (Number(curr.quoted_price) || 0), 0);

  const pendingReview = allApps.filter(a => a.status === 'pending').length;
  const activeProjects = allApps.filter(a => a.status === 'process' || a.status === 'quoted').length;
  const completedCount = allApps.filter(a => a.status === 'completed').length;

  // --- 4. CONSTANTS & UI HELPERS ---
  const statusTabs: { label: string; value: ApplicationStatus }[] = [
    { label: 'Semua Order', value: 'all' },
    { label: 'Menunggu Review', value: 'pending' },
    { label: 'Dalam Proses', value: 'process' },
    { label: 'Selesai', value: 'completed' },
  ];

  const statusStyles: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
    process: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    completed: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    quoted: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
    cancelled: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    review: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-slate-500 dark:text-slate-400">Ringkasan performa bisnis dan operasional hari ini.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg shadow-sm">
            <Clock4 className="h-4 w-4" />
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* --- METRICS CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Main Revenue Card */}
        <Card className="bg-slate-900 dark:bg-blue-950 border-slate-800 shadow-md text-white col-span-1 md:col-span-2 lg:col-span-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <BarChart3 className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300 tracking-wide uppercase">Total Pipeline Estimasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Rp {totalRevenue.toLocaleString('id-ID')}</div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-green-400" /> <span className="text-green-400 font-medium">+4.5%</span> dari bulan lalu
            </p>
          </CardContent>
        </Card>

        {/* Operational Cards */}
        <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Perlu Review</CardTitle>
            <div className="h-8 w-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-400">
              <AlertCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{pendingReview}</div>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Pengajuan baru masuk.</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Proyek Aktif</CardTitle>
            <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Briefcase className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{activeProjects}</div>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Sedang dalam pengerjaan.</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Selesai Bulan Ini</CardTitle>
            <div className="h-8 w-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{completedCount}</div>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Layanan berhasil diserahkan.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* --- MAIN TABLE SECTION --- */}
        <div className="xl:col-span-2 space-y-4">
           {/* Tabs Filter */}
          <div className="flex items-center justify-between">
             <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" /> Aktivitas Terbaru
             </h2>
             <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 overflow-x-auto">
              {statusTabs.map((tab) => (
                <Link
                  key={tab.value}
                  href={`/admin?status=${tab.value}`}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    activeFilter === tab.value 
                      ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white" 
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Tabel Modern */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Klien</th>
                    <th className="px-6 py-4 font-semibold">Layanan & Tanggal</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredApps.length > 0 ? (
                    filteredApps.slice(0, 8).map((app: any) => (
                      <tr key={app.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                                {app.profiles?.full_name?.charAt(0) || "U"}
                            </div>
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white truncate max-w-[150px] uppercase">
                                  {app.profiles?.full_name || "Klien Umum"}
                                </p>
                                <p className="text-xs text-slate-500 truncate max-w-[150px]">{app.profiles?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-700 dark:text-slate-300">{app.services?.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {new Date(app.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year:'2-digit' })}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={`rounded-full px-3 py-0.5 text-[10px] uppercase tracking-wider font-bold ${statusStyles[app.status as keyof typeof statusStyles] || ""}`}>
                            {app.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                                <MoreHorizontal className="h-4 w-4 text-slate-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl shadow-lg border-slate-200 dark:border-slate-800 font-medium">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/services/orders/${app.id}`} className="cursor-pointer flex items-center gap-2 text-xs">
                                    <ArrowUpRight className="h-3.5 w-3.5" /> Buka Detail
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                        {tableError ? (
                          <span className="text-red-500">Gagal memuat data. Cek console log.</span>
                        ) : (
                          "Tidak ada data ditemukan untuk filter ini."
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredApps.length > 8 && (
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center">
                    <Link href="/admin/services/orders">
                        <Button variant="link" className="text-blue-600 dark:text-blue-400 text-sm">Lihat Semua Pesanan</Button>
                    </Link>
                </div>
            )}
          </Card>
        </div>

        {/* --- SIDEBAR WIDGETS --- */}
        <div className="space-y-6">
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-slate-900 overflow-hidden relative">
                 <div className="absolute top-0 right-0 -mt-4 -mr-4 text-blue-100 dark:text-blue-900/20 opacity-50">
                    <Rocket size={80} />
                 </div>
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Aksi Cepat</CardTitle>
                    <p className="text-sm text-slate-500">Pintasan untuk tugas admin.</p>
                </CardHeader>
                <CardContent className="grid gap-3 relative z-10">
                    <Link href="/admin/services/new">
                        <Button variant="outline" className="w-full justify-start gap-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 h-auto py-3 rounded-xl shadow-sm font-semibold text-slate-700 dark:text-slate-200">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                                <Rocket size={18} />
                            </div>
                            Buat Layanan Baru
                        </Button>
                    </Link>
                     <Button variant="outline" className="w-full justify-start gap-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 h-auto py-3 rounded-xl shadow-sm font-semibold text-slate-700 dark:text-slate-200">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
                            <Briefcase size={18} />
                        </div>
                        Database Klien
                    </Button>
                </CardContent>
            </Card>
             
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold flex items-center justify-between">
                        Status Sistem
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Normal
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm text-slate-500">
                        <div className="flex justify-between">
                            <span>Database Latency</span>
                            <span className="font-medium text-slate-900 dark:text-white">24ms</span>
                        </div>
                         <div className="flex justify-between">
                            <span>API Gateway</span>
                            <span className="font-medium text-slate-900 dark:text-white">Online</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}