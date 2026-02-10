//(user)/dashboard/applications/page.tsx

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  FileText, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function UserApplicationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Ambil data pengajuan milik user yang login
  const { data: applications, error } = await supabase
    .from('applications')
    .select(`
      id,
      created_at,
      status,
      quoted_price,
      services (name)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Helper untuk gaya visual status
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending': 
        return { label: 'Menunggu', icon: Clock, class: 'bg-orange-100 text-orange-700 border-orange-200' };
      case 'quoted': 
        return { label: 'Penawaran', icon: AlertCircle, class: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'process': 
        return { label: 'Proses', icon: FileText, class: 'bg-purple-100 text-purple-700 border-purple-200' };
      case 'completed': 
        return { label: 'Selesai', icon: CheckCircle2, class: 'bg-green-100 text-green-700 border-green-200' };
      default: 
        return { label: status, icon: Clock, class: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary">Pengajuan Saya</h1>
          <p className="text-muted-foreground font-medium">Pantau status dan riwayat legalitas Anda di sini.</p>
        </div>
        <Link href="/dashboard/applications/new">
          <Button className="h-12 px-6 rounded-2xl shadow-xl font-black bg-primary flex items-center gap-2 hover:scale-105 transition-all">
            <Plus className="h-5 w-5" />
            Pengajuan Baru
          </Button>
        </Link>
      </div>

      {/* Daftar Pengajuan */}
      <div className="grid gap-4">
        {applications && applications.length > 0 ? (
          applications.map((app: any) => {
            const statusCfg = getStatusConfig(app.status);
            return (
              <Link key={app.id} href={`/dashboard/applications/${app.id}`}>
                <Card className="group hover:border-primary/50 transition-all duration-300 border-slate-200 shadow-sm hover:shadow-md rounded-3xl overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-primary/5 rounded-2xl text-primary">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-lg font-black leading-none">{app.services?.name}</h3>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                            ID: {app.id.slice(0, 8)}... • {new Date(app.created_at).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 md:gap-8">
                        {/* Harga - Muncul jika sudah di-Quoted */}
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Total Biaya</p>
                          <p className="font-black text-primary">
                            {app.quoted_price ? `Rp ${app.quoted_price.toLocaleString('id-ID')}` : '-'}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <Badge variant="outline" className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest border-2 ${statusCfg.class}`}>
                          <statusCfg.icon className="mr-1.5 h-3 w-3" />
                          {statusCfg.label}
                        </Badge>

                        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        ) : (
          <div className="py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-bold">Belum ada riwayat pengajuan.</p>
            <Link href="/dashboard/applications/new">
              <Button variant="link" className="text-primary font-bold">Klik di sini untuk mulai</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}