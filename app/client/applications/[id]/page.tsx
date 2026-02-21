// app/client/applications/[id]/page.tsx
export const dynamic = 'force-dynamic';

import { createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { ChatBoxClient } from '@/components/dashboard/chat-box-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  ArrowLeft,
  Clock,
  CheckCircle2,
  Circle,
  XCircle,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { cn } from '@/lib/applicationSchema/utils';
import { PaymentStatusBanner } from '@/components/payment/payment-status-banner';
import { PaymentSuccessToast } from '@/components/payment/payment-success-toast';

// Definisi Tahapan Timeline (Konsisten dengan Admin)
const TIMELINE_STEPS = [
  { id: 'pending', label: 'Pesanan Masuk', description: 'Admin sedang meninjau berkas Anda' },
  { id: 'quoted', label: 'Penawaran Harga', description: 'Segera lakukan pembayaran untuk lanjut' },
  { id: 'process', label: 'Proses Pengerjaan', description: 'Legalitas sedang diproses oleh tim kami' },
  { id: 'review', label: 'Review Dokumen', description: 'Tahap akhir pengecekan dokumen' },
  { id: 'completed', label: 'Selesai', description: 'Dokumen Anda siap diunduh' },
];

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string }>;
}

export default async function UserApplicationDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { payment } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

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
      profiles:profiles!application_messages_sender_id_fkey (full_name, role)
    `)
    .eq('application_id', id)
    .order('created_at', { ascending: true });

  const currentStepIndex = TIMELINE_STEPS.findIndex((s) => s.id === app.status);
  const isCancelled = app.status === 'cancelled';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':   return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'quoted':    return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'process':   return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default:          return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">

      {/* Toast notifikasi dari redirect Xendit */}
      <PaymentSuccessToast paymentParam={payment} />

      {/* TOP BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Link
          href="/client/applications"
          className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Kembali ke Riwayat
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
            Dibuat pada {format(new Date(app.created_at), 'dd MMM yyyy', { locale: idLocale })}
          </span>
          <Badge
            variant="outline"
            className={cn('font-black uppercase tracking-widest px-3 py-1 border-2', getStatusColor(app.status))}
          >
            {app.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* LEFT COLUMN (8 Cols) */}
        <div className="lg:col-span-8 space-y-8">

          {/* Main Title Card */}
          <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[2.5rem] border shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-slate-900 dark:text-white leading-none">
                {app.services?.name}
              </h1>
              <p className="mt-4 text-slate-500 font-medium max-w-lg">
                {app.services?.description || 'Detail pengerjaan legalitas bisnis Anda.'}
              </p>
            </div>
            <FileText className="absolute right-[-20px] bottom-[-20px] h-40 w-40 text-slate-50 opacity-10 dark:opacity-5" />
          </div>

          {/* PAYMENT STATUS BANNER — Dinamis berdasarkan status */}
          <PaymentStatusBanner
            applicationId={id}
            status={app.status}
            paymentStatus={app.payment_status}
            quotedPrice={app.quoted_price}
            paymentPaidAt={app.payment_paid_at}
            paymentInvoiceId={app.payment_invoice_id}
            isAdmin={false}
          />

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
                  let stepStatus: 'completed' | 'current' | 'upcoming' | 'error' = 'upcoming';
                  if (isCancelled && app.status === step.id) stepStatus = 'error';
                  else if (isCancelled) stepStatus = 'upcoming';
                  else if (index < currentStepIndex || app.status === 'completed') stepStatus = 'completed';
                  else if (index === currentStepIndex) stepStatus = 'current';

                  // Badge LUNAS di step quoted jika sudah bayar
                  const showPaidBadge = step.id === 'quoted' && app.payment_status === 'paid';

                  return (
                    <div key={step.id} className="relative flex gap-6 items-start">
                      <div
                        className={cn(
                          'relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-4 transition-all duration-500',
                          stepStatus === 'completed' ? 'bg-blue-600 border-blue-50 text-white' :
                          stepStatus === 'current' ? 'bg-white border-blue-600 text-blue-600' :
                          stepStatus === 'error' ? 'bg-red-50 border-red-500 text-red-500' :
                          'bg-white border-slate-100 text-slate-200'
                        )}
                      >
                        {stepStatus === 'completed' ? <CheckCircle2 className="h-5 w-5" /> :
                         stepStatus === 'current' ? <div className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" /> :
                         stepStatus === 'error' ? <XCircle className="h-5 w-5" /> :
                         <Circle className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 flex items-start justify-between gap-4">
                        <div>
                          <h4 className={cn(
                            'font-black text-sm uppercase tracking-tight transition-colors',
                            stepStatus === 'completed' || stepStatus === 'current' ? 'text-slate-900' : 'text-slate-300',
                            stepStatus === 'error' && 'text-red-600'
                          )}>
                            {step.label}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium mt-1">{step.description}</p>
                        </div>
                        {showPaidBadge && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border font-black text-[9px] uppercase tracking-widest shrink-0">
                            ✓ LUNAS
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* SUBMITTED DATA */}
          <Card className="rounded-[2.5rem] p-8 md:p-10 shadow-sm border-slate-100">
            <CardHeader className="px-0 pt-0 pb-8 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Berkas & Data
              </CardTitle>
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.entries(app.form_data || {}).map(([key, val]: [string, any]) => (
                <div
                  key={key}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-100 group hover:bg-white hover:border-blue-200 transition-all"
                >
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                    {key.split('_').join(' ')}
                  </p>
                  <p className="text-sm font-bold text-slate-800 break-words">
                    {val?.toString() || '-'}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: CHAT (4 Cols) */}
        <div className="lg:col-span-4 lg:sticky lg:top-8 h-[calc(100vh-100px)] min-h-[600px] flex flex-col">
          <ChatBoxClient
            applicationId={id}
            initialMessages={messages || []}
            currentUserId={user.id}
          />
        </div>
      </div>
    </div>
  );
}
