// app/admin/services/orders/[id]/order-detail-client.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, CheckCircle2, AlertCircle, 
  User, Phone, DollarSign, Briefcase, 
  MoreVertical, Clock, ShieldCheck,
  Check, Circle, XCircle, Edit2, SendHorizontal, 
  Receipt, Play, FileText, Loader2, UploadCloud // <-- UploadCloud sudah ditambahkan
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

// Utils
import { toast } from "sonner";
import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/applicationSchema/utils";
import { updateOrderStatusAction } from "@/actions/admin/order-actions";

type OrderType = any;
type MessageType = any;

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);
}

function formatPriceWithCommas(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? parseInt(value.replace(/\D/g, ""), 10) || 0 : Number(value) || 0;
  return n.toLocaleString("id-ID");
}

function parsePriceFromCommas(str: string): string {
  const digits = str.replace(/\D/g, "");
  return digits === "" ? "" : String(parseInt(digits, 10));
}

interface OrderDetailClientProps {
  initialOrder: OrderType;
  initialMessages: MessageType[];
  initialCurrentUserId?: string;
}

// Definisi Tahapan Timeline
const TIMELINE_STEPS = [
  { id: 'pending', label: 'Pesanan Masuk', description: 'Menunggu review admin' },
  { id: 'quoted', label: 'Menunggu Pembayaran', description: 'Penawaran harga telah dikirim' },
  { id: 'paid', label: 'Pembayaran Berhasil', description: 'Dana telah diterima oleh sistem' },
  { id: 'process', label: 'Sedang Diproses', description: 'Pengerjaan sedang berlangsung' },
  { id: 'review', label: 'Review Dokumen', description: 'Validasi hasil akhir' },
  { id: 'completed', label: 'Selesai', description: 'Layanan tuntas' },
];

import { AgentControlPanel } from "@/components/admin/agent-control-panel";

export default function OrderDetailClient({ initialOrder, initialMessages, initialCurrentUserId = "" }: OrderDetailClientProps) {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string>(initialCurrentUserId);

  const [order, setOrder] = useState(initialOrder);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [clientIsTyping, setClientIsTyping] = useState(false);
  
  // State untuk Pop-up Quotation
  const [priceEditValue, setPriceEditValue] = useState("");
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);

  // --- STATE BARU: Untuk Modal Selesaikan Pesanan & Upload ---
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [finalDocument, setFinalDocument] = useState<File | null>(null);

  useEffect(() => {
    if (initialCurrentUserId) {
      setCurrentUserId(initialCurrentUserId);
      return;
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, [supabase, initialCurrentUserId]);

  // Realtime: only order updates
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
        (payload) => {
          setOrder((prev: any) => ({ ...prev, ...payload.new }));
          toast.info("Status pesanan diperbarui otomatis.");
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setIsConnected(true);
        if (status === "CHANNEL_ERROR") {
          setIsConnected(false);
          toast.error("Gagal terhubung ke Live Chat.");
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id, supabase]);

  // --- SMART ACTION HANDLER ---
  const handleNextAction = async (nextStatus: string) => {
    if (nextStatus === 'quoted') {
      setPriceEditValue(formatPriceWithCommas(order.quoted_price || 0));
      setIsQuotationModalOpen(true);
      return;
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
      toast.error("Gagal update status");
    } else {
      toast.success(`Pesanan dilanjutkan ke tahap berikutnya.`);
      router.refresh(); 
    }
    setIsUpdating(false);
  };

  const handleQuotationSubmit = async () => {
    const cleanPrice = parsePriceFromCommas(priceEditValue);
    const numericPrice = parseInt(cleanPrice, 10);

    if (!numericPrice || numericPrice <= 0 || isNaN(numericPrice)) {
      toast.error("Masukkan nominal harga yang valid!");
      return;
    }

    setIsUpdating(true);

    try {
      const result = await updateOrderStatusAction(order.id, { 
        quoted_price: numericPrice, 
        status: 'quoted'
      });

      if (result.error) {
        toast.error(`Gagal mengirim penawaran: ${result.error}`);
      } else {
        setIsQuotationModalOpen(false);
        setOrder((prev: any) => ({ 
            ...prev, 
            quoted_price: numericPrice, 
            status: "quoted" 
        }));
        toast.success("Penawaran Harga Berhasil Dikirim!");
        router.refresh();
      }
    } catch (err) {
      toast.error("Terjadi kesalahan pada sistem.");
    } finally {
      setIsUpdating(false);
    }
  };

  // --- HANDLER BARU: Upload Dokumen Final & Selesai ---
  const handleCompleteSubmit = async () => {
    if (!finalDocument) {
      toast.error("Harap unggah dokumen hasil terlebih dahulu!");
      return;
    }

    setIsUpdating(true);

    try {
      // 1. Upload File ke Supabase Storage (Asumsi bucket bernama 'documents')
      const fileExt = finalDocument.name.split('.').pop();
      const fileName = `final_doc_order_${order.id}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, finalDocument);

      if (uploadError) throw uploadError;

      // 2. Dapatkan URL Publik dari dokumen yang diunggah
      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      const documentUrl = publicUrlData.publicUrl;

      // 3. Update Database: Ubah status & simpan link dokumen
      const { error: updateError } = await supabase
        .from("applications")
        .update({ 
           status: 'completed',
           final_document_url: documentUrl
        })
        .eq("id", order.id);

      if (updateError) throw updateError;

      // 4. Sukses: Tutup modal & update UI
      setIsCompleteModalOpen(false);
      setOrder((prev: any) => ({ 
          ...prev, 
          status: "completed",
          final_document_url: documentUrl 
      }));
      toast.success("Pesanan Selesai & Dokumen Berhasil Diunggah!");
      router.refresh();

    } catch (err: any) {
      console.error(err);
      toast.error("Gagal menyelesaikan pesanan. Cek koneksi & storage.");
    } finally {
      setIsUpdating(false);
    }
  };

  // --- HELPER UI ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'quoted': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'process': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'review': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getCurrentStepIndex = (status: string) => {
    return TIMELINE_STEPS.findIndex(s => s.id === status);
  };
  
  const currentStepIndex = getCurrentStepIndex(order.status);
  const isCancelled = order.status === 'cancelled';

  // --- RENDER SMART ACTION PANEL ---
  const renderSmartAction = () => {
    switch(order.status) {
      case 'pending':
        return (
          <Button 
            disabled={isUpdating}
            onClick={() => handleNextAction('quoted')}
            className="w-full h-14 text-base font-black bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-[0_8px_30px_rgb(37,99,235,0.2)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.4)] transition-all active:scale-95 group"
          >
            {isUpdating ? <Loader2 className="animate-spin h-5 w-5" /> : (
              <><DollarSign className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" /> BUAT PENAWARAN HARGA</>
            )}
          </Button>
        );
      case 'quoted':
        return (
          <div className="space-y-3">
            <div className="bg-amber-50/80 border border-amber-200/60 rounded-2xl p-4 flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-800">Menunggu Pembayaran Klien</p>
                  <p className="text-xs text-amber-700/80 mt-1 leading-relaxed">Sistem otomatis lanjut ke <strong className="font-bold">Proses Pengerjaan</strong> saat webhook Xendit menerima dana.</p>
                </div>
            </div>
            {/* Opsi Bypass Manual */}
            <Button 
              variant="outline" 
              disabled={isUpdating}
              onClick={() => handleNextAction('paid')}
              className="w-full h-12 rounded-xl border-dashed border-2 border-slate-300 text-slate-500 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 transition-all font-bold"
            >
               Tandai Lunas Manual
            </Button>
          </div>
        );
      case 'paid':
        return (
          <Button 
            disabled={isUpdating}
            onClick={() => handleNextAction('process')}
            className="w-full h-14 text-base font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-[0_8px_30px_rgb(79,70,229,0.2)] hover:shadow-[0_8px_30px_rgb(79,70,229,0.4)] transition-all active:scale-95 group"
          >
            {isUpdating ? <Loader2 className="animate-spin h-5 w-5" /> : (
              <><Play className="mr-2 h-5 w-5 fill-current group-hover:scale-110 transition-transform" /> MULAI PENGERJAAN</>
            )}
          </Button>
        );
      case 'process':
        return (
          <Button 
            disabled={isUpdating}
            onClick={() => handleNextAction('review')}
            className="w-full h-14 text-base font-black bg-purple-600 hover:bg-purple-700 text-white rounded-2xl shadow-[0_8px_30px_rgb(147,51,234,0.2)] hover:shadow-[0_8px_30px_rgb(147,51,234,0.4)] transition-all active:scale-95 group"
          >
            {isUpdating ? <Loader2 className="animate-spin h-5 w-5" /> : (
              <><FileText className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" /> KIRIM UNTUK REVIEW</>
            )}
          </Button>
        );
      case 'review':
        return (
          <Button 
            disabled={isUpdating}
            onClick={() => setIsCompleteModalOpen(true)} // <-- Tombol memanggil Modal Upload
            className="w-full h-14 text-base font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-[0_8px_30px_rgb(16,185,129,0.2)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.4)] transition-all active:scale-95 group"
          >
             {isUpdating ? <Loader2 className="animate-spin h-5 w-5" /> : (
              <><CheckCircle2 className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" /> SELESAIKAN PESANAN</>
             )}
          </Button>
        );
      case 'completed':
        return (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3">
            <ShieldCheck className="h-10 w-10 text-emerald-500 mb-1" />
            <div className="space-y-1">
              <h4 className="font-black text-emerald-800 text-lg">Pesanan Telah Selesai</h4>
              <p className="text-sm font-medium text-emerald-600/80">Dokumen telah diserahkan ke klien.</p>
            </div>
            {/* Link Download Dokumen di Admin */}
            {order.final_document_url && (
              <a href={order.final_document_url} target="_blank" rel="noopener noreferrer" className="mt-2 w-full">
                <Button variant="outline" className="w-full bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-100">
                  <FileText className="mr-2 h-4 w-4" /> Lihat Dokumen
                </Button>
              </a>
            )}
          </div>
        );
      case 'cancelled':
        return (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-2">
            <XCircle className="h-10 w-10 text-red-500 mb-1" />
            <span className="font-black text-red-800 text-lg">Pesanan Dibatalkan</span>
            <span className="text-sm font-medium text-red-600/80">Proses untuk pesanan ini telah dihentikan.</span>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/admin/services/orders">
            <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 shrink-0 bg-white border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all">
              <ArrowLeft className="h-4 w-4 text-slate-700" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate flex items-center gap-3">
              Order #{order.id.slice(0, 8).toUpperCase()}
              <Badge variant="outline" className={cn("capitalize font-bold text-xs py-0.5 border-2", getStatusColor(order.status))}>
                {order.status}
              </Badge>
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-1">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {format(new Date(order.created_at), "dd MMM yyyy, HH:mm", { locale: idLocale })}
              </span>
              {order.services?.name && (
                <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                  <Briefcase className="h-3.5 w-3.5 shrink-0" />
                  {order.services.name}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border",
            isConnected
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          )}>
            <span className={cn("relative flex h-2 w-2", isConnected && "animate-pulse")}>
              <span className={cn("inline-flex rounded-full h-2 w-2", isConnected ? "bg-emerald-500" : "bg-amber-500")} />
            </span>
            {isConnected ? "Live" : "Connecting…"}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 border-slate-200">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-2xl">
              <DropdownMenuItem className="font-medium">Cetak Invoice</DropdownMenuItem>
              <DropdownMenuItem 
                 className="text-red-600 focus:text-red-600 font-bold focus:bg-red-50"
                 onClick={() => handleNextAction('cancelled')}
              >
                 Batalkan Order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* --- LEFT COLUMN: Control Center + Client Info + Timeline --- */}
        <div className="lg:col-span-4 flex flex-col gap-5 overflow-y-auto lg:max-h-[calc(100vh-12rem)] pr-1 scrollbar-thin">
          
          {/* 🚀 COMMAND CENTER CARD (Smart Action) */}
          <Card className="shadow-lg shadow-slate-200/50 border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 relative">
            <div className={cn("absolute top-0 left-0 w-full h-1.5", getStatusColor(order.status).split(" ")[0])} />
            <CardHeader className="pb-4 pt-6">
                <CardTitle className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                    Action Center
                </CardTitle>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-slate-100 p-4 flex flex-col justify-center min-h-[5.5rem]">
                    <p className="text-xs font-bold text-slate-500 mb-1">Total Tagihan Klien</p>
                    <div className="flex items-center justify-between">
                        <h3 className={cn(
                          "text-2xl font-black tracking-tight", 
                          order.quoted_price ? "text-slate-900" : "text-slate-300"
                        )}>
                            {order.quoted_price ? formatRupiah(order.quoted_price) : "Belum diatur"}
                        </h3>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {renderSmartAction()}
            </CardContent>
          </Card>

          {/* Client Info Card */}
          <Card className="shadow-sm border-slate-200 shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User className="h-4 w-4" /> Informasi Klien
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${order.profiles?.full_name}`} />
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                    {order.profiles?.full_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 truncate">{order.profiles?.full_name || "Tanpa Nama"}</p>
                  <p className="text-xs font-medium text-slate-500 truncate">{order.profiles?.email}</p>
                </div>
              </div>
              
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">Layanan</span>
                <span className="text-sm font-bold text-slate-700 truncate">{order.services?.name || "—"}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col justify-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">Telepon</span>
                    <span className="text-sm font-bold text-slate-700 truncate">{order.profiles?.phone || "—"}</span>
                 </div>
                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col justify-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">Perusahaan</span>
                    <span className="text-sm font-bold text-slate-700 truncate">{order.company_name || "—"}</span>
                 </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Timeline Card */}
            <Card className="shadow-sm border-slate-200 shrink-0">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Progres Timeline
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="relative pl-2">
                        <div className="absolute left-[15px] top-2 bottom-4 w-0.5 bg-slate-100" />
                        <div className="space-y-6">
                            {TIMELINE_STEPS.map((step, index) => {
                                let status: 'completed' | 'current' | 'upcoming' | 'error' = 'upcoming';
                                if (isCancelled && order.status === step.id) status = 'error';
                                else if (isCancelled) status = 'upcoming'; 
                                else if (index < currentStepIndex || order.status === 'completed') status = 'completed';
                                else if (index === currentStepIndex) status = 'current';

                                return (
                                    <div key={step.id} className="relative flex gap-4 items-start group">
                                        <div className={cn(
                                            "relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-300",
                                            status === 'completed' && "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200",
                                            status === 'current' && "bg-white border-blue-600 text-blue-600 ring-4 ring-blue-50",
                                            status === 'upcoming' && "bg-white border-slate-200 text-slate-300",
                                            status === 'error' && "bg-red-50 border-red-500 text-red-500"
                                        )}>
                                            {status === 'completed' && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                                            {status === 'current' && <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />}
                                            {status === 'upcoming' && <Circle className="h-3.5 w-3.5 fill-slate-50 text-transparent" />}
                                            {status === 'error' && <XCircle className="h-4 w-4" />}
                                        </div>
                                        <div className="pt-0.5">
                                            <p className={cn(
                                                "text-sm font-bold transition-colors",
                                                status === 'completed' || status === 'current' ? "text-slate-800" : "text-slate-400",
                                                status === 'error' && "text-red-600"
                                            )}>
                                                {step.label}
                                            </p>
                                            <p className="text-xs text-slate-400 font-medium">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* --- AGENT CONTROL PANEL --- */}
            <AgentControlPanel 
              applicationId={order.id} 
              currentAgentId={order.assigned_agent_id} 
            />
        </div>

        {/* --- RIGHT COLUMN: CHAT --- */}
        <div className="lg:col-span-8 flex flex-col min-h-[420px] lg:min-h-[calc(100vh-12rem)] overflow-hidden">
          {currentUserId ? (
            <ChatBoxAdmin
              key={order.id}
              applicationId={order.id}
              initialMessages={initialMessages}
              currentUserId={currentUserId}
              className="flex-1 flex flex-col min-h-0 w-full max-h-[calc(100vh-10rem)] shadow-sm rounded-2xl border border-slate-200"
              title={order.profiles?.full_name || "Tanpa Nama"}
              subtitle={order.services?.name || "Komunikasi resmi klien"}
              onTypingChange={setClientIsTyping}
            />
          ) : null}
        </div>
      </div>

      {/* MODAL FORM QUOTATION */}
      <Dialog open={isQuotationModalOpen} onOpenChange={setIsQuotationModalOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-md p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-blue-600 p-8 text-white relative">
            <DialogHeader>
                <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                  <Receipt className="h-6 w-6 text-white" />
                </div>
                <DialogTitle className="text-2xl font-black tracking-tight text-white leading-tight">
                  Kirim Penawaran <br/> Harga (Quotation)
                </DialogTitle>
                <DialogDescription className="text-blue-100 font-medium pt-2">
                  Masukkan nominal biaya layanan untuk <strong>{order.company_name}</strong>. Klien akan segera menerima tagihan.
                </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-8 space-y-6 bg-white">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Biaya Layanan</label>
              <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg transition-colors group-focus-within:text-blue-600">Rp</div>
                  <Input 
                    type="text" 
                    inputMode="numeric" 
                    value={priceEditValue} 
                    onChange={(e) => setPriceEditValue(formatPriceWithCommas(e.target.value))} 
                    placeholder="0" 
                    className="pl-14 text-right font-black text-xl rounded-2xl border-2 border-slate-100 focus-visible:ring-blue-600 focus-visible:border-blue-600 h-16 transition-all shadow-inner"
                  />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
               <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-bold">Layanan</span>
                  <span className="text-slate-900 font-black">{order.services?.name}</span>
               </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                onClick={handleQuotationSubmit} 
                disabled={isUpdating} 
                className="flex-[2] h-14 rounded-2xl font-black bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95 transition-all text-base"
              >
                {isUpdating ? <Loader2 className="animate-spin h-5 w-5" /> : <><SendHorizontal className="mr-2 h-5 w-5" /> KIRIM PENAWARAN</>}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setIsQuotationModalOpen(false)} 
                className="flex-1 h-14 rounded-2xl font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                BATAL
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- MODAL UPLOAD DOKUMEN FINAL & SELESAIKAN PESANAN --- */}
      <Dialog open={isCompleteModalOpen} onOpenChange={setIsCompleteModalOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-md p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-emerald-600 p-8 text-white relative">
            <DialogHeader>
                <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                  <UploadCloud className="h-6 w-6 text-white" />
                </div>
                <DialogTitle className="text-2xl font-black tracking-tight text-white leading-tight">
                  Unggah Dokumen <br/> & Selesaikan
                </DialogTitle>
                <DialogDescription className="text-emerald-100 font-medium pt-2">
                  Unggah dokumen final (PDF/Gambar) sebagai bukti bahwa layanan telah terbit untuk diserahkan kepada Klien.
                </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-8 space-y-6 bg-white">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pilih Dokumen Final</label>
              <Input 
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFinalDocument(e.target.files?.[0] || null)}
                className="h-14 rounded-2xl border-2 border-slate-100 pt-3 px-4 file:mr-4 file:py-1 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all cursor-pointer"
              />
              {finalDocument && (
                <div className="flex items-center gap-2 mt-2 bg-emerald-50/50 p-2 rounded-xl border border-emerald-100">
                   <FileText className="h-4 w-4 text-emerald-500" />
                   <p className="text-xs font-bold text-emerald-700 truncate">{finalDocument.name}</p>
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                onClick={handleCompleteSubmit} 
                disabled={isUpdating} 
                className="flex-[2] h-14 rounded-2xl font-black bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 active:scale-95 transition-all text-base"
              >
                {isUpdating ? <Loader2 className="animate-spin h-5 w-5" /> : <><CheckCircle2 className="mr-2 h-5 w-5" /> UPLOAD & SELESAI</>}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setIsCompleteModalOpen(false)} 
                className="flex-1 h-14 rounded-2xl font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                BATAL
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}