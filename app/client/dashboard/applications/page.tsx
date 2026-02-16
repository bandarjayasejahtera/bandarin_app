export const dynamic = "force-dynamic";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  FileText, 
  ArrowRight, 
  Clock, 
  MessageCircle, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Activity
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/applicationSchema/utils";

// Fungsi pembantu untuk gaya status (Konsisten dengan Admin)
const getStatusStyles = (status: string) => {
  switch (status) {
    case 'pending': 
      return "bg-yellow-50 text-yellow-700 border-yellow-200 ring-yellow-500/10";
    case 'quoted': 
      return "bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/10";
    case 'process': 
      return "bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/10";
    case 'review': 
      return "bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/10";
    case 'completed': 
      return "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10";
    case 'cancelled': 
      return "bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10";
    default: 
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return "Menunggu Review";
    case 'quoted': return "Penawaran Harga";
    case 'process': return "Sedang Diproses";
    case 'review': return "Review Dokumen";
    case 'completed': return "Selesai";
    case 'cancelled': return "Dibatalkan";
    default: return status;
  }
};

export default async function ApplicationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id, 
      status, 
      created_at, 
      services!applications_service_id_fkey (name),
      application_messages (id, is_read, user_id)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-6 animate-in fade-in duration-700">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 px-3 py-1 font-bold tracking-wider uppercase text-[10px]">
            Portal Pelanggan
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            RIWAYAT <span className="text-blue-600">PENGAJUAN</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg max-w-xl">
            Semua proses legalitas Anda tercatat di sini. Klik pada kartu untuk melihat detail dan berdiskusi.
          </p>
        </div>
        
        <Link href="/dashboard/applications/new">
          <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-6 h-14 font-bold shadow-xl shadow-slate-200 dark:shadow-none transition-all active:scale-95 gap-2">
            <Plus className="h-5 w-5" />
            PENGAJUAN BARU
          </Button>
        </Link>
      </div>

      {/* --- LIST PENGAJUAN --- */}
      <div className="grid gap-6">
        {applications && applications.length > 0 ? (
          applications.map((app: any) => {
            // Cek jika ada pesan baru dari admin
            const unreadMessages = app.application_messages?.filter(
              (m: any) => !m.is_read && m.user_id !== user.id
            ).length;

            return (
              <Link key={app.id} href={`/dashboard/applications/${app.id}`}>
                <Card className={cn(
                  "group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl hover:border-blue-200",
                  unreadMessages > 0 
                    ? "border-blue-500 bg-blue-50/30 shadow-blue-100" 
                    : "border-slate-100 bg-white shadow-sm"
                )}>
                  {/* Dekorasi Aksen Warna Status */}
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1.5",
                    app.status === 'completed' ? "bg-emerald-500" : 
                    app.status === 'process' ? "bg-blue-500" : 
                    app.status === 'pending' ? "bg-yellow-500" : "bg-slate-300"
                  )} />

                  <CardContent className="p-0">
                    <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                        {/* Icon Container */}
                        <div className={cn(
                          "h-16 w-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300",
                          unreadMessages > 0 ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-slate-100 text-slate-400"
                        )}>
                          <FileText className="h-8 w-8" />
                        </div>

                        <div className="space-y-2">
                          <h3 className="font-black text-xl md:text-2xl text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                            {app.services?.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4">
                            <Badge variant="outline" className={cn(
                              "font-black text-[10px] uppercase px-3 py-1 border-2 tracking-widest ring-1",
                              getStatusStyles(app.status)
                            )}>
                              {getStatusLabel(app.status)}
                            </Badge>
                            
                            <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[11px] uppercase">
                              <Clock className="h-3.5 w-3.5" />
                              {format(new Date(app.created_at), "dd MMM yyyy", { locale: idLocale })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Info & Action Section */}
                      <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0">
                        {unreadMessages > 0 && (
                          <div className="flex items-center gap-2 bg-rose-100 text-rose-600 px-4 py-2 rounded-full animate-bounce">
                            <MessageCircle className="h-4 w-4 fill-rose-600" />
                            <span className="text-[11px] font-black">{unreadMessages} PESAN BARU</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3 text-slate-300 group-hover:text-blue-600 transition-all font-black text-xs uppercase tracking-widest">
                          Lihat Detail
                          <div className="h-10 w-10 rounded-full border-2 border-slate-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all">
                            <ArrowRight className="h-5 w-5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        ) : (
          <Card className="border-4 border-dashed border-slate-100 p-24 text-center rounded-[3rem] bg-slate-50/50">
            <div className="flex flex-col items-center gap-6 max-w-sm mx-auto">
              <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center shadow-xl">
                <Activity className="h-12 w-12 text-slate-200" />
              </div>
              <div className="space-y-2">
                <h2 className="font-black text-2xl text-slate-900 uppercase">Belum Ada Pengajuan</h2>
                <p className="text-slate-500 font-medium">Anda belum memulai proses legalitas apapun. Klik tombol di atas untuk memulai sekarang.</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}