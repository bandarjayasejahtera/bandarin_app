// app/agent/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, ArrowRight, ClipboardList } from "lucide-react";

export default async function AgentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 1. Cari ID Agent berdasarkan user yang login
  const { data: agent } = await supabase
    .from("agents")
    .select("id, name")
    .eq("user_id", user.id)
    .single();

  if (!agent) {
    return (
      <div className="text-center py-20">
        <h2 className="text-lg font-bold text-slate-800">Akun Belum Terhubung</h2>
        <p className="text-sm text-slate-500 mt-2">Silakan hubungi Admin untuk menghubungkan akun login Anda dengan profil Agent.</p>
      </div>
    );
  }

  // 2. Ambil Tugas (Applications) yang di-assign ke Agent ini
  const { data: tasks, error } = await supabase
    .from("applications")
    .select(`
      id,
      status,
      sub_status,
      created_at,
      services (name),
      profiles (full_name)
    `)
    .eq("assigned_agent_id", agent.id)
    .in("status", ["process", "review"]) // Hanya tampilkan yang sedang jalan
    .order("created_at", { ascending: false });

  if (error) console.error("Error fetching tasks:", error.message);

  const activeTasks = tasks || [];

  return (
    <div className="space-y-5 animate-in fade-in zoom-in duration-500">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Halo, {agent.name.split(' ')[0]}! 👋</h2>
        <p className="text-sm text-slate-500 font-medium mt-1">Anda memiliki {activeTasks.length} berkas yang sedang dikawal hari ini.</p>
      </div>

      <div className="space-y-4">
        {activeTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <ClipboardList className="h-8 w-8 text-slate-300" />
            </div>
            <p className="font-bold text-slate-600">Belum ada tugas.</p>
            <p className="text-xs text-slate-400 mt-1">Anda bisa bersantai sejenak! ☕</p>
          </div>
        ) : (
          activeTasks.map((task: any) => {
            const serviceName = Array.isArray(task.services) ? task.services[0]?.name : task.services?.name;
            const clientName = Array.isArray(task.profiles) ? task.profiles[0]?.full_name : task.profiles?.full_name;

            return (
              <Link href={`/agent/orders/${task.id}`} key={task.id} className="block group">
                <Card className="rounded-2xl border-slate-200/80 shadow-sm group-hover:border-sky-300 group-hover:shadow-md transition-all duration-200 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-sky-500" />
                  <CardContent className="p-4 pl-5">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-50 text-slate-500 border-slate-200">
                        {task.status}
                      </Badge>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(new Date(task.created_at), "dd MMM", { locale: idLocale })}
                      </span>
                    </div>
                    
                    <h3 className="font-black text-slate-800 leading-tight mb-1">{serviceName || "Layanan Legal"}</h3>
                    <p className="text-xs font-medium text-slate-500 mb-3">{clientName || "Klien Anonim"}</p>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center text-xs font-bold text-sky-700 bg-sky-50 px-2 py-1 rounded-lg">
                        <MapPin className="h-3.5 w-3.5 mr-1.5" />
                        {task.sub_status || "Menunggu Penempatan"}
                      </div>
                      <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-sky-100 group-hover:text-sky-600 transition-colors">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })
        )}
      </div>
    </div>
  );
}