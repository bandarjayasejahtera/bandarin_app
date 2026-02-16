// app/user/dashboard/applications/[id]/page.tsx
export const dynamic = "force-dynamic";

import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ChatBox } from "@/components/dashboard/chat-box-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  FileText, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  Circle, 
  XCircle,
  ShieldCheck,
  Receipt
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/applicationSchema/utils";

// Definisi Tahapan Timeline (Konsisten dengan Admin)
const TIMELINE_STEPS = [
  { id: 'pending', label: 'Pesanan Masuk', description: 'Admin sedang meninjau berkas Anda' },
  { id: 'quoted', label: 'Penawaran Harga', description: 'Segera lakukan pembayaran untuk lanjut' },
  { id: 'process', label: 'Proses Pengerjaan', description: 'Legalitas sedang diproses oleh tim kami' },
  { id: 'review', label: 'Review Dokumen', description: 'Tahap akhir pengecekan dokumen' },
  { id: 'completed', label: 'Selesai', description: 'Dokumen Anda siap diunduh' },
];

export default async function UserApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch detail aplikasi
  const { data: app } = await supabase
    .from('applications')
    .select(`
      *, 
      services:services!applications_service_id_fkey (name, description)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!app) notFound();

  // Fetch riwayat chat
  const { data: messages } = await supabase
    .from('application_messages')
    .select(`
        *,
        profiles:profiles!application_messages_sender_id_fkey (
          full_name,
          role
        )
      `)
    .eq('application_id', id)
    .order('created_at', { ascending: true });

  const currentStepIndex = TIMELINE_STEPS.findIndex(s => s.id === app.status);
  const isCancelled = app.status === 'cancelled';

  // Helper untuk Status Badge
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'quoted': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'process': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      {/* --- TOP BAR --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Link href="/dashboard/applications" className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Kembali ke Riwayat
        </Link>
        <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Dibuat pada {format(new Date(app.created_at), "dd MMM yyyy", { locale: idLocale })}</span>
            <Badge variant="outline" className={cn("font-black uppercase tracking-widest px-3 py-1 border-2", getStatusColor(app.status))}>
              {app.status}
            </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* --- LEFT COLUMN: CONTENT (8 Cols) --- */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Main Title Card */}
          <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[2.5rem] border shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
             <div className="relative z-10">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-slate-900 dark:text-white leading-none">
                    {app.services?.name}
                </h1>
                <p className="mt-4 text-slate-500 font-medium max-w-lg">{app.services?.description || "Detail pengerjaan legalitas bisnis Anda."}</p>
             </div>
             <FileText className="absolute right-[-20px] bottom-[-20px] h-40 w-40 text-slate-50 opacity-10 dark:opacity-5" />
          </div>

          {/* PAYMENT CARD (Hanya muncul jika status 'quoted') */}
          {app.status === 'quoted' && app.quoted_price && (
            <Card className="bg-blue-600 text-white p-8 md:p-10 rounded-[3rem] border-none shadow-2xl shadow-blue-200 overflow-hidden relative group">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="text-center md:text-left">
                    <Badge className="bg-blue-500 text-white border-none mb-4 uppercase font-black text-[10px] tracking-widest">Penawaran Tersedia</Badge>
                    <h2 className="text-xl font-bold uppercase opacity-80 mb-1">Total Tagihan</h2>
                    <div className="text-5xl font-black tracking-tighter">Rp {Number(app.quoted_price).toLocaleString('id-ID')}</div>
                </div>
                <Button className="w-full md:w-auto h-16 px-10 bg-white text-blue-600 font-black rounded-2xl text-lg shadow-xl hover:bg-slate-50 transition-all active:scale-95 flex gap-3">
                    <CreditCard className="h-6 w-6" />
                    LANJUT PEMBAYARAN
                </Button>
              </div>
              {/* Dekorasi */}
              <div className="absolute top-0 right-0 h-40 w-40 bg-white opacity-5 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-700" />
            </Card>
          )}

          {/* PROGRESS TIMELINE */}
          <Card className="rounded-[2.5rem] p-8 md:p-10 shadow-sm border-slate-100">
            <CardHeader className="px-0 pt-0 pb-8">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Progres Pengajuan
                </CardTitle>
            </CardHeader>
            <div className="relative">
                <div className="absolute left-[17px] top-2 bottom-4 w-0.5 bg-slate-100" />
                <div className="space-y-8">
                    {TIMELINE_STEPS.map((step, index) => {
                        let status: 'completed' | 'current' | 'upcoming' | 'error' = 'upcoming';
                        if (isCancelled && app.status === step.id) status = 'error';
                        else if (isCancelled) status = 'upcoming';
                        else if (index < currentStepIndex || app.status === 'completed') status = 'completed';
                        else if (index === currentStepIndex) status = 'current';

                        return (
                            <div key={step.id} className="relative flex gap-6 items-start">
                                <div className={cn(
                                    "relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-4 transition-all duration-500",
                                    status === 'completed' ? "bg-blue-600 border-blue-50 text-white" : 
                                    status === 'current' ? "bg-white border-blue-600 text-blue-600" : 
                                    status === 'error' ? "bg-red-50 border-red-500 text-red-500" :
                                    "bg-white border-slate-100 text-slate-200"
                                )}>
                                    {status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> : 
                                     status === 'current' ? <div className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" /> : 
                                     status === 'error' ? <XCircle className="h-5 w-5" /> :
                                     <Circle className="h-5 w-5" />}
                                </div>
                                <div className="flex-1">
                                    <h4 className={cn(
                                        "font-black text-sm uppercase tracking-tight transition-colors",
                                        status === 'completed' || status === 'current' ? "text-slate-900" : "text-slate-300"
                                    )}>{step.label}</h4>
                                    <p className="text-xs text-slate-500 font-medium mt-1">{step.description}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
          </Card>

          {/* SUBMITTED DATA */}
          <Card className="rounded-[2.5rem] p-8 md:p-10 shadow-sm border-slate-100">
            <CardHeader className="px-0 pt-0 pb-8 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Berkas & Data</CardTitle>
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.entries(app.form_data || {}).map(([key, val]: [string, any]) => (
                <div key={key} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 group hover:bg-white hover:border-blue-200 transition-all">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{key.split('_').join(' ')}</p>
                  <p className="text-sm font-bold text-slate-800 break-words">{val?.toString() || '-'}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* --- RIGHT COLUMN: CHAT (4 Cols) --- */}
        <div className="lg:col-span-4 lg:sticky lg:top-8 h-[calc(100vh-100px)] min-h-[600px] flex flex-col">
          <ChatBox 
            applicationId={id} 
            initialMessages={messages || []} 
            currentUserId={user.id} 
          />
        </div>

      </div>
    </div>
  );
}