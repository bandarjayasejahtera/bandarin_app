// app/agent/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Calendar, ArrowRight, ClipboardList,
  CheckCircle2, Clock, AlertCircle, Zap,
} from "lucide-react";
import { cn } from "@/lib/applicationSchema/utils";

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  process: { label: "Proses", color: "text-sky-700",     bg: "bg-sky-50 border-sky-200",     icon: Clock },
  review:  { label: "Review", color: "text-violet-700",  bg: "bg-violet-50 border-violet-200", icon: AlertCircle },
  completed:{ label: "Selesai", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
};

function getStatusCfg(status: string) {
  return STATUS_CONFIG[status] ?? { label: status, color: "text-cool-steel-600", bg: "bg-cool-steel-100 border-cool-steel-200", icon: Clock };
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default async function AgentDashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Agent profile
  const { data: agent } = await supabase
    .from("agents")
    .select("id, name, agency_name")
    .eq("user_id", user.id)
    .single();

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-6">
        <div className="h-16 w-16 rounded-2xl bg-cool-steel-100 flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-cool-steel-400" />
        </div>
        <h2 className="text-base font-black text-deep-space-blue-950">Akun Belum Terhubung</h2>
        <p className="text-sm text-cool-steel-500 mt-2 max-w-xs">
          Hubungi Admin Bandarin untuk menghubungkan akun Anda dengan profil Agent.
        </p>
      </div>
    );
  }

  // Active tasks
  const { data: rawTasks } = await supabase
    .from("applications")
    .select("id, status, sub_status, created_at, service_id, user_id")
    .eq("assigned_agent_id", agent.id)
    .in("status", ["process", "review"])
    .order("created_at", { ascending: false });

  type Task = {
    id: string; status: string; sub_status: string | null;
    created_at: string; service_id: string; user_id: string;
    serviceName: string; clientName: string;
  };

  let tasks: Task[] = (rawTasks || []).map((t) => ({
    ...t, serviceName: "Layanan Legal", clientName: "Klien Anonim",
  }));

  if (tasks.length > 0) {
    const serviceIds = [...new Set(tasks.map((t) => t.service_id))];
    const userIds = [...new Set(tasks.map((t) => t.user_id))];

    const [{ data: services }, { data: profiles }] = await Promise.all([
      supabase.from("services").select("id, name").in("id", serviceIds),
      supabase.from("profiles").select("id, full_name").in("id", userIds),
    ]);

    tasks = tasks.map((t) => ({
      ...t,
      serviceName: services?.find((s) => s.id === t.service_id)?.name ?? "Layanan Legal",
      clientName:  profiles?.find((p) => p.id === t.user_id)?.full_name ?? "Klien Anonim",
    }));
  }

  const firstName = agent.name?.split(" ")[0] || "Agent";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* ── GREETING ──────────────────────────────────────────────── */}
      <div className="pt-1">
        <div className="flex items-center gap-1.5 text-tuscan-sun-600 font-bold text-[11px] uppercase tracking-[0.18em] mb-1">
          <Zap className="h-3 w-3" />
          Dashboard Agent
        </div>
        <h1 className="text-[26px] font-black text-deep-space-blue-950 tracking-tight leading-none">
          Halo, {firstName}! 👋
        </h1>
        <p className="text-sm text-cool-steel-500 font-medium mt-1.5">
          {tasks.length > 0
            ? `${tasks.length} berkas aktif sedang Anda kawal.`
            : "Tidak ada tugas aktif saat ini."}
        </p>
      </div>

      {/* ── STAT PILL ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          value={tasks.length}
          label="Berkas Aktif"
          accent="bg-deep-space-blue-950"
          textColor="text-white"
        />
        <StatCard
          value={tasks.filter((t) => t.status === "review").length}
          label="Siap Review"
          accent="bg-tuscan-sun-500"
          textColor="text-deep-space-blue-950"
        />
      </div>

      {/* ── TASK LIST ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-cool-steel-400">
          Tugas Berjalan
        </h2>

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-cool-steel-200">
            <div className="h-14 w-14 bg-cool-steel-50 rounded-full flex items-center justify-center mb-3">
              <ClipboardList className="h-7 w-7 text-cool-steel-300" />
            </div>
            <p className="font-bold text-cool-steel-500 text-sm">Belum ada tugas.</p>
            <p className="text-xs text-cool-steel-400 mt-1">Bersantai dulu! ☕</p>
          </div>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </section>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  value, label, accent, textColor,
}: {
  value: number; label: string; accent: string; textColor: string;
}) {
  return (
    <div className={cn("rounded-2xl p-4 flex flex-col gap-1 shadow-sm", accent)}>
      <span className={cn("text-3xl font-black leading-none", textColor)}>{value}</span>
      <span className={cn("text-[11px] font-bold uppercase tracking-wider opacity-75", textColor)}>
        {label}
      </span>
    </div>
  );
}

function TaskCard({ task }: { task: { id: string; status: string; sub_status: string | null; created_at: string; serviceName: string; clientName: string } }) {
  const cfg = getStatusCfg(task.status);
  const Icon = cfg.icon;

  return (
    <Link href={`/agent/orders/${task.id}`} className="block group">
      <div className="bg-white rounded-2xl border border-cool-steel-100 shadow-sm group-hover:border-tuscan-sun-300 group-hover:shadow-md transition-all duration-200 overflow-hidden">
        {/* Accent strip */}
        <div className={cn("h-1 w-full", task.status === "review" ? "bg-violet-500" : "bg-sky-500")} />

        <div className="p-4">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-deep-space-blue-950 text-sm leading-tight truncate">
                {task.serviceName}
              </h3>
              <p className="text-[11px] font-semibold text-cool-steel-500 mt-0.5 truncate">
                {task.clientName}
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn("shrink-0 border text-[10px] font-black uppercase tracking-wider", cfg.bg, cfg.color)}
            >
              <Icon className="h-2.5 w-2.5 mr-1" />
              {cfg.label}
            </Badge>
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between pt-3 border-t border-cool-steel-100">
            <div className="flex items-center gap-3 text-[11px] font-semibold text-cool-steel-400">
              {task.sub_status && (
                <span className="flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-lg font-bold">
                  <MapPin className="h-3 w-3" />
                  {task.sub_status}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(task.created_at), "dd MMM", { locale: idLocale })}
              </span>
            </div>
            <div className="h-7 w-7 rounded-full bg-cool-steel-50 border border-cool-steel-200 flex items-center justify-center group-hover:bg-tuscan-sun-400 group-hover:border-tuscan-sun-400 transition-colors">
              <ArrowRight className="h-3.5 w-3.5 text-cool-steel-400 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
