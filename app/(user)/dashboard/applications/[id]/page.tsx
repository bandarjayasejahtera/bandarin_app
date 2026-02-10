//(user)/dashboard/orders/[id]/page.tsx
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { ChatBox } from "@/components/dashboard/chat-box";
import { sendMessageAction } from "@/actions/update-status/chat-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, FileText, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default async function UserApplicationDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Ambil Data Pengajuan
  const { data: app } = await supabase
    .from('applications')
    .select('*, services(name)')
    .eq('id', id)
    .single();

  if (!app) notFound();

  // 2. Ambil Riwayat Chat
  const { data: messages } = await supabase
    .from('application_messages')
    .select('*')
    .eq('application_id', id)
    .order('created_at', { ascending: true });

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Dashboard
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* STATUS & HEADER */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h1 className="text-2xl font-black tracking-tight">{app.services?.name}</h1>
              <p className="text-sm text-muted-foreground font-medium">ID Pengajuan: {app.id}</p>
            </div>
            <Badge className="w-fit px-4 py-1.5 text-xs font-black uppercase tracking-widest bg-primary/10 text-primary border-none">
              Status: {app.status}
            </Badge>
          </div>

          {/* QUOTATION SECTION */}
          {app.status === 'quoted' && app.quoted_price && (
            <Card className="border-2 border-primary bg-primary/5 overflow-hidden rounded-3xl">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary rounded-xl">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-black">Penawaran Harga</h2>
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-medium mb-6">
                  Admin telah meninjau pengajuan Anda. Berikut adalah estimasi biaya untuk layanan ini:
                </p>
                <div className="text-4xl font-black text-primary mb-8 tracking-tighter">
                  Rp {app.quoted_price.toLocaleString('id-ID')}
                </div>
                <Button className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
                  Setujui & Lanjut Pembayaran
                </Button>
              </CardContent>
            </Card>
          )}

          {/* DATA SUMMARY */}
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800">
            <CardContent className="p-8">
              <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Data Terkirim
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(app.form_data || {}).map(([key, val]: [string, any]) => (
                  <div key={key}>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{key.replace('_', ' ')}</p>
                    <p className="text-sm font-bold truncate">{val?.toString() || '-'}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CHAT INTERFACE */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <ChatBox 
              applicationId={id} 
              messages={messages || []} 
              sendMessageAction={sendMessageAction}
              currentUserId={user?.id}
            />
            <p className="mt-4 text-[11px] text-center text-slate-400 font-medium leading-relaxed px-4">
              Gunakan fitur chat di atas untuk berkonsultasi langsung dengan tim ahli kami mengenai pengajuan ini.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}