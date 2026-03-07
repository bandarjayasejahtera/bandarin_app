"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle2, Clock, FileText, 
  ExternalLink, CreditCard, AlertCircle, RefreshCw, Send,
  Settings2, ChevronDown, ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Decimal from "decimal.js";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/applicationSchema/utils";
import { ensureMilestoneInvoices, createMilestonePaymentLink } from "@/actions/milestone-invoice-actions";

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", { 
    style: "currency", 
    currency: "IDR", 
    minimumFractionDigits: 0 
  }).format(value);
}

export interface Milestone {
  id: string;
  application_id: string;
  title?: string; // Handle potential missing title if schema changed
  milestone_label?: string;
  percentage: number;
  amount: number | string;
  status: string;
  xendit_invoice_id?: string;
  xendit_payment_url?: string;
  created_at: string;
  paid_at?: string;
  milestone_key?: string;
}

interface AdminMilestoneInvoicesProps {
  applicationId: string;
  invoices?: Milestone[];
  totalPrice: number;
}

export function AdminMilestoneInvoices({ 
  applicationId, 
  invoices = [], 
  totalPrice = 0 
}: AdminMilestoneInvoicesProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [dpPercentage, setDpPercentage] = useState<number>(30);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Initialize DP percentage from existing invoices if available
  useEffect(() => {
    const dpInvoice = invoices.find(inv => inv.milestone_key === 'dp');
    if (dpInvoice) {
      setDpPercentage(dpInvoice.percentage);
    }
  }, [invoices]);

  // Calculate stats
  const totalPaid = invoices
    .filter(inv => inv.status?.toLowerCase() === 'paid')
    .reduce((acc, curr) => acc + (parseFloat(curr.amount.toString()) || 0), 0);

  const totalRemaining = Math.max(0, totalPrice - totalPaid);
  const progressPercentage = totalPrice > 0 ? (totalPaid / totalPrice) * 100 : 0;
  
  // Check if any invoice is paid (to lock configuration)
  const hasPaidInvoices = invoices.some(inv => inv.status === 'paid');

  // Preview calculations based on slider
  const previewAmounts = (() => {
    const totalDec = new Decimal(totalPrice);
    const dpPct = new Decimal(dpPercentage);
    
    if (dpPct.equals(100)) {
        return [{ label: 'Pembayaran Penuh', amount: totalDec.toNumber(), percentage: 100 }];
    }
    
    const remainingPct = new Decimal(100).minus(dpPct);
    const finalPct = remainingPct;

    const dpAmount = totalDec.times(dpPct).div(100).floor();
    const finalAmount = totalDec.minus(dpAmount);

    return [
        { label: 'DP', amount: dpAmount.toNumber(), percentage: dpPct.toNumber() },
        { label: 'Pelunasan', amount: finalAmount.toNumber(), percentage: finalPct.toNumber() }
    ];
  })();

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
        const res = await ensureMilestoneInvoices(applicationId, totalPrice, dpPercentage);
        if (res.error) throw new Error(res.error);
        toast.success("Konfigurasi Termin Berhasil Disimpan!");
        setIsConfigOpen(false);
        router.refresh();
    } catch (err: any) {
        toast.error(err.message || "Gagal menyimpan konfigurasi.");
    } finally {
        setIsSavingConfig(false);
    }
  };

  const handleGenerateLink = async (milestoneKey: string) => {
    setLoadingId(milestoneKey);
    try {
      const res = await createMilestonePaymentLink(applicationId, milestoneKey as any);
      if (res.error) throw new Error(res.error);
      
      toast.success("Link Pembayaran Berhasil Dibuat!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat link pembayaran.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleMarkAsPaid = async (milestoneId: string) => {
    setLoadingId(milestoneId);
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', milestoneId);

      if (error) throw error;
      toast.success("Termin Pembayaran Ditandai Lunas!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal mengupdate status.");
    } finally {
      setLoadingId(null);
    }
  };

  if (invoices.length === 0 && totalPrice > 0) {
     // Auto-generate if not exists but price is set
     // This might happen if ensureMilestoneInvoices wasn't called yet
     // We can show a button to generate
     return (
        <Card className="border-slate-200 shadow-sm border-dashed">
            <CardContent className="py-8 text-center flex flex-col items-center justify-center">
            <CreditCard className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-500 mb-4">Invoice belum dibuat.</p>
            <Button onClick={handleSaveConfig} disabled={isSavingConfig}>
                {isSavingConfig ? "Memproses..." : "Buat Invoice Termin"}
            </Button>
            </CardContent>
        </Card>
     );
  }

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <FileText className="h-4 w-4" /> Manajemen Termin Pembayaran
            </CardTitle>
            <CardDescription className="text-xs mt-1">Pantau arus kas berdasarkan progress pengerjaan.</CardDescription>
          </div>
          
          {!hasPaidInvoices && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsConfigOpen(!isConfigOpen)}
                className={cn("h-8 text-xs font-bold border-slate-200", isConfigOpen && "bg-slate-100")}
              >
                <Settings2 className="h-3.5 w-3.5 mr-2" />
                {isConfigOpen ? "Tutup Konfigurasi" : "Atur Termin"}
              </Button>
          )}
        </div>

        {/* CONFIGURATION PANEL */}
        {isConfigOpen && !hasPaidInvoices && (
            <div className="mt-4 bg-white p-4 rounded-xl border border-blue-100 shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-200">
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-500 uppercase">Besaran Down Payment (DP)</label>
                        <span className="text-sm font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{dpPercentage}%</span>
                    </div>
                    <Slider 
                        value={[dpPercentage]} 
                        onValueChange={(val) => setDpPercentage(val[0])} 
                        min={50}
                        max={100} 
                        step={10} 
                        className="py-2"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium px-1">
                        <span>Min 50%</span>
                        <span>100% (Langsung Lunas)</span>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Estimasi Pembagian Termin</p>
                    {previewAmounts.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                            <span className="text-slate-600 font-medium">{item.label} ({item.percentage}%)</span>
                            <span className="font-bold text-slate-900">{formatRupiah(item.amount)}</span>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end pt-2">
                    <Button 
                        size="sm" 
                        onClick={handleSaveConfig} 
                        disabled={isSavingConfig}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    >
                        {isSavingConfig ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-2" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-2" />}
                        Simpan Perubahan
                    </Button>
                </div>
            </div>
        )}

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
                Progress Penagihan: {Math.round(progressPercentage)}%
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
            const isPaid = milestone.status?.toLowerCase() === 'paid';
            const isPending = milestone.status?.toLowerCase() === 'pending';
            const isLoading = loadingId === milestone.milestone_key || loadingId === milestone.id;

            return (
              <div key={milestone.id} className="p-4 flex flex-col sm:flex-row gap-4 justify-between hover:bg-slate-50/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "flex-shrink-0 mt-0.5 h-10 w-10 rounded-full flex items-center justify-center border-2",
                    isPaid ? "bg-emerald-50 border-emerald-200 text-emerald-600" :
                    isPending ? "bg-amber-50 border-amber-200 text-amber-500" :
                    "bg-slate-50 border-slate-200 text-slate-400"
                  )}>
                    {isPaid ? <CheckCircle2 className="h-5 w-5" /> : 
                     isPending ? <Clock className="h-5 w-5" /> : 
                     <AlertCircle className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      {milestone.milestone_label || milestone.title}
                      <Badge variant="outline" className={cn(
                        "text-[10px] px-1.5 py-0 uppercase font-bold",
                        isPaid ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                        isPending ? "bg-amber-100 text-amber-700 border-amber-200" :
                        "bg-slate-100 text-slate-600 border-slate-200"
                      )}>
                        {milestone.status}
                      </Badge>
                    </h4>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      Nominal: <strong className="text-slate-800">{formatRupiah(parseFloat(milestone.amount.toString()))}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isPaid && (
                    <div className="flex gap-2 w-full sm:w-auto">
                       {milestone.xendit_payment_url ? (
                          <a href={milestone.xendit_payment_url} target="_blank" rel="noopener noreferrer">
                             <Button variant="outline" size="sm" className="h-9 font-bold border-blue-200 text-blue-700">
                               <ExternalLink className="h-4 w-4 mr-2" /> Link
                             </Button>
                          </a>
                       ) : (
                          <Button 
                            size="sm"
                            disabled={isLoading}
                            onClick={() => handleGenerateLink(milestone.milestone_key || '')}
                            className="h-9 font-bold bg-slate-900 text-white hover:bg-slate-800"
                          >
                            {isLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <><CreditCard className="h-3.5 w-3.5 mr-2" /> Buat Payment Link</>}
                          </Button>
                       )}
                       
                       {/* Manual Mark as Paid (Optional, for Admin override) */}
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         disabled={isLoading}
                         onClick={() => handleMarkAsPaid(milestone.id)}
                         className="h-9 w-9 p-0 rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                         title="Tandai Lunas Manual"
                       >
                          <CheckCircle2 className="h-4 w-4" />
                       </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
