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
  AlertCircle,
  Plus,
  Users,
  Database
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
type ApplicationStatus = 'all' | 'pending' | 'quoted' | 'process' | 'review' | 'completed' | 'cancelled';

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  // 1. Await params sesuai standar Next.js 15/16
  const params = await searchParams;
  const activeFilter = params.status || 'all';
  const supabase = await createClient();

  // --- 2. DATA FETCHING ---
  const { data: rawData, error: tableError } = await supabase
    .from('applications')
    .select(`
      *, 
      services:services!applications_service_id_fkey(name), 
      profiles:profiles!applications_userid_fkey(full_name, email)
    `)
    .order('created_at', { ascending: false });

  if (tableError) console.error("Error:", tableError);

  const allApps = rawData || [];
  const filteredApps = activeFilter === 'all' 
    ? allApps 
    : allApps.filter(a => a.status === activeFilter);

  // --- 3. CALCULATIONS ---
  const totalRevenue = allApps
    .filter(a => ['process', 'completed', 'quoted'].includes(a.status))
    .reduce((acc, curr) => acc + (Number(curr.quoted_price) || 0), 0);

  const pendingReview = allApps.filter(a => a.status === 'pending').length;
  const activeProjects = allApps.filter(a => ['process', 'quoted'].includes(a.status)).length;
  const completedCount = allApps.filter(a => a.status === 'completed').length;

  const statusStyles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
    process: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
    quoted: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400",
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Ringkasan operasional bisnis hari ini.</p>
        </div>
        <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-zinc-500 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-2 rounded-xl shadow-sm">
                <Clock4 className="h-3.5 w-3.5 text-blue-600" />
                {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-0 shadow-xl text-white sm:col-span-2 lg:col-span-1 relative overflow-hidden group">
          <BarChart3 className="absolute -right-4 -bottom-4 h-24 w-24 opacity-10 group-hover:scale-110 transition-transform duration-500" />
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Estimasi Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl lg:text-3xl font-bold font-mono">Rp {totalRevenue.toLocaleString('id-ID')}</div>
            <div className="text-[10px] text-emerald-400 mt-2 flex items-center font-bold">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +4.5% BULAN INI
            </div>
          </CardContent>
        </Card>

        {/* Mini Cards */}
        {[
          { label: 'Perlu Review', val: pendingReview, icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Proyek Aktif', val: activeProjects, icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Selesai', val: completedCount, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
        ].map((stat, i) => (
          <Card key={i} className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900/50">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.val}</p>
              </div>
              <div className={`h-10 w-10 ${stat.bg} rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CONTENT GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <h2 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" /> Transaksi Terbaru
             </h2>
             <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl overflow-x-auto no-scrollbar">
              {['all', 'pending', 'process', 'completed'].map((tab) => (
                <Link
                  key={tab}
                  href={`/admin?status=${tab}`}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap capitalize ${
                    activeFilter === tab 
                      ? "bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400" 
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  {tab === 'all' ? 'Semua' : tab}
                </Link>
              ))}
            </div>
          </div>

          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-zinc-400 uppercase tracking-widest bg-zinc-50/50 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-zinc-800">
                  <tr>
                    <th className="px-6 py-4 font-bold">Klien & Layanan</th>
                    <th className="hidden md:table-cell px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 text-right font-bold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredApps.length > 0 ? (
                    filteredApps.slice(0, 8).map((app: any) => (
                      <tr key={app.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                                {app.profiles?.full_name?.charAt(0) || "U"}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[140px] sm:max-w-[200px]">
                                  {app.profiles?.full_name || "Klien Umum"}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-zinc-400 font-medium truncate">{app.services?.name}</span>
                                  <Badge variant="outline" className={`md:hidden text-[8px] h-4 px-1 ${statusStyles[app.status as keyof typeof statusStyles]}`}>
                                     {app.status}
                                  </Badge>
                                </div>
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-6 py-4">
                          <Badge variant="outline" className={`rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusStyles[app.status as keyof typeof statusStyles] || ""}`}>
                            {app.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="secondary" size="sm" className="rounded-lg font-semibold text-xs" asChild>
                            <Link href={`/admin/services/orders/${app.id}`}>Lihat Detail</Link>
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-16 text-center text-zinc-500 text-xs font-medium">Belum ada pesanan terdaftar.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* QUICK ACTIONS SIDEBAR */}
        <div className="space-y-6">
            <Card className="border-0 bg-blue-600 dark:bg-blue-700 shadow-xl shadow-blue-500/10 text-white overflow-hidden relative">
                <Rocket className="absolute -right-4 -bottom-4 h-32 w-32 opacity-10 rotate-12" />
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Aksi Cepat</CardTitle>
                    <p className="text-blue-100 text-xs opacity-80 font-medium">Kelola operasional dengan sekali klik.</p>
                </CardHeader>
                <CardContent className="grid gap-3 relative z-10">
                    <Link href="/admin/services/new">
                        <Button className="w-full justify-start gap-3 bg-white hover:bg-zinc-50 text-blue-600 border-0 h-11 rounded-xl shadow-sm font-bold">
                            <Plus size={18} /> Layanan Baru
                        </Button>
                    </Link>
                    <Link href="/admin/profiles">
                        <Button variant="secondary" className="w-full justify-start gap-3 bg-blue-500/30 hover:bg-blue-500/40 text-white border-0 h-11 rounded-xl font-bold">
                            <Database size={18} /> Kelola Profil & Role
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}