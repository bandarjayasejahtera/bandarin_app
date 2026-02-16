import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ChatBox } from "@/components/dashboard/chat-box";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function UserApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // Next.js 15+ mewajibkan await params
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: app } = await supabase
    .from('applications')
    .select('*, services(name)')
    .eq('id', id)
    .eq('user_id', user.id) // Filter keamanan agar user tidak bisa mengintip ID orang lain
    .single();

  if (!app) notFound();

  const { data: messages } = await supabase
    .from('application_messages')
    .select('*')
    .eq('application_id', id)
    .order('created_at', { ascending: true });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <Link href="/user/dashboard/applications" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Riwayat
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border shadow-xl">
             <h1 className="text-3xl font-black tracking-tighter uppercase">{app.services?.name}</h1>
             <Badge className="mt-2 font-black uppercase tracking-widest px-4">{app.status}</Badge>
          </div>

          {app.status === 'quoted' && app.quoted_price && (
            <Card className="bg-primary text-white p-8 rounded-[2.5rem]">
              <h2 className="text-xl font-black uppercase mb-2">Penawaran Harga</h2>
              <div className="text-4xl font-black mb-6 tracking-tighter">Rp {app.quoted_price.toLocaleString('id-ID')}</div>
              <Button className="w-full h-14 bg-white text-primary font-black rounded-2xl">Lanjut Pembayaran</Button>
            </Card>
          )}

          <Card className="rounded-[2rem] p-8">
            <h3 className="font-black uppercase text-xs tracking-widest text-slate-400 mb-6">Data Terkirim</h3>
            <div className="grid grid-cols-2 gap-6">
              {Object.entries(app.form_data || {}).map(([key, val]: [string, any]) => (
                <div key={key}>
                  <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">{key.replace('_', ' ')}</p>
                  <p className="text-sm font-bold truncate">{val?.toString() || '-'}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <ChatBox applicationId={id} initialMessages={messages || []} currentUserId={user.id} />
        </div>
      </div>
    </div>
  );
}