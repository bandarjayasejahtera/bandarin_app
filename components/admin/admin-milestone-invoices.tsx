"use client";

import { useState, useEffect, useRef } from "react";
import {
  CheckCircle2, Clock, FileText,
  ExternalLink, AlertCircle, RefreshCw,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Decimal from "decimal.js";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/applicationSchema/utils";
import {
  ensureMilestoneInvoices,
  generateAllMilestoneLinks,
  type MilestoneKey,
} from "@/actions/milestone-invoice-actions";

// ── helpers ───────────────────────────────────────────────────────────────────

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

// ── sub-component: panel slider DP ───────────────────────────────────────────

function DpConfigPanel({
  dpPercentage,
  totalPrice,
  onDpChange,
  onSave,
  isSaving,
  variant = "standalone",
}: {
  dpPercentage: number;
  totalPrice: number;
  onDpChange: (pct: number) => void;
  onSave: () => void;
  isSaving: boolean;
  variant?: "standalone" | "inline";
}) {
  const isStandalone = variant === "standalone";

  // Preview nominal
  const totalDec = new Decimal(totalPrice);
  const dpPct = new Decimal(dpPercentage);
  const preview =
    dpPct.equals(100)
      ? [{ label: "Pembayaran Penuh", pct: 100, amount: totalDec.toNumber() }]
      : (() => {
          const dpAmount = totalDec.times(dpPct).div(100).floor();
          return [
            { label: "DP", pct: dpPct.toNumber(), amount: dpAmount.toNumber() },
            { label: "Pelunasan", pct: 100 - dpPct.toNumber(), amount: totalDec.minus(dpAmount).toNumber() },
          ];
        })();

  return (
    <div className={cn(
      isStandalone && "w-full max-w-sm bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-left",
      !isStandalone && "space-y-4 w-full",
    )}>
      {/* Slider */}
      <div className={cn("flex justify-between items-center", isStandalone && "mb-3")}>
        <label className={cn(
          "text-xs font-bold uppercase tracking-widest",
          isStandalone ? "text-slate-400" : "text-slate-500",
        )}>
          {isStandalone ? "Besaran DP" : "Besaran Down Payment (DP)"}
        </label>
        <span className="text-sm font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md">{dpPercentage}%</span>
      </div>

      <Slider
        value={[dpPercentage]}
        onValueChange={(val) => onDpChange(val[0])}
        min={50} max={100} step={10}
        className={cn("py-2", isStandalone && "mb-2")}
      />

      {isStandalone && (
        <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1 mb-4">
          <span>Min 50%</span>
          <span>100% (Lunas)</span>
        </div>
      )}

      {/* Preview nominal termin */}
      <div className={cn("space-y-1.5", isStandalone ? "mb-5" : "mb-3")}>
        {preview.map((p) => (
          <div key={p.label} className="flex justify-between items-center bg-slate-50 rounded-lg px-3 py-2">
            <span className="text-xs font-bold text-slate-600">{p.label} <span className="text-slate-400 font-medium">({p.pct}%)</span></span>
            <span className="text-xs font-black text-slate-800">{formatRupiah(p.amount)}</span>
          </div>
        ))}
      </div>

      {/* Tombol */}
      <div className={cn(!isStandalone && "flex justify-end")}>
        <Button
          onClick={onSave}
          disabled={isSaving}
          size={isStandalone ? "default" : "sm"}
          className={cn("bg-blue-600 hover:bg-blue-700 font-bold", isStandalone && "w-full h-11")}
        >
          {isSaving
            ? <RefreshCw className={cn("animate-spin mr-2", isStandalone ? "h-4 w-4" : "h-3.5 w-3.5")} />
            : <CheckCircle2 className={cn("mr-2", isStandalone ? "h-4 w-4" : "h-3.5 w-3.5")} />}
          {isSaving
            ? "Mempersiapkan Link Xendit..."
            : isStandalone ? "Generate Smart Invoice" : "Generate Ulang Link Xendit"}
        </Button>
      </div>
    </div>
  );
}

// ── types ─────────────────────────────────────────────────────────────────────

export interface Milestone {
  id: string;
  application_id: string;
  title?: string;
  milestone_label?: string;
  percentage: number;
  amount: number | string;
  status: string;
  xendit_invoice_id?: string;
  xendit_invoice_url?: string;   // kolom DB: xendit_invoice_url
  created_at: string;
  paid_at?: string;
  milestone_key?: MilestoneKey;
}

interface AdminMilestoneInvoicesProps {
  applicationId: string;
  invoices?: Milestone[];
  totalPrice: number;
}

// ── main component ────────────────────────────────────────────────────────────

export function AdminMilestoneInvoices({
  applicationId,
  invoices = [],
  totalPrice = 0,
}: AdminMilestoneInvoicesProps) {
  const router = useRouter();
  const supabase = createClient();

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [dpPercentage, setDpPercentage] = useState<number>(50);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const generatingLinksRef = useRef<Set<string>>(new Set());
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);

  // Sync slider ke data DP yang sudah ada
  useEffect(() => {
    const dp = invoices.find((inv) => inv.milestone_key === "dp");
    if (dp) setDpPercentage(dp.percentage);
  }, [invoices]);

  // Realtime: tampilkan toast + refresh saat ada update dari webhook
  useEffect(() => {
    const channel = supabase
      .channel(`realtime-admin-invoices-${applicationId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "invoices", filter: `application_id=eq.${applicationId}` },
        (payload) => {
          const updated = payload.new as { status?: string; milestone_label?: string };
          if (updated.status === "paid") {
            toast.success(`✅ ${updated.milestone_label ?? "Termin"} berhasil dibayar!`);
          }
          router.refresh();
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [applicationId, supabase, router]);

  // Background sync: generate link Xendit jika invoice sudah ada di DB tapi belum punya URL
  useEffect(() => {
    let mounted = true;

    async function syncMissingLinks() {
      const missing = invoices.filter(
        (inv) =>
          (inv.status === "unpaid" || inv.status === "pending") &&
          !inv.xendit_invoice_url &&
          inv.milestone_key &&
          !generatingLinksRef.current.has(inv.id),
      );
      if (missing.length === 0) return;

      setIsAutoGenerating(true);
      missing.forEach((inv) => generatingLinksRef.current.add(inv.id));

      const res = await generateAllMilestoneLinks(applicationId);

      if (mounted) {
        setIsAutoGenerating(false);
        if (res.success) router.refresh();
      }
    }

    syncMissingLinks();
    return () => { mounted = false; };
  }, [invoices, applicationId, router]);

  // ── derived values ──────────────────────────────────────────────────────────

  const totalPaid = invoices
    .filter((inv) => inv.status?.toLowerCase() === "paid")
    .reduce((acc, inv) => acc + (parseFloat(inv.amount.toString()) || 0), 0);

  const totalRemaining = Math.max(0, totalPrice - totalPaid);
  const progressPercentage = totalPrice > 0 ? (totalPaid / totalPrice) * 100 : 0;
  const hasPaidInvoices = invoices.some((inv) => inv.status === "paid");

  // ── handlers ────────────────────────────────────────────────────────────────

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      // 1. Pastikan termin ada di DB (idempotent)
      const res = await ensureMilestoneInvoices(applicationId, totalPrice, dpPercentage);
      if (!res.success) throw new Error(res.error ?? "Gagal membuat termin.");

      toast.info("Termin dibuat, sedang men-generate link Xendit...");

      // 2. Generate link Xendit untuk semua termin (sekali jalan)
      const linkRes = await generateAllMilestoneLinks(applicationId);
      if (!linkRes.success) {
        toast.warning("Sebagian link gagal di-generate. Akan dicoba ulang otomatis.");
      }

      toast.success("Smart Invoice & Link Pembayaran berhasil di-generate!");
      setIsConfigOpen(false);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal memproses Smart Invoice.");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleMarkAsPaid = async (milestoneId: string) => {
    setLoadingId(milestoneId);
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", milestoneId);
      if (error) throw error;
      toast.success("Termin ditandai lunas!");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengupdate status.");
    } finally {
      setLoadingId(null);
    }
  };

  // ── zero state ──────────────────────────────────────────────────────────────

  if (invoices.length === 0 && totalPrice > 0) {
    return (
      <Card className="border-slate-200 shadow-sm border-dashed bg-slate-50/50">
        <CardContent className="py-10 text-center flex flex-col items-center justify-center">
          <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <Settings2 className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-black text-slate-800 mb-2">Smart Invoicing Terdeteksi</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-sm">
            Tentukan persentase DP. Sistem akan otomatis membagi tagihan dan men-generate link pembayaran Xendit.
          </p>
          <DpConfigPanel
            dpPercentage={dpPercentage}
            totalPrice={totalPrice}
            onDpChange={setDpPercentage}
            onSave={handleSaveConfig}
            isSaving={isSavingConfig}
            variant="standalone"
          />
        </CardContent>
      </Card>
    );
  }

  // ── main render ─────────────────────────────────────────────────────────────

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
        {/* Title + tombol atur ulang */}
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <FileText className="h-4 w-4" /> Manajemen Termin Pembayaran
            </CardTitle>
            <CardDescription className="text-xs mt-1">Pantau arus kas berdasarkan progress pengerjaan.</CardDescription>
          </div>

          {!hasPaidInvoices && (
            <Button
              variant="outline" size="sm"
              onClick={() => setIsConfigOpen((v) => !v)}
              className={cn("h-8 text-xs font-bold border-slate-200", isConfigOpen && "bg-slate-100")}
            >
              <Settings2 className="h-3.5 w-3.5 mr-2" />
              {isConfigOpen ? "Tutup" : "Atur Ulang"}
            </Button>
          )}
        </div>

        {/* Panel konfigurasi DP */}
        {isConfigOpen && !hasPaidInvoices && (
          <div className="mt-4 bg-white p-4 rounded-xl border border-blue-100 shadow-sm animate-in slide-in-from-top-2 duration-200">
            <DpConfigPanel
              dpPercentage={dpPercentage}
              totalPrice={totalPrice}
              onDpChange={setDpPercentage}
              onSave={handleSaveConfig}
              isSaving={isSavingConfig}
              variant="inline"
            />
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-5 bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Kontrak</p>
              <p className="text-lg font-black text-slate-900">{formatRupiah(totalPrice)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Diterima</p>
              <p className="text-lg font-black text-emerald-600">{formatRupiah(totalPaid)}</p>
            </div>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-700 ease-in-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Progress: {Math.round(progressPercentage)}%
            </span>
            <p className="text-xs text-slate-500 font-medium">
              Sisa Tagihan: <span className="font-bold text-red-600">{formatRupiah(totalRemaining)}</span>
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {invoices.map((milestone) => {
            const isPaid = milestone.status?.toLowerCase() === "paid";
            const isPending = milestone.status?.toLowerCase() === "pending";
            const hasUrl = !!milestone.xendit_invoice_url;
            const isMarkingPaid = loadingId === milestone.id;

            return (
              <div
                key={milestone.id}
                className="p-4 flex flex-col sm:flex-row gap-4 justify-between hover:bg-slate-50/50 transition-colors"
              >
                {/* Info termin */}
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "flex-shrink-0 mt-0.5 h-10 w-10 rounded-full flex items-center justify-center border-2",
                    isPaid    ? "bg-emerald-50 border-emerald-200 text-emerald-600" :
                    isPending ? "bg-amber-50 border-amber-200 text-amber-500" :
                                "bg-slate-50 border-slate-200 text-slate-400",
                  )}>
                    {isPaid    ? <CheckCircle2 className="h-5 w-5" /> :
                     isPending ? <Clock className="h-5 w-5" /> :
                                 <AlertCircle className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      {milestone.milestone_label || milestone.title}
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 py-0 uppercase font-bold",
                          isPaid    ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                          isPending ? "bg-amber-100 text-amber-700 border-amber-200" :
                                      "bg-slate-100 text-slate-600 border-slate-200",
                        )}
                      >
                        {milestone.status}
                      </Badge>
                    </h4>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      Nominal:{" "}
                      <strong className="text-slate-800">
                        {formatRupiah(parseFloat(milestone.amount.toString()))}
                      </strong>
                    </p>
                  </div>
                </div>

                {/* Aksi */}
                {!isPaid && (
                  <div className="flex items-center gap-2 shrink-0">
                    {hasUrl ? (
                      <a href={milestone.xendit_invoice_url!} target="_blank" rel="noopener noreferrer">
                        <Button
                          variant="outline" size="sm"
                          className="h-9 font-bold border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" /> Link Invoice
                        </Button>
                      </a>
                    ) : (
                      <Button size="sm" disabled className="h-9 font-bold bg-slate-100 text-slate-500">
                        <RefreshCw className={cn("h-3.5 w-3.5 mr-2", isAutoGenerating && "animate-spin")} />
                        {isAutoGenerating ? "Generating..." : "Belum ada link"}
                      </Button>
                    )}

                    <Button
                      variant="ghost" size="sm"
                      disabled={isMarkingPaid}
                      onClick={() => handleMarkAsPaid(milestone.id)}
                      className="h-9 w-9 p-0 rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                      title="Tandai Lunas Manual"
                    >
                      {isMarkingPaid
                        ? <RefreshCw className="h-4 w-4 animate-spin" />
                        : <CheckCircle2 className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
