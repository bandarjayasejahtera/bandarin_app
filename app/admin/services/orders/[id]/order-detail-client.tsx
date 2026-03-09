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
  ChevronRight, Zap, Building2, BadgeCheck, Sparkles, RefreshCw, ExternalLink, Plus, Users
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
import { AdminMilestoneInvoices } from "@/components/payment/milestone-invoices-card";
import { ensureMilestoneInvoices, getMilestoneInvoices } from "@/actions/milestone-invoice-actions";

type OrderType = any;
type MessageType = any;

interface OrderDetailClientProps {
  initialOrder: OrderType;
  initialMessages: MessageType[];
  initialCurrentUserId?: string;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);
}

function formatPriceWithCommas(value: any) {
  const n = typeof value === "string" ? parseInt(value.replace(/\D/g, ""), 10) || 0 : Number(value) || 0;
  return n.toLocaleString("id-ID");
}

function parsePriceFromCommas(str: string) {
  const digits = str.replace(/\D/g, "");
  return digits === "" ? "" : String(parseInt(digits, 10));
}

const RADIUS = "rounded-2xl";
const CARD_BASE = "border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_1px_3px_rgba(0,0,0,.04)]";

const STATUS_THEME: Record<string, any> = {
  draft: { bg: "bg-slate-50", text: "text-slate-600", ring: "ring-slate-200", accent: "bg-slate-500", icon: "text-slate-500" },
  verification: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200", accent: "bg-amber-500", icon: "text-amber-500" },
  payment: { bg: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-200", accent: "bg-violet-500", icon: "text-violet-500" },
  process: { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200", accent: "bg-sky-500", icon: "text-sky-500" },
  review: { bg: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-200", accent: "bg-indigo-500", icon: "text-indigo-500" },
  completed: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", accent: "bg-emerald-500", icon: "text-emerald-500" },
  cancelled: { bg: "bg-red-50", text: "text-red-600", ring: "ring-red-200", accent: "bg-red-500", icon: "text-red-500" },
};

const CONSULTANT_STEPS = [
  { id: "draft", label: "Incoming", description: "Data awal klien", icon: FileText },
  { id: "verification", label: "Verifikasi Berkas", description: "Cek kelengkapan dokumen", icon: BadgeCheck },
  { id: "payment", label: "Pembayaran", description: "Menunggu DP / Termin", icon: DollarSign },
  { id: "process", label: "Proses Pengerjaan", description: "Pengerjaan dokumen/berkas", icon: Building2 },
  { id: "review", label: "Final Review", description: "Validasi hasil akhir", icon: ShieldCheck },
  { id: "completed", label: "Selesai", description: "Serah terima ke klien", icon: CheckCircle2 },
];

const DEFAULT_POSITIONS = ["PUPR", "ATR/BPN", "OSS", "Dinas Teknis", "Notaris"];

function getTheme(status: string) { return STATUS_THEME[status] ?? STATUS_THEME.draft; }

function StatusBadge({ status }: { status: string }) {
  const t = getTheme(status);
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg ring-1", t.bg, t.text, t.ring)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", t.accent)} />
      {status.replace("_", " ")}
    </span>
  );
}

function PrimaryActionButton({ onClick, loading, label, icon: Icon, colorClass = "bg-sky-600 hover:bg-sky-700", disabled = false }: any) {
  return (
    <Button disabled={loading || disabled} onClick={onClick} className={cn("w-full h-[52px] text-sm font-extrabold text-white rounded-xl shadow-lg active:scale-[.97] transition-all", colorClass, disabled && "opacity-50 cursor-not-allowed active:scale-100")}>
      {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <><Icon className="mr-2 h-[18px] w-[18px]" />{label}</>}
    </Button>
  );
}

function InfoBanner({ children, variant = "default" }: any) {
  const styles: any = { default: "bg-slate-50 border-slate-200 text-slate-700", warning: "bg-amber-50 border-amber-200 text-amber-800", success: "bg-emerald-50 border-emerald-200 text-emerald-800" };
  return <div className={cn("rounded-xl border p-3.5 text-xs font-medium", styles[variant])}>{children}</div>;
}

export default function OrderDetailClient({ initialOrder, initialMessages, initialCurrentUserId = "" }: OrderDetailClientProps) {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState(initialCurrentUserId);
  const [order, setOrder] = useState(initialOrder);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [clientIsTyping, setClientIsTyping] = useState(false);

  const [isEditingContract, setIsEditingContract] = useState(!initialOrder.quoted_price || initialOrder.quoted_price <= 0);
  const [priceEditValue, setPriceEditValue] = useState(initialOrder.quoted_price ? formatPriceWithCommas(initialOrder.quoted_price) : "");
  const [dpPercentage, setDpPercentage] = useState(50);
  const [milestones, setMilestones] = useState<any[]>([]);

  // State Posisi Penanganan
  const [subStatus, setSubStatus] = useState<string>(order.sub_status || "");
  const [customPositionInput, setCustomPositionInput] = useState("");
  const [dynamicPositions, setDynamicPositions] = useState<string[]>([]);
  
  // State untuk Modal Assign Agent & Posisi
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<string | null>(null);
  const [agentsList, setAgentsList] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);

  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [finalDocument, setFinalDocument] = useState<File | null>(null);
  
  const [draftDocument, setDraftDocument] = useState<File | null>(null);
  const [isUploadingDraft, setIsUploadingDraft] = useState(false);

  const theme = useMemo(() => getTheme(order.status), [order.status]);
  const currentStepIndex = CONSULTANT_STEPS.findIndex((s) => s.id === order.status);
  const isCancelled = order.status === "cancelled";

  useEffect(() => {
    const combined = new Set(DEFAULT_POSITIONS);
    if (order.sub_status && !DEFAULT_POSITIONS.includes(order.sub_status)) {
      combined.add(order.sub_status);
    }
    setDynamicPositions(Array.from(combined));
  }, [order.sub_status]);

  const sendSystemNotification = useCallback((message: string) => {
    toast.info(`Notifikasi: ${message}`, { duration: 4000 });
  }, []);

  const fetchInvoices = useCallback(async () => {
    const res = await getMilestoneInvoices(order.id);
    if (res.success) setMilestones(res.invoices);
  }, [order.id]);

  useEffect(() => {
    if (initialCurrentUserId) setCurrentUserId(initialCurrentUserId);
    else supabase.auth.getUser().then(({ data: { user } }) => { if (user) setCurrentUserId(user.id); });
    fetchInvoices();
  }, [supabase, initialCurrentUserId, fetchInvoices]);

  useEffect(() => {
    const channel = supabase.channel(`order-room-${order.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "applications", filter: `id=eq.${order.id}` }, (payload) => setOrder((prev: any) => ({ ...prev, ...payload.new })))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "invoices", filter: `application_id=eq.${order.id}` }, (payload) => {
        setMilestones((prev) => prev.map((m) => (m.id === payload.new.id ? { ...m, ...payload.new } : m)));
        router.refresh();
      })
      .subscribe((status) => setIsConnected(status === "SUBSCRIBED"));
    return () => { supabase.removeChannel(channel); };
  }, [order.id, supabase, router]);

  // Fungsi untuk memuat daftar agent dari tabel AGENTS
  const fetchAgents = async () => {
    setIsLoadingAgents(true);
    const { data, error } = await supabase
      .from('agents')
      .select('id, name, agency_name, specialization')
      .eq('status', 'active') // Hanya tampilkan agent aktif
      .order('name', { ascending: true });
      
    if (data) setAgentsList(data);
    if (error) toast.error("Gagal memuat daftar agent.");
    setIsLoadingAgents(false);
  };

  // Handler saat posisi diklik (Buka Pop Up Assign Agent)
  const handlePositionClick = (position: string) => {
    setPendingPosition(position);
    setSelectedAgentId(order.assigned_agent_id || "unassigned");
    setIsAssignModalOpen(true);
    if (agentsList.length === 0) {
      fetchAgents();
    }
  };

  const handleAddCustomPosition = () => {
    if (!customPositionInput.trim()) return;
    const newPos = customPositionInput.trim();
    if (!dynamicPositions.includes(newPos)) {
      setDynamicPositions(prev => [...prev, newPos]);
    }
    handlePositionClick(newPos);
    setCustomPositionInput("");
  };

  // Eksekusi Simpan Posisi & Agent ke DB
  const handleConfirmPositionAndAgent = async () => {
    if (!pendingPosition) return;
    setIsUpdating(true);
    
    const targetAgentId = selectedAgentId === "unassigned" ? null : selectedAgentId;
    
    const { error } = await supabase
      .from("applications")
      .update({ 
        sub_status: pendingPosition,
        assigned_agent_id: targetAgentId 
      })
      .eq("id", order.id);

    if (error) {
      toast.error("Gagal mengupdate posisi & menugaskan agent.");
    } else {
      setSubStatus(pendingPosition);
      setOrder((prev: any) => ({ 
        ...prev, 
        sub_status: pendingPosition, 
        assigned_agent_id: targetAgentId 
      }));
      toast.success(`Berkas di posisi ${pendingPosition} dengan penugasan diperbarui.`);
      sendSystemNotification(`Posisi berkas diupdate ke: ${pendingPosition}`);
      setIsAssignModalOpen(false);
      setPendingPosition(null);
      router.refresh();
    }
    setIsUpdating(false);
  };

  // Handler Ganti Status (Workflow Utama)
  const handleNextAction = useCallback(async (nextStatus: string) => {
    if (nextStatus === "payment" && (!order.quoted_price || order.quoted_price <= 0)) {
      toast.error("Atur & simpan Nilai Kontrak terlebih dahulu.");
      setIsEditingContract(true);
      return;
    }
    if (nextStatus === "process") {
      const dpInvoice = milestones.find((m) => m.milestone_key?.toLowerCase() === "dp" || m.percentage >= 50);
      const isPaid = dpInvoice?.status?.toLowerCase() === "paid" || dpInvoice?.status?.toLowerCase() === "settled";
      if (!isPaid) {
        toast.error("Pastikan DP sudah dilunasi klien sebelum memproses.");
        return;
      }
    }
    
    setIsUpdating(true);
    const prev = order.status;
    setOrder((p: any) => ({ ...p, status: nextStatus }));
    const { error } = await supabase.from("applications").update({ status: nextStatus }).eq("id", order.id);
    
    if (error) { 
      setOrder((p: any) => ({ ...p, status: prev })); 
      toast.error("Gagal update status."); 
    } else { 
      toast.success("Status berhasil diperbarui."); 
      router.refresh(); 
      if (nextStatus === "process") sendSystemNotification("Pesanan sedang dalam pengerjaan.");
      if (nextStatus === "review") sendSystemNotification("Pengerjaan selesai, masuk ke tahap Final Review.");
    }
    setIsUpdating(false);
  }, [order, milestones, supabase, router, sendSystemNotification]);

  const handleManualSync = async () => {
    setIsUpdating(true);
    await fetchInvoices();
    router.refresh();
    setIsUpdating(false);
    toast.success("Status disinkronkan.");
  };

  const handleSavePriceAndMilestone = useCallback(async () => {
    const cleanPrice = parsePriceFromCommas(priceEditValue);
    const numericPrice = parseInt(cleanPrice, 10);
    if (!numericPrice || numericPrice <= 0 || isNaN(numericPrice)) return toast.error("Masukkan nominal valid.");
    
    setIsUpdating(true);
    try {
      const res1 = await updateOrderStatusAction(order.id, { quoted_price: numericPrice });
      if (res1.error) throw new Error(res1.error);
      const res2 = await ensureMilestoneInvoices(order.id, numericPrice, dpPercentage);
      if (!res2.success) throw new Error(res2.error);
      setOrder((prev: any) => ({ ...prev, quoted_price: numericPrice }));
      setIsEditingContract(false);
      await fetchInvoices();
      toast.success("Kontrak disimpan.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan.");
    } finally {
      setIsUpdating(false);
    }
  }, [priceEditValue, dpPercentage, order.id, router, fetchInvoices]);

  const handleDraftUpload = async () => {
    if (!draftDocument) return toast.error("Pilih dokumen draft.");
    setIsUploadingDraft(true);
    try {
      const fileExt = draftDocument.name.split(".").pop();
      const fileName = `draft_${order.id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(fileName, draftDocument);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("documents").getPublicUrl(fileName);
      const currentDocs = order.documents_url || [];
      await supabase.from("applications").update({ documents_url: [...currentDocs, data.publicUrl] }).eq("id", order.id);
      toast.success("Draft diunggah.");
      sendSystemNotification("Dokumen progress (draft) baru telah diunggah.");
      setDraftDocument(null);
      router.refresh();
    } catch (e) {
      toast.error("Gagal mengunggah.");
    } finally {
      setIsUploadingDraft(false);
    }
  };

  const handleCompleteSubmit = useCallback(async () => {
    if (!finalDocument) return toast.error("Unggah dokumen hasil.");
    setIsUpdating(true);
    try {
      const fileExt = finalDocument.name.split(".").pop();
      const fileName = `final_doc_${order.id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(fileName, finalDocument);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("documents").getPublicUrl(fileName);
      const { error: updateError } = await supabase.from("applications").update({ status: "completed", final_document_url: data.publicUrl }).eq("id", order.id);
      if (updateError) throw updateError;
      setIsCompleteModalOpen(false);
      setOrder((prev: any) => ({ ...prev, status: "completed", final_document_url: data.publicUrl }));
      toast.success("Pesanan selesai.");
      sendSystemNotification("Pesanan Anda telah selesai! Dokumen final sudah dapat diunduh.");
      router.refresh();
    } catch {
      toast.error("Gagal menyelesaikan pesanan.");
    } finally {
      setIsUpdating(false);
    }
  }, [finalDocument, order.id, supabase, router, sendSystemNotification]);

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <Link href="/admin/services/orders">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4 text-slate-600" />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 font-medium">
              <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{format(new Date(order.created_at), "dd MMM yyyy", { locale: idLocale })}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 h-full min-h-0">
        
        {/* KIRI: Action Center / Progress */}
        <aside className="lg:col-span-4 flex flex-col gap-5 w-full">
          <Card className={cn(CARD_BASE, RADIUS, "overflow-hidden relative flex flex-col")}>
            <div className={cn("absolute inset-x-0 top-0 h-1", theme.accent)} />
            <CardHeader className="pt-6 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className={cn("h-4 w-4", theme.icon)} />
                  <CardTitle className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[.18em]">Action Center</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-5 flex-1 flex flex-col">
              {(() => {
                const dpInvoice = milestones.find((m) => m.milestone_key?.toLowerCase() === "dp" || m.percentage >= 50);
                const rawStatus = dpInvoice?.status?.toLowerCase();
                const isDpPaid = rawStatus === "paid" || rawStatus === "settled";

                switch (order.status) {
                  case "draft":
                    return <PrimaryActionButton onClick={() => handleNextAction("verification")} loading={isUpdating} label="MULAI VERIFIKASI BERKAS" icon={FileText} colorClass="bg-sky-600 hover:bg-sky-700" />;
                  
                  case "verification":
                    return <PrimaryActionButton onClick={() => handleNextAction("payment")} loading={isUpdating} label="LANJUT KE PEMBAYARAN" icon={DollarSign} colorClass="bg-amber-600 hover:bg-amber-700" />;
                  
                  case "payment":
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between bg-slate-100/50 p-3 rounded-lg border border-slate-200">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Status Sistem Tagihan DP:</p>
                            <p className={cn("text-sm font-black mt-0.5", isDpPaid ? "text-emerald-600" : "text-amber-600")}>
                              {dpInvoice?.status?.toUpperCase() || "BELUM DIBUAT"}
                            </p>
                          </div>
                          <Button size="icon" variant="outline" className="h-8 w-8 rounded-full bg-white" onClick={handleManualSync} disabled={isUpdating}>
                            <RefreshCw className={cn("h-3.5 w-3.5", isUpdating && "animate-spin")} />
                          </Button>
                        </div>
                        {isDpPaid ? (
                          <>
                            <InfoBanner variant="success">
                              <div className="flex items-start gap-2.5">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                <div><p className="font-bold text-sm">DP Lunas Diterima</p><p className="mt-0.5 opacity-80">Anda sudah dapat memulai proses pengerjaan.</p></div>
                              </div>
                            </InfoBanner>
                            <PrimaryActionButton onClick={() => handleNextAction("process")} loading={isUpdating} label="MULAI PENGERJAAN" icon={Briefcase} colorClass="bg-emerald-600 hover:bg-emerald-700" />
                          </>
                        ) : (
                          <>
                            <InfoBanner variant="warning">
                              <div className="flex items-start gap-2.5">
                                <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                                <div><p className="font-bold text-sm">Menunggu Pembayaran DP</p><p className="mt-0.5 opacity-80">Sistem menunggu klien melunasi tagihan Termin Pertama.</p></div>
                              </div>
                            </InfoBanner>
                            <PrimaryActionButton loading={isUpdating} disabled={true} label="MENUNGGU KLIEN..." icon={Clock} colorClass="bg-slate-300 text-slate-500" />
                          </>
                        )}
                      </div>
                    );

                  case "process":
                    return (
                      <div className="flex flex-col h-full space-y-6">
                        {/* UPDATE POSISI PENANGANAN BERKAS (DINAMIS & ASSIGN AGENT) */}
                        <div className="space-y-3">
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[.18em]">Posisi Penanganan Berkas</p>
                          
                          <div className="flex flex-wrap gap-2">
                            {dynamicPositions.map((pos) => (
                              <button 
                                key={pos} 
                                onClick={() => handlePositionClick(pos)} 
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border", 
                                  subStatus === pos ? "bg-sky-600 text-white border-sky-600 shadow-sm ring-2 ring-sky-200" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-sky-50 hover:text-sky-700"
                                )}
                              >
                                {pos}
                              </button>
                            ))}
                          </div>

                          {/* Input Posisi Kustom */}
                          <div className="flex items-center gap-2 mt-2">
                            <Input 
                              placeholder="Tambah posisi lain..." 
                              value={customPositionInput}
                              onChange={(e) => setCustomPositionInput(e.target.value)}
                              className="h-8 text-xs text-slate-600 rounded-lg flex-1"
                            />
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              onClick={handleAddCustomPosition}
                              className="h-8 text-xs font-bold px-3 rounded-lg"
                            >
                              <Plus className="h-3 w-3 mr-1" /> Add
                            </Button>
                          </div>
                        </div>

                        {/* UPLOAD DRAFT SEMENTARA */}
                        <div className="space-y-2.5 pt-4 border-t border-slate-100">
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[.18em]">Unggah Dokumen Draft</p>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Input type="file" accept=".pdf,.jpg,.png" onChange={(e) => setDraftDocument(e.target.files?.[0] || null)} className="flex-1 text-xs cursor-pointer h-9" />
                            <Button size="sm" onClick={handleDraftUpload} disabled={isUploadingDraft || !draftDocument} className="bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold shrink-0 h-9">
                              {isUploadingDraft ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <UploadCloud className="h-3.5 w-3.5 mr-1" />}
                              Upload
                            </Button>
                          </div>
                        </div>

                        <div className="flex-1 min-h-[40px]"></div>

                        {/* TOMBOL REVIEW DIPISAH DI BAWAH */}
                        <div className="pt-5 border-t border-slate-100">
                          <InfoBanner variant="default">
                            <p className="text-xs text-slate-500 mb-2">Jika semua tahapan pengerjaan instansi/draft telah tuntas, klik tombol di bawah untuk meminta pelunasan akhir.</p>
                          </InfoBanner>
                          <div className="mt-3">
                            <PrimaryActionButton 
                              onClick={() => handleNextAction("review")} 
                              loading={isUpdating} 
                              label="PROSES SELESAI → REVIEW" 
                              icon={ShieldCheck} 
                              colorClass="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200/50" 
                            />
                          </div>
                        </div>
                      </div>
                    );

                  case "review":
                    const finalInvoice = milestones.find((m) => m.milestone_key?.toLowerCase() === "final" || m.milestone_key?.toLowerCase() === "stage2" || m.percentage < 50);
                    const rawFinalStatus = finalInvoice?.status?.toLowerCase();
                    const isFinalPaid = !finalInvoice || rawFinalStatus === "paid" || rawFinalStatus === "settled";

                    return (
                      <div className="space-y-4">
                        {!isFinalPaid ? (
                          <>
                            <InfoBanner variant="warning">
                              <div className="flex items-start gap-2.5">
                                <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                                <div><p className="font-bold text-sm">Menunggu Pelunasan</p><p className="mt-0.5 opacity-80">Sistem menunggu klien melunasi tagihan Termin Akhir.</p></div>
                              </div>
                            </InfoBanner>
                            <PrimaryActionButton loading={isUpdating} disabled={true} label="MENUNGGU PELUNASAN..." icon={Clock} colorClass="bg-slate-300 text-slate-500" />
                          </>
                        ) : (
                          <>
                            <InfoBanner variant="success">
                              <div className="flex items-start gap-2.5">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                <div><p className="font-bold text-sm">Pelunasan Diterima</p><p className="mt-0.5 opacity-80">Pembayaran lunas. Serahkan dokumen final.</p></div>
                              </div>
                            </InfoBanner>
                            <PrimaryActionButton onClick={() => setIsCompleteModalOpen(true)} loading={isUpdating} label="SELESAIKAN PESANAN" icon={CheckCircle2} colorClass="bg-emerald-600 hover:bg-emerald-700" />
                          </>
                        )}
                      </div>
                    );

                  case "completed":
                    return (
                      <div className="flex flex-col items-center justify-center gap-2 py-6">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center"><Sparkles className="h-5 w-5 text-emerald-600" /></div>
                        <p className="text-sm font-extrabold text-emerald-800">Pesanan Selesai</p>
                      </div>
                    );

                  case "cancelled":
                    return (
                      <div className="flex flex-col items-center justify-center gap-2 py-6">
                        <div className="h-12 w-12 rounded-2xl bg-red-100 flex items-center justify-center"><XCircle className="h-5 w-5 text-red-500" /></div>
                        <p className="text-sm font-extrabold text-red-700">Order Dibatalkan</p>
                      </div>
                    );

                  default: return null;
                }
              })()}
            </CardContent>
          </Card>
        </aside>

        {/* KANAN: Tabs untuk Chat, Keuangan, Dokumen, Catatan */}
        <div className="lg:col-span-8 flex flex-col min-h-0 w-full">
          <Tabs defaultValue="chat" className="flex flex-col h-full w-full">
            <TabsList className="w-full justify-start rounded-xl mb-4 bg-slate-100/60 p-1 overflow-x-auto whitespace-nowrap">
              <TabsTrigger value="chat" className="rounded-lg font-bold px-3 text-xs sm:text-sm">💬 Chat Klien</TabsTrigger>
              <TabsTrigger value="finance" className="rounded-lg font-bold px-3 text-xs sm:text-sm">💳 Keuangan</TabsTrigger>
              <TabsTrigger value="documents" className="rounded-lg font-bold px-3 text-xs sm:text-sm">🗂️ Dokumen</TabsTrigger>
              <TabsTrigger value="internal" className="rounded-lg font-bold px-3 text-xs sm:text-sm text-amber-700">🔒 Catatan Internal</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="m-0 flex-1 flex flex-col min-h-[400px]">
              {currentUserId ? (
                <ChatBoxAdmin key={order.id} applicationId={order.id} initialMessages={initialMessages} currentUserId={currentUserId} className={cn("flex-1 w-full h-full flex flex-col", CARD_BASE, RADIUS, "p-0 overflow-hidden")} title={order.profiles?.full_name || "Tanpa Nama"} subtitle={order.services?.name || "Komunikasi resmi klien"} onTypingChange={setClientIsTyping} />
              ) : (
                <Card className={cn(CARD_BASE, RADIUS, "flex items-center justify-center min-h-[260px]")}><CardContent className="text-center py-10"><p className="text-sm font-medium text-slate-500">Data akun admin belum siap.</p></CardContent></Card>
              )}
            </TabsContent>

            <TabsContent value="finance" className="m-0 space-y-4">
              {isEditingContract ? (
                <Card className={cn(CARD_BASE, RADIUS, "ring-2 ring-sky-100 overflow-hidden relative")}>
                  <div className="absolute inset-y-0 left-0 w-1 bg-sky-500" />
                  <CardHeader className="pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center shrink-0"><Receipt className="h-5 w-5" /></div>
                      <div><CardTitle className="text-base font-extrabold">Atur Nilai Kontrak & Termin</CardTitle><CardDescription className="text-xs mt-0.5">Tentukan total biaya dan persentase DP.</CardDescription></div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="space-y-2 max-w-sm">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[.18em]">Total Biaya Layanan</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-sm">Rp</div>
                        <Input type="text" inputMode="numeric" value={priceEditValue} onChange={(e) => setPriceEditValue(formatPriceWithCommas(e.target.value))} placeholder="0" className="pl-12 font-extrabold text-xl rounded-xl h-14" />
                      </div>
                    </div>
                    <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-200/80 space-y-4">
                      <div className="flex justify-between items-center"><label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[.15em]">Persentase DP</label><span className="text-sm font-extrabold text-sky-700 bg-sky-50 ring-1 ring-sky-200 rounded-lg px-2.5 py-0.5">{dpPercentage}%</span></div>
                      <Slider value={[dpPercentage]} onValueChange={(val) => setDpPercentage(val[0])} min={50} max={100} step={10} className="py-2 cursor-pointer" />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <Button onClick={handleSavePriceAndMilestone} disabled={isUpdating} className="h-12 px-7 font-extrabold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-lg active:scale-[.97] transition-all text-sm">{isUpdating ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <SendHorizontal className="h-4 w-4 mr-2" />} SIMPAN & BUAT TAGIHAN</Button>
                      {order.quoted_price > 0 && <Button variant="ghost" onClick={() => setIsEditingContract(false)} className="text-xs">Batal</Button>}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <AdminMilestoneInvoices applicationId={order.id} invoices={milestones} totalPrice={order.quoted_price} />
              )}
            </TabsContent>

            <TabsContent value="documents" className="m-0 space-y-4">
              <DocumentChecklist applicationId={order.id} />
              {Array.isArray(order.documents_url) && order.documents_url.length > 0 && (
                <Card className={cn(CARD_BASE, RADIUS)}>
                  <CardHeader className="pb-3"><CardTitle className="text-xs font-black uppercase tracking-[.18em] text-slate-400">Riwayat Dokumen Draft</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {order.documents_url.map((url: string, idx: number) => (
                      <div key={url} className="flex items-center justify-between rounded-lg border border-slate-200/80 px-3 py-2 text-xs">
                        <span className="truncate max-w-[70%]">Draft {idx + 1}</span>
                        <Button asChild variant="outline" size="sm" className="h-7 px-2 text-[11px]"><a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-1" /> Buka</a></Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="internal" className="m-0">
              <Card className={cn(CARD_BASE, RADIUS)}>
                <CardHeader className="pb-3"><CardTitle className="text-xs font-black uppercase tracking-[.18em] text-slate-400 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-amber-500" />Catatan Internal Admin</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Textarea rows={5} className="text-xs" placeholder="Tulis catatan rahasia untuk tim..." />
                  <div className="flex justify-end"><Button size="sm" variant="outline" className="text-xs cursor-not-allowed opacity-60">Simpan Catatan</Button></div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* --- MODAL ASSIGN AGENT & POSISI BERKAS --- */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="rounded-3xl max-w-md p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-sky-600 px-6 pt-6 pb-5 text-white">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <DialogTitle className="text-lg font-extrabold text-white">Posisi & Penugasan</DialogTitle>
              </div>
              <DialogDescription className="text-sky-100/90 text-sm mt-2">
                Pindahkan berkas ke <strong className="text-white">{pendingPosition}</strong> dan tentukan siapa Agent yang bertanggung jawab di tahap ini.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-5 bg-white">
            <div className="space-y-2.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[.18em]">Pilih Agent (PIC)</label>
              {isLoadingAgents ? (
                <div className="h-12 flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin text-sky-500" /> Memuat daftar agent...
                </div>
              ) : (
                <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                  <SelectTrigger className="h-12 rounded-xl border-slate-200">
                    <SelectValue placeholder="Pilih Agent penanggung jawab..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="unassigned">-- Tanpa Agent Khusus --</SelectItem>
                    {agentsList.map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name} {agent.agency_name ? `- ${agent.agency_name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button variant="ghost" onClick={() => setIsAssignModalOpen(false)} className="rounded-xl font-bold text-slate-500">
                Batal
              </Button>
              <Button 
                onClick={handleConfirmPositionAndAgent} 
                disabled={isUpdating || isLoadingAgents} 
                className="rounded-xl font-extrabold bg-sky-600 hover:bg-sky-700 h-10 px-6 shadow-lg shadow-sky-200/50"
              >
                {isUpdating ? <Loader2 className="animate-spin h-4 w-4" /> : "Simpan Penugasan"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- MODAL UPLOAD FINAL DOCUMENT --- */}
      <Dialog open={isCompleteModalOpen} onOpenChange={setIsCompleteModalOpen}>
        <DialogContent className="rounded-3xl max-w-md p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-8 pt-8 pb-7 text-white">
            <DialogHeader>
              <div className="h-11 w-11 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4"><UploadCloud className="h-5 w-5 text-white" /></div>
              <DialogTitle className="text-xl font-extrabold tracking-tight text-white leading-snug">Unggah Dokumen<br />& Serah Terima</DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-7 space-y-5 bg-white">
            <div className="space-y-2.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[.18em]">Pilih Dokumen Final</label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFinalDocument(e.target.files?.[0] || null)} className="h-14 rounded-xl border-2 border-dashed bg-slate-50 pt-3.5 px-4 cursor-pointer" />
            </div>
            <DialogFooter>
              <Button onClick={handleCompleteSubmit} disabled={isUpdating} className="w-full h-[52px] rounded-xl font-extrabold bg-emerald-600 hover:bg-emerald-700">
                {isUpdating ? <Loader2 className="animate-spin h-5 w-5" /> : <><CheckCircle2 className="mr-2 h-[18px] w-[18px]" /> UPLOAD & SELESAI</>}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}