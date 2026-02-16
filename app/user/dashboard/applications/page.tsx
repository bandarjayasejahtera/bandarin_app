export const dynamic = "force-dynamic";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, ArrowRight, Activity, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      services (name),
      application_messages (id, is_read, user_id)
    `)
    .eq('user_id', user.id) // Filter ketat milik user
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Riwayat Pengajuan</h1>
          <p className="text-slate-500 font-medium">Pantau progres legalitas bisnis Anda secara real-time.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {applications && applications.length > 0 ? (
          applications.map((app: any) => {
            const hasNewMessage = app.application_messages?.some(
              (m: any) => !m.is_read && m.user_id !== user.id
            );

            return (
              <Link key={app.id} href={`/user/dashboard/applications/${app.id}`}>
                <Card className={`group border-none transition-all hover:translate-x-1 shadow-md ${hasNewMessage ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'bg-white dark:bg-slate-900/40'}`}>
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className={`p-4 rounded-2xl ${hasNewMessage ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white uppercase">{app.services?.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge className="font-black text-[9px] uppercase px-2 py-0">{app.status}</Badge>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Diajukan: {new Date(app.created_at).toLocaleDateString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {hasNewMessage && <AlertCircle className="h-5 w-5 text-red-500 animate-pulse" />}
                      <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        ) : (
          <Card className="border-2 border-dashed p-20 text-center rounded-[3rem]">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Belum ada pengajuan terdeteksi</p>
          </Card>
        )}
      </div>
    </div>
  );
}