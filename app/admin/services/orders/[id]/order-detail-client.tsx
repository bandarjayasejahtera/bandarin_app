// app/admin/services/orders/[id]/order-detail-client.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle2,
  User, Phone, DollarSign, Briefcase,
  MoreVertical, Clock, ShieldCheck,
  Check, Circle, XCircle, SendHorizontal,
  Receipt, FileText, Loader2, UploadCloud, Edit2,
  ChevronRight, Zap, Building2, BadgeCheck, Sparkles,
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatBoxAdmin } from "@/components/dashboard/chat-box-admin";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

// Utils
import { toast } from "sonner";
import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/applicationSchema/utils";
import { updateOrderStatusAction } from "@/actions/admin/order-actions";

// Sub-Components & Actions
import { AgentControlPanel } from "@/components/admin/agent-control-panel";
import { DocumentChecklist } from "@/components/admin/document-checklist";
import { AdminMilestoneInvoices } from "@/components/admin/admin-milestone-invoices";
import { ensureMilestoneInvoices, getMilestoneInvoices } from "@/actions/milestone-invoice-actions";

// ============================================================================
// TYPES
// ============================================================================
type OrderType = any;
type MessageType = any;

interface OrderDetailClientProps {
  initialOrder: OrderType;
  initialMessages: MessageType[];
  initialCurrentUserId?: string;
}

// ============================================================================
// UTILITIES
// ============================================================================
function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatPriceWithCommas(value: number | string | null | undefined): string {
  const n =
    typeof value === "string"
      ? parseInt(value.replace(/\D/g, ""), 10) || 0
      : Number(value) || 0;
  return n.toLocaleString("id-ID");
}

function parsePriceFromCommas(str: string): string {
  const digits = str.replace(/\D/g, "");
  return digits === "" ? "" : String(parseInt(digits, 10));
}

// ============================================================================
// DESIGN TOKENS – satu sumber kebenaran untuk warna & gaya
// ============================================================================
const RADIUS = "rounded-2xl";
const CARD_BASE =
  "border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_1px_3px_rgba(0,0,0,.04)]";

const STATUS_THEME: Record<
  string,
  { bg: string; text: string; ring: string; accent: string; icon: string }
> = {
  draft: {
    bg: "bg-slate-50",
    text: "text-slate-600",
    ring: "ring-slate-200",
    accent: "bg-slate-500",
    icon: "text-slate-500",
  },
  verification: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
    accent: "bg-amber-500",
    icon: "text-amber-500",
  },
  payment: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    ring: "ring-violet-200",
    accent: "bg-violet-500",
    icon: "text-violet-500",
  },
  processing: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    ring: "ring-sky-200",
    accent: "bg-sky-500",
    icon: "text-sky-500",
  },
  final_review: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    ring: "ring-indigo-200",
    accent: "bg-indigo-500",
    icon: "text-indigo-500",
  },
  completed: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
    accent: "bg-emerald-500",
    icon: "text-emerald-500",
  },
  cancelled: {
    bg: "bg-red-50",
    text: "text-red-600",
    ring: "ring-red-200",
    accent: "bg-red-500",
    icon: "text-red-500",
  },
};

const CONSULTANT_STEPS = [
  { id: "draft", label: "Incoming", description: "Data awal klien", icon: FileText },
  { id: "verification", label: "Verifikasi Berkas", description: "Cek kelengkapan dokumen", icon: BadgeCheck },
  { id: "payment", label: "Pembayaran", description: "Menunggu DP / Termin", icon: DollarSign },
  { id: "processing", label: "Proses Instansi", description: "Pengerjaan di dinas", icon: Building2 },
  { id: "final_review", label: "Final Review", description: "Validasi hasil akhir", icon: ShieldCheck },
  { id: "completed", label: "Selesai", description: "Serah terima ke klien", icon: CheckCircle2 },
];

function getTheme(status: string) {
  return STATUS_THEME[status] ?? STATUS_THEME.draft;
}

// ============================================================================
// SMALL REUSABLE PIECES
// ============================================================================

/** Pill badge yang konsisten untuk status */
function StatusBadge({ status }: { status: string }) {
  const t = getTheme(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg ring-1",
        t.bg,
        t.text,
        t.ring,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", t.accent)} />
      {status.replace("_", " ")}
    </span>
  );
}

/** Tombol aksi utama – warna mengikuti status */
function PrimaryActionButton({
  onClick,
  loading,
  label,
  icon: Icon,
  colorClass = "bg-sky-600 hover:bg-sky-700 shadow-sky-200/60",
}: {
  onClick: () => void;
  loading: boolean;
  label: string;
  icon: React.ElementType;
  colorClass?: string;
}) {
  return (
    <Button
      disabled={loading}
      onClick={onClick}
      className={cn(
        "w-full h-[52px] text-sm font-extrabold text-white rounded-xl shadow-lg",
        "active:scale-[.97] transition-all duration-150",
        colorClass,
      )}
    >
      {loading ? (
        <Loader2 className="animate-spin h-5 w-5" />
      ) : (
        <>
          <Icon className="mr-2 h-[18px] w-[18px]" />
          {label}
        </>
      )}
    </Button>
  );
}

/** Info box kecil, warna netral atau status-based */
function InfoBanner({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "warning" | "success";
}) {
  const styles = {
    default: "bg-slate-50 border-slate-200/80 text-slate-700",
    warning: "bg-amber-50/80 border-amber-200/60 text-amber-800",
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  };
  return (
    <div className={cn("rounded-xl border p-3.5 text-xs leading-relaxed font-medium", styles[variant])}>
      {children}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function OrderDetailClient({
  initialOrder,
  initialMessages,
  initialCurrentUserId = "",
}: OrderDetailClientProps) {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string>(initialCurrentUserId);

  const [order, setOrder] = useState(initialOrder);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [clientIsTyping, setClientIsTyping] = useState(false);

  // ── State Keuangan ──
  const [isEditingContract, setIsEditingContract] = useState(
    !initialOrder.quoted_price || initialOrder.quoted_price <= 0,
  );
  const [priceEditValue, setPriceEditValue] = useState(
    initialOrder.quoted_price ? formatPriceWithCommas(initialOrder.quoted_price) : "",
  );
  const [dpPercentage, setDpPercentage] = useState<number>(50);
  const [milestones, setMilestones] = useState<any[]>([]);

  // ── State Sub-Status & Upload Modal ──
  const [subStatus, setSubStatus] = useState<string>(order.sub_status || "");
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [finalDocument, setFinalDocument] = useState<File | null>(null);

  // ── Derived ──
  const theme = useMemo(() => getTheme(order.status), [order.status]);
  const currentStepIndex = CONSULTANT_STEPS.findIndex((s) => s.id === order.status);
  const isCancelled = order.status === "cancelled";
  const isTerminal = order.status === "completed" || isCancelled;

  // ── Auth & milestones init ──
  useEffect(() => {
    if (initialCurrentUserId) {
      setCurrentUserId(initialCurrentUserId);
    } else {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) setCurrentUserId(user.id);
      });
    }
    getMilestoneInvoices(order.id).then((res) => {
      if (res.success) setMilestones(res.invoices);
    });
  }, [supabase, initialCurrentUserId, order.id]);

  // ── Realtime subscription ──
  useEffect(() => {
    const channel = supabase
      .channel(`order-room-${order.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "applications",
          filter: `id=eq.${order.id}`,
        },
        (payload) => setOrder((prev: any) => ({ ...prev, ...payload.new })),
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id, supabase]);

  // ════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ════════════════════════════════════════════════════════════════════

  const handleNextAction = useCallback(
    async (nextStatus: string) => {
      if (nextStatus === "payment" && (!order.quoted_price || order.quoted_price <= 0)) {
        toast.error("Atur & simpan Nilai Kontrak terlebih dahulu di panel kanan.");
        setIsEditingContract(true);
        return;
      }
      if (nextStatus === "processing") {
        const dpInvoice = milestones.find(
          (m) => m.milestone_key === "dp" || m.percentage >= 50,
        );
        if (dpInvoice && dpInvoice.status !== "paid") {
          toast.error("Pastikan DP sudah dilunasi klien sebelum memproses.");
          return;
        }
      }
      setIsUpdating(true);
      const previousStatus = order.status;
      setOrder((prev: any) => ({ ...prev, status: nextStatus }));

      const { error } = await supabase
        .from("applications")
        .update({ status: nextStatus })
        .eq("id", order.id);
      if (error) {
        setOrder((prev: any) => ({ ...prev, status: previousStatus }));
        toast.error("Gagal update status.");
      } else {
        toast.success("Status berhasil diperbarui.");
        router.refresh();
      }
      setIsUpdating(false);
    },
    [order, milestones, supabase, router],
  );

  const handleSavePriceAndMilestone = useCallback(async () => {
    const cleanPrice = parsePriceFromCommas(priceEditValue);
    const numericPrice = parseInt(cleanPrice, 10);
    if (!numericPrice || numericPrice <= 0 || isNaN(numericPrice)) {
      toast.error("Masukkan nominal harga yang valid.");
      return;
    }
    setIsUpdating(true);
    try {
      const result = await updateOrderStatusAction(order.id, {
        quoted_price: numericPrice,
      });
      if (result.error) throw new Error(result.error);

      const milestoneRes = await ensureMilestoneInvoices(
        order.id,
        numericPrice,
        dpPercentage,
      );
      if (!milestoneRes.success) throw new Error(milestoneRes.error);

      setOrder((prev: any) => ({ ...prev, quoted_price: numericPrice }));
      setIsEditingContract(false);

      const res = await getMilestoneInvoices(order.id);
      if (res.success) setMilestones(res.invoices);

      toast.success("Kontrak disimpan & invoice termin dibuat.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan.");
    } finally {
      setIsUpdating(false);
    }
  }, [priceEditValue, dpPercentage, order.id, router]);

  const handleCompleteSubmit = useCallback(async () => {
    if (!finalDocument) {
      toast.error("Unggah dokumen hasil terlebih dahulu.");
      return;
    }
    setIsUpdating(true);
    try {
      const fileExt = finalDocument.name.split(".").pop();
      const fileName = `final_doc_order_${order.id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, finalDocument);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("documents")
        .getPublicUrl(fileName);
      const documentUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from("applications")
        .update({ status: "completed", final_document_url: documentUrl })
        .eq("id", order.id);
      if (updateError) throw updateError;

      setIsCompleteModalOpen(false);
      setOrder((prev: any) => ({
        ...prev,
        status: "completed",
        final_document_url: documentUrl,
      }));
      toast.success("Pesanan selesai & dokumen berhasil diunggah.");
      router.refresh();
    } catch {
      toast.error("Gagal menyelesaikan pesanan.");
    } finally {
      setIsUpdating(false);
    }
  }, [finalDocument, order.id, supabase, router]);

  // ════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 pb-10">
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <Link href="/admin/services/orders">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 shadow-sm transition-all"
            >
              <ArrowLeft className="h-4 w-4 text-slate-600" />
            </Button>
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </h1>
              <StatusBadge status={order.status} />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {format(new Date(order.created_at), "dd MMM yyyy, HH:mm", {
                  locale: idLocale,
                })}
              </span>
              {order.services?.name && (
                <span className="inline-flex items-center gap-1.5 text-slate-600 font-semibold">
                  <Briefcase className="h-3.5 w-3.5" />
                  {order.services.name}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Live indicator */}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold ring-1 transition-colors",
              isConnected
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : "bg-amber-50 text-amber-700 ring-amber-200",
            )}
          >
            <span className="relative flex h-2 w-2">
              {isConnected && (
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              )}
              <span
                className={cn(
                  "relative inline-flex rounded-full h-2 w-2",
                  isConnected ? "bg-emerald-500" : "bg-amber-500",
                )}
              />
            </span>
            {isConnected ? "Live" : "Connecting…"}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl border border-slate-200/80 bg-white shadow-sm"
              >
                <MoreVertical className="h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5">
              <DropdownMenuItem className="rounded-lg font-medium text-sm py-2.5 px-3">
                <FileText className="mr-2.5 h-4 w-4 text-slate-400" />
                Cetak Laporan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="rounded-lg font-bold text-sm py-2.5 px-3 text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={() => handleNextAction("cancelled")}
              >
                <XCircle className="mr-2.5 h-4 w-4" />
                Batalkan Order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ── MAIN GRID ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* ========================================================= */}
        {/*  KOLOM KIRI: ACTION CENTER, CHECKLIST, TIMELINE, AGENT    */}
        {/* ========================================================= */}
        <aside className="lg:col-span-4 flex flex-col gap-5 overflow-y-auto lg:max-h-[calc(100vh-12rem)] pr-1 scrollbar-thin">
          {/* ── Action Center ── */}
          <Card className={cn(CARD_BASE, RADIUS, "overflow-hidden relative")}>
            {/* Accent bar atas */}
            <div className={cn("absolute inset-x-0 top-0 h-1", theme.accent)} />

            <CardHeader className="pt-6 pb-3">
              <div className="flex items-center gap-2">
                <Zap className={cn("h-4 w-4", theme.icon)} />
                <CardTitle className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[.18em]">
                  Action Center
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="pb-5">
              {(() => {
                switch (order.status) {
                  case "draft":
                    return (
                      <PrimaryActionButton
                        onClick={() => handleNextAction("verification")}
                        loading={isUpdating}
                        label="MULAI VERIFIKASI BERKAS"
                        icon={FileText}
                        colorClass="bg-sky-600 hover:bg-sky-700 shadow-sky-200/60"
                      />
                    );

                  case "verification":
                    return (
                      <div className="space-y-3">
                        <InfoBanner>
                          Pastikan berkas sudah lengkap dan{" "}
                          <strong>Harga &amp; Termin</strong> sudah ditetapkan di
                          panel kanan sebelum lanjut.
                        </InfoBanner>
                        <PrimaryActionButton
                          onClick={() => handleNextAction("payment")}
                          loading={isUpdating}
                          label="LANJUT KE PEMBAYARAN"
                          icon={DollarSign}
                          colorClass="bg-amber-600 hover:bg-amber-700 shadow-amber-200/60"
                        />
                      </div>
                    );

                  case "payment":
                    return (
                      <div className="space-y-3">
                        <InfoBanner variant="warning">
                          <div className="flex items-start gap-2.5">
                            <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                            <div>
                              <p className="font-bold text-sm">Menunggu DP Lunas</p>
                              <p className="mt-0.5 opacity-80">
                                Pastikan DP sudah dibayar klien sebelum melanjutkan.
                              </p>
                            </div>
                          </div>
                        </InfoBanner>
                        <PrimaryActionButton
                          onClick={() => handleNextAction("processing")}
                          loading={isUpdating}
                          label="MULAI PROSES INSTANSI"
                          icon={Building2}
                          colorClass="bg-sky-600 hover:bg-sky-700 shadow-sky-200/60"
                        />
                      </div>
                    );

                  case "processing":
                    return (
                      <div className="space-y-4">
                        {/* Sub-status badges */}
                        <div className="space-y-2.5">
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[.18em]">
                            Update Posisi Instansi
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {["PUPR", "ATR/BPN", "OSS", "Dinas Teknis"].map(
                              (sub) => (
                                <button
                                  key={sub}
                                  onClick={async () => {
                                    setSubStatus(sub);
                                    await supabase
                                      .from("applications")
                                      .update({ sub_status: sub })
                                      .eq("id", order.id);
                                    toast.success(`Posisi diupdate: ${sub}`);
                                  }}
                                  className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                                    subStatus === sub
                                      ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                                      : "bg-white text-slate-600 border-slate-200 hover:border-sky-300 hover:text-sky-700",
                                  )}
                                >
                                  {sub}
                                </button>
                              ),
                            )}
                          </div>
                        </div>
                        <PrimaryActionButton
                          onClick={() => handleNextAction("final_review")}
                          loading={isUpdating}
                          label="PROSES SELESAI → REVIEW"
                          icon={ShieldCheck}
                          colorClass="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200/60"
                        />
                      </div>
                    );

                  case "final_review":
                    return (
                      <PrimaryActionButton
                        onClick={() => setIsCompleteModalOpen(true)}
                        loading={isUpdating}
                        label="SELESAIKAN PESANAN"
                        icon={CheckCircle2}
                        colorClass="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200/60"
                      />
                    );

                  case "completed":
                    return (
                      <div className="flex flex-col items-center justify-center gap-2 py-4">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-emerald-600" />
                        </div>
                        <p className="text-sm font-extrabold text-emerald-800">
                          Pesanan Selesai
                        </p>
                        <p className="text-xs text-emerald-600/70 font-medium">
                          Semua proses telah diselesaikan.
                        </p>
                      </div>
                    );

                  case "cancelled":
                    return (
                      <div className="flex flex-col items-center justify-center gap-2 py-4">
                        <div className="h-12 w-12 rounded-2xl bg-red-100 flex items-center justify-center">
                          <XCircle className="h-5 w-5 text-red-500" />
                        </div>
                        <p className="text-sm font-extrabold text-red-700">
                          Order Dibatalkan
                        </p>
                      </div>
                    );

                  default:
                    return null;
                }
              })()}
            </CardContent>
          </Card>

          {/* ── Document Checklist ── */}
          <DocumentChecklist applicationId={order.id} />

          {/* ── Progress Timeline ── */}
          <Card className={cn(CARD_BASE, RADIUS)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[.18em]">
                Workflow Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 pb-5">
              <div className="relative pl-1">
                {/* Vertical line */}
                <div className="absolute left-[13px] top-3 bottom-3 w-px bg-slate-200 dark:bg-slate-700" />

                <div className="space-y-5">
                  {CONSULTANT_STEPS.map((step, index) => {
                    let stepStatus: "completed" | "current" | "upcoming" | "error" =
                      "upcoming";
                    if (isCancelled && order.status === step.id)
                      stepStatus = "error";
                    else if (isCancelled) stepStatus = "upcoming";
                    else if (
                      index < currentStepIndex ||
                      order.status === "completed"
                    )
                      stepStatus = "completed";
                    else if (index === currentStepIndex)
                      stepStatus = "current";

                    return (
                      <div
                        key={step.id}
                        className="relative flex gap-3.5 items-start"
                      >
                        {/* Node */}
                        <div
                          className={cn(
                            "relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-300 shrink-0",
                            stepStatus === "completed" &&
                              "bg-sky-600 border-sky-600 text-white shadow-sm shadow-sky-200",
                            stepStatus === "current" &&
                              "bg-white border-sky-600 text-sky-600 ring-[3px] ring-sky-100",
                            stepStatus === "upcoming" &&
                              "bg-slate-50 border-slate-200 text-slate-300",
                            stepStatus === "error" &&
                              "bg-red-50 border-red-400 text-red-500",
                          )}
                        >
                          {stepStatus === "completed" && (
                            <Check
                              className="h-3.5 w-3.5"
                              strokeWidth={3}
                            />
                          )}
                          {stepStatus === "current" && (
                            <div className="h-2 w-2 rounded-full bg-sky-600 animate-pulse" />
                          )}
                          {stepStatus === "upcoming" && (
                            <Circle className="h-3 w-3 fill-slate-100 text-transparent" />
                          )}
                          {stepStatus === "error" && (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                        </div>

                        {/* Label */}
                        <div className="pt-0.5 min-w-0">
                          <p
                            className={cn(
                              "text-sm font-bold leading-tight transition-colors",
                              (stepStatus === "completed" ||
                                stepStatus === "current") &&
                                "text-slate-800 dark:text-slate-100",
                              stepStatus === "upcoming" && "text-slate-400",
                              stepStatus === "error" && "text-red-600",
                            )}
                          >
                            {step.label}
                          </p>
                          {stepStatus === "current" && (
                            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                              {step.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Agent Control ── */}
          <AgentControlPanel
            applicationId={order.id}
            currentAgentId={order.assigned_agent_id}
          />
        </aside>

        {/* ========================================================= */}
        {/*  KOLOM KANAN: KEUANGAN + CHAT                             */}
        {/* ========================================================= */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* ── KONTRAK EDITOR / MILESTONE LIST ── */}
          {isEditingContract ? (
            <Card
              className={cn(
                CARD_BASE,
                RADIUS,
                "ring-2 ring-sky-100 relative overflow-hidden",
              )}
            >
              {/* Accent bar kiri */}
              <div className="absolute inset-y-0 left-0 w-1 bg-sky-500 rounded-l-2xl" />

              <CardHeader className="pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center shrink-0">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-extrabold text-slate-800 tracking-tight">
                      Atur Nilai Kontrak &amp; Termin
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Tentukan total biaya dan persentase DP dengan slider.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                {/* Input Harga */}
                <div className="space-y-2 max-w-sm">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[.18em]">
                    Total Biaya Layanan
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-sm group-focus-within:text-sky-600 transition-colors">
                      Rp
                    </div>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={priceEditValue}
                      onChange={(e) =>
                        setPriceEditValue(
                          formatPriceWithCommas(e.target.value),
                        )
                      }
                      placeholder="0"
                      className="pl-12 font-extrabold text-xl rounded-xl border-2 border-slate-200 focus-visible:ring-sky-500/20 focus-visible:border-sky-500 h-14 transition-all"
                    />
                  </div>
                </div>

                {/* Slider DP */}
                <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-200/80 space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[.15em]">
                      Persentase Down Payment
                    </label>
                    <span className="text-sm font-extrabold text-sky-700 bg-sky-50 ring-1 ring-sky-200 rounded-lg px-2.5 py-0.5">
                      {dpPercentage}%
                    </span>
                  </div>

                  <Slider
                    value={[dpPercentage]}
                    onValueChange={(val) => setDpPercentage(val[0])}
                    min={50}
                    max={100}
                    step={10}
                    className="py-2 cursor-pointer"
                  />

                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider px-0.5">
                    <span>Min 50%</span>
                    <span>Lunas 100%</span>
                  </div>

                  {/* Preview Tagihan */}
                  <div className="mt-4 pt-4 border-t border-slate-200/60 grid grid-cols-2 gap-3">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                        DP ({dpPercentage}%)
                      </span>
                      <span className="text-base font-extrabold text-slate-900">
                        {priceEditValue
                          ? formatRupiah(
                              (parseInt(
                                parsePriceFromCommas(priceEditValue),
                              ) *
                                dpPercentage) /
                                100,
                            )
                          : "Rp 0"}
                      </span>
                    </div>
                    {dpPercentage < 100 ? (
                      <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                          Sisa ({100 - dpPercentage}%)
                        </span>
                        <span className="text-base font-extrabold text-slate-900">
                          {priceEditValue
                            ? formatRupiah(
                                (parseInt(
                                  parsePriceFromCommas(priceEditValue),
                                ) *
                                  (100 - dpPercentage)) /
                                  100,
                              )
                            : "Rp 0"}
                        </span>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-100 shadow-sm flex items-center justify-center">
                        <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">
                          Tidak Ada Sisa
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-1">
                  <Button
                    onClick={handleSavePriceAndMilestone}
                    disabled={isUpdating}
                    className="h-12 px-7 font-extrabold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-lg shadow-sky-200/50 active:scale-[.97] transition-all text-sm"
                  >
                    {isUpdating ? (
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    ) : (
                      <SendHorizontal className="h-4 w-4 mr-2" />
                    )}
                    SIMPAN &amp; BUAT TAGIHAN
                  </Button>
                  {order.quoted_price > 0 && (
                    <Button
                      variant="ghost"
                      onClick={() => setIsEditingContract(false)}
                      className="h-12 px-5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                    >
                      Batal
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <AdminMilestoneInvoices
                applicationId={order.id}
                invoices={milestones}
                totalPrice={order.quoted_price}
              />
            </div>
          )}

          {/* ── CHAT ── */}
          <div className="flex-1 flex flex-col min-h-[420px] lg:min-h-[calc(100vh-32rem)] overflow-hidden">
            {currentUserId ? (
              <ChatBoxAdmin
                key={order.id}
                applicationId={order.id}
                initialMessages={initialMessages}
                currentUserId={currentUserId}
                className={cn(
                  "flex-1 flex flex-col min-h-0 w-full",
                  CARD_BASE,
                  RADIUS,
                )}
                title={order.profiles?.full_name || "Tanpa Nama"}
                subtitle={order.services?.name || "Komunikasi resmi klien"}
                onTypingChange={setClientIsTyping}
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* ── MODAL UPLOAD DOKUMEN FINAL ────────────────────────── */}
      <Dialog open={isCompleteModalOpen} onOpenChange={setIsCompleteModalOpen}>
        <DialogContent className="rounded-3xl max-w-md p-0 overflow-hidden border-none shadow-2xl">
          {/* Header hijau */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-8 pt-8 pb-7 text-white">
            <DialogHeader>
              <div className="h-11 w-11 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
                <UploadCloud className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-xl font-extrabold tracking-tight text-white leading-snug">
                Unggah Dokumen
                <br />
                &amp; Serah Terima
              </DialogTitle>
              <DialogDescription className="text-emerald-100/80 text-sm mt-1">
                Upload dokumen final untuk diserahkan ke klien.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-7 space-y-5 bg-white">
            <div className="space-y-2.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[.18em]">
                Pilih Dokumen Final
              </label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) =>
                  setFinalDocument(e.target.files?.[0] || null)
                }
                className="h-14 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 pt-3.5 px-4 file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all cursor-pointer hover:border-emerald-300"
              />
            </div>

            <DialogFooter>
              <Button
                onClick={handleCompleteSubmit}
                disabled={isUpdating}
                className="w-full h-[52px] rounded-xl font-extrabold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200/50 active:scale-[.97] transition-all text-sm"
              >
                {isUpdating ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-[18px] w-[18px]" />
                    UPLOAD &amp; SELESAI
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
