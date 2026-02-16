// app/admin/services/orders/[id]/order-detail-client.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, CheckCircle2, AlertCircle, 
  User, Phone, DollarSign, Briefcase, 
  MoreVertical, Clock, ShieldCheck,
  Check, Circle, XCircle, Edit2
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatBox } from "@/components/dashboard/chat-box-admin";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Utils
import { toast } from "sonner";
import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/applicationSchema/utils";

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
  { id: 'quoted', label: 'Penawaran Harga', description: 'Estimasi biaya dikirim' },
  { id: 'process', label: 'Proses Pengerjaan', description: 'Sedang dikerjakan' },
  { id: 'review', label: 'Review Dokumen', description: 'Validasi hasil akhir' },
  { id: 'completed', label: 'Selesai', description: 'Layanan tuntas' },
];

export default function OrderDetailClient({ initialOrder, initialMessages, initialCurrentUserId = "" }: OrderDetailClientProps) {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string>(initialCurrentUserId);

  const [order, setOrder] = useState(initialOrder);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [priceEditValue, setPriceEditValue] = useState("");

  useEffect(() => {
    if (initialCurrentUserId) {
      setCurrentUserId(initialCurrentUserId);
      return;
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, [supabase, initialCurrentUserId]);

  // Realtime: only order (applications) updates; messages handled by ChatBox
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

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    
    // Optimistic Update: Update UI dulu biar terasa cepat
    const previousStatus = order.status;
    setOrder((prev: any) => ({ ...prev, status: newStatus }));

    const { error } = await supabase
      .from("applications")
      .update({ status: newStatus })
      .eq("id", order.id);

    if (error) {
      // Revert jika gagal
      setOrder((prev: any) => ({ ...prev, status: previousStatus }));
      toast.error("Gagal update status");
    } else {
      toast.success(`Status diubah ke ${newStatus}`);
      router.refresh(); // Refresh data server component
    }
    setIsUpdating(false);
  };

  const handlePriceUpdate = async (formData: FormData) => {
    const raw = formData.get("quoted_price");
    const priceStr = raw != null ? String(raw).replace(/\D/g, "") : "";
    const quotedPrice = priceStr === "" ? null : parseInt(priceStr, 10);

    if (quotedPrice === null || isNaN(quotedPrice)) {
      toast.error("Masukkan jumlah harga yang valid.");
      return;
    }

    setOrder((prev: any) => ({ ...prev, quoted_price: quotedPrice, status: "quoted" }));

    const { error } = await supabase
      .from("applications")
      .update({ quoted_price: quotedPrice, status: "quoted" })
      .eq("id", order.id);

    if (error) {
      setOrder((prev: any) => ({ ...prev, quoted_price: order.quoted_price, status: order.status }));
      toast.error("Gagal menyimpan harga.");
      router.refresh();
    } else {
      setIsEditingPrice(false);
      setPriceEditValue(formatPriceWithCommas(quotedPrice));
      toast.success("Penawaran harga terkirim!");
      router.refresh();
    }
  };

  // --- HELPER UI ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200';
      case 'process': return 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200';
      case 'quoted': return 'bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200';
      case 'cancelled': return 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200';
      default: return 'bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200';
    }
  };

  // Helper Timeline
  const getCurrentStepIndex = (status: string) => {
    return TIMELINE_STEPS.findIndex(s => s.id === status);
  };
  
  const currentStepIndex = getCurrentStepIndex(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="space-y-6 pb-8">
      {/* --- HEADER: Back + Order ID + Realtime + Actions --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/admin/services/orders">
            <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 shrink-0 bg-white border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all">
              <ArrowLeft className="h-4 w-4 text-slate-700" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-0.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {format(new Date(order.created_at), "dd MMM yyyy, HH:mm", { locale: idLocale })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border",
            isConnected
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
              : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
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
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>Lihat Invoice</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600 focus:text-red-600">Batalkan Order</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* --- LEFT COLUMN: Client + Status + Price + Timeline --- */}
        <div className="lg:col-span-4 flex flex-col gap-5 overflow-y-auto lg:max-h-[calc(100vh-12rem)] pr-1 scrollbar-thin">
          {/* Client Info Card */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden shrink-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <User className="h-4 w-4" />
                Informasi Klien
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-slate-100 dark:border-slate-800">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${order.profiles?.full_name}`} />
                  <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm">
                    {order.profiles?.full_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 dark:text-white truncate">{order.profiles?.full_name || "Tanpa Nama"}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{order.profiles?.email}</p>
                  <Badge variant="secondary" className="mt-1 text-[10px] h-5">
                    {order.profiles?.role || "User"}
                  </Badge>
                </div>
              </div>
              <Separator className="my-2" />
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4 text-slate-500" />
                </div>
                <span className="font-medium truncate">{order.profiles?.phone || "—"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Status & Control Card */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden shrink-0">
                <div className={cn("h-1 w-full rounded-t-lg", getStatusColor(order.status).split(" ")[0])} />
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                        Status Pesanan
                        <Badge variant="outline" className={cn("capitalize font-bold", getStatusColor(order.status))}>
                            {order.status}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Select disabled={isUpdating} value={order.status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 font-medium transition-all hover:bg-slate-100 focus:ring-2 focus:ring-blue-100">
                            <SelectValue placeholder="Update Status" />
                        </SelectTrigger>
                        <SelectContent className="z-[100]" position="popper" sideOffset={4}>
                            <SelectItem value="pending">⏳ Pending Review</SelectItem>
                            <SelectItem value="quoted">💰 Menunggu Pembayaran</SelectItem>
                            <SelectItem value="process">⚙️ Sedang Diproses</SelectItem>
                            <SelectItem value="review">👀 Review Dokumen</SelectItem>
                            <SelectItem value="completed">✅ Selesai</SelectItem>
                            <SelectItem value="cancelled">❌ Dibatalkan</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

          {/* Service & Pricing Card */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 shrink-0">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Layanan & Harga
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-blue-50/50 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-100 dark:border-blue-900/50">
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mb-1 uppercase tracking-wider">Layanan Terpilih</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{order.services?.name}</p>
                    </div>

                    {/* Conditional Logic untuk Mode Edit vs Mode Label */}
                    {!isEditingPrice ? (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-300">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Total Tagihan (Quotation)</label>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between group">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                        {formatRupiah(order.quoted_price || 0)}
                                    </h3>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => {
                                          setIsEditingPrice(true);
                                          setPriceEditValue(formatPriceWithCommas(order.quoted_price));
                                        }}
                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 gap-2 font-bold px-2 rounded-lg"
                                    >
                                        <Edit2 className="h-3.5 w-3.5" />
                                        Edit
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form action={handlePriceUpdate} className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Total Tagihan (Quotation)</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-serif text-sm">Rp</div>
                                    <input type="hidden" name="quoted_price" value={parsePriceFromCommas(priceEditValue)} />
                                    <Input 
                                        type="text"
                                        inputMode="numeric"
                                        value={priceEditValue}
                                        onChange={(e) => setPriceEditValue(formatPriceWithCommas(e.target.value))}
                                        placeholder="Contoh: 1.500.000"
                                        className="pl-10 font-mono text-right font-medium rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800/50 focus-visible:ring-blue-500 h-12"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    type="submit" 
                                    disabled={isUpdating}
                                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md transition-all active:scale-95"
                                >
                                    {isUpdating ? "Menyimpan..." : "Simpan Penawaran"}
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setIsEditingPrice(false)}
                                    className="rounded-xl shrink-0"
                                >
                                    Batal
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>

          {/* Progress Timeline */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 shrink-0">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Progres Timeline
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative pl-2">
                        {/* Garis Vertikal Latar */}
                        <div className="absolute left-[15px] top-2 bottom-4 w-0.5 bg-slate-100" />
                        
                        <div className="space-y-6">
                            {TIMELINE_STEPS.map((step, index) => {
                                // Logic Status Timeline
                                let status: 'completed' | 'current' | 'upcoming' | 'error' = 'upcoming';
                                
                                if (isCancelled && order.status === step.id) status = 'error';
                                else if (isCancelled) status = 'upcoming'; // Stop progress if cancelled
                                else if (index < currentStepIndex || order.status === 'completed') status = 'completed';
                                else if (index === currentStepIndex) status = 'current';

                                return (
                                    <div key={step.id} className="relative flex gap-4 items-start group">
                                        {/* Icon Indikator */}
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

                                        {/* Text Info */}
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
        </div>

        {/* --- RIGHT COLUMN: CHAT (shared ChatBox) --- */}
        <div className="lg:col-span-8 flex flex-col min-h-[420px] lg:min-h-[calc(100vh-12rem)] overflow-hidden">
          {currentUserId ? (
            <ChatBox
              key={order.id}
              applicationId={order.id}
              initialMessages={initialMessages}
              currentUserId={currentUserId}
              className="flex-1 min-h-0"
              title="Diskusi & Berkas"
              subtitle="Komunikasi resmi dengan klien"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}