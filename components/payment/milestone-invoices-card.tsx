// components/payment/milestone-invoices-card.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { CheckCircle2, Clock, FileText, ExternalLink, AlertCircle, Settings2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

// Actions yang telah disesuaikan
import { 
  ensureMilestoneInvoices, 
  generateAllMilestoneLinks, 
  createMilestonePaymentLink,
  MilestoneKey 
} from "@/actions/milestone-invoice-actions";

// --- HELPERS ---
const formatRupiah = (v: number) => 
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(v);

const STATUS_MAP = {
  paid:    { label: "Lunas",   color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  pending: { label: "Pending", color: "text-amber-500 bg-amber-50 border-amber-200",     icon: Clock },
  unpaid:  { label: "Belum",   color: "text-slate-400 bg-slate-50 border-slate-200",     icon: AlertCircle },
};

/** 1. SUB-KOMPONEN BARIS INVOICE **/
const InvoiceItem = ({ inv, applicationId, isAdmin = false }: { inv: any; applicationId: string; isAdmin?: boolean }) => {
  const [loading, setLoading] = useState(false);
  const status = (inv.status?.toLowerCase() || "unpaid") as keyof typeof STATUS_MAP;
  const cfg = STATUS_MAP[status] || STATUS_MAP.unpaid;
  const isPaid = status === "paid";

  // Fungsi untuk membuat link jika belum ada atau expired
  const handleCreateLink = async () => {
    setLoading(true);
    const res = await createMilestonePaymentLink(applicationId, inv.milestone_key as MilestoneKey);
    if (res.error) toast.error(res.error);
    if (res.success) toast.success("Link pembayaran diperbarui");
    setLoading(false);
  };

  return (
    <div className={cn("flex items-center justify-between p-4 rounded-xl border transition-all", cfg.color)}>
      <div className="flex items-center gap-3">
        <cfg.icon className="h-5 w-5" />
        <div>
          <h4 className="text-sm font-bold text-slate-900">{inv.milestone_label}</h4>
          <p className="text-xs font-medium text-slate-500">{formatRupiah(Number(inv.amount))}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[10px] uppercase font-bold">{cfg.label}</Badge>
        
        {!isPaid && (
          inv.xendit_invoice_url ? (
            <Button size="sm" variant="outline" className="h-8 text-xs bg-white border-slate-200" asChild>
              <a href={inv.xendit_invoice_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" /> Bayar
              </a>
            </Button>
          ) : (
            isAdmin && (
              <Button size="sm" onClick={handleCreateLink} disabled={loading} className="h-8 text-xs">
                {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Buat Link"}
              </Button>
            )
          )
        )}
      </div>
    </div>
  );
};

/** 2. KOMPONEN UNTUK TAMPILAN KLIEN **/
export function MilestoneInvoicesCard({ orderId, total, initialInvoices }: any) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`client-inv-${orderId}`)
      .on("postgres_changes", { 
        event: "UPDATE", 
        schema: "public", 
        table: "invoices", 
        filter: `application_id=eq.${orderId}` 
      }, (p) => {
        setInvoices((prev: any[]) => prev.map(inv => inv.id === p.new.id ? { ...inv, ...p.new } : inv));
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [orderId, supabase]);

  if (!invoices || invoices.length === 0) return null;

  return (
    <Card className="rounded-[2rem] shadow-sm border-slate-100 p-2">
      <CardHeader>
        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <FileText className="h-4 w-4" /> Termin Pembayaran
        </CardTitle>
        <CardDescription className="text-xs font-medium">Total Kontrak: {formatRupiah(total)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {invoices.map((inv: any) => (
          <InvoiceItem key={inv.id} inv={inv} applicationId={orderId} />
        ))}
      </CardContent>
    </Card>
  );
}

/** 3. KOMPONEN UNTUK TAMPILAN ADMIN **/
export function AdminMilestoneInvoices({ applicationId, invoices = [], totalPrice = 0 }: any) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  // Kalkulasi progress real
  const paidAmount = useMemo(() => 
    invoices.reduce((acc: number, inv: any) => acc + (inv.status === 'paid' ? Number(inv.amount) : 0), 0)
  , [invoices]);

  // Handler utama sesuai flow action baru
  const handleInitializeSystem = async () => {
    setIsGenerating(true);
    try {
      // 1. Pastikan record invoice ada di DB (Default DP 50%)
      const resEnsure = await ensureMilestoneInvoices(applicationId, totalPrice, 50);
      if (!resEnsure.success) throw new Error(resEnsure.error);

      // 2. Generate link Xendit untuk semua termin yang baru dibuat
      await generateAllMilestoneLinks(applicationId);
      
      toast.success("Sistem pembayaran termin berhasil diaktifkan");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal menginisiasi termin");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b flex flex-row items-center justify-between space-y-0 py-4">
        <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
          <FileText className="h-4 w-4" /> Manajemen Termin
        </CardTitle>
        
        {invoices.length === 0 && (
          <Button size="sm" onClick={handleInitializeSystem} disabled={isGenerating}>
            {isGenerating ? (
              <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
            ) : (
              <Settings2 className="h-3.5 w-3.5 mr-2" />
            )}
            Aktifkan Termin
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="p-4 space-y-5">
        {/* Progress Tracker */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
            <span>Terbayar: {formatRupiah(paidAmount)}</span>
            <span>Target: {formatRupiah(totalPrice)}</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500" 
              style={{ width: `${totalPrice > 0 ? (paidAmount / totalPrice) * 100 : 0}%` }} 
            />
          </div>
        </div>

        {/* Daftar Invoice */}
        <div className="space-y-3">
          {invoices.length > 0 ? (
            invoices.map((inv: any) => (
              <InvoiceItem key={inv.id} inv={inv} applicationId={applicationId} isAdmin />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
              <AlertCircle className="h-8 w-8 text-slate-200 mb-2" />
              <p className="text-xs text-slate-400 font-medium">Belum ada termin pengerjaan.<br/>Klik tombol di atas untuk membuat.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}