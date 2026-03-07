// components/payment/milestone-invoices-card.tsx

"use client";

import { useMemo, useState, useEffect, useTransition } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Loader2, Download, CreditCard, ExternalLink, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InvoicePDF } from "@/components/payment/InvoicePDF";
import { createMilestonePaymentLink, type MilestoneKey } from "@/actions/milestone-invoice-actions";

// ── types ─────────────────────────────────────────────────────────────────────

type InvoiceStatus = "unpaid" | "pending" | "paid" | "expired" | "failed";

type InvoiceRow = {
  id: string;
  milestone_key: MilestoneKey;
  milestone_label: string;
  percentage: number;
  amount: number;
  status: InvoiceStatus;
  xendit_invoice_url?: string | null;
};

// ── helpers ───────────────────────────────────────────────────────────────────

function statusBadgeClass(status: InvoiceStatus): string {
  switch (status) {
    case "paid":    return "bg-emerald-100 text-emerald-700 border-emerald-200 border";
    case "pending": return "bg-amber-100 text-amber-700 border-amber-200 border";
    case "expired":
    case "failed":  return "bg-red-100 text-red-700 border-red-200 border";
    default:        return "bg-slate-100 text-slate-600 border-slate-200 border";
  }
}

// ── component ─────────────────────────────────────────────────────────────────

export function MilestoneInvoicesCard({
  orderId,
  clientName,
  serviceName,
  total,
  initialInvoices,
}: {
  orderId: string;
  clientName: string;
  serviceName: string;
  total: number;
  initialInvoices: InvoiceRow[];
}) {
  const supabase = createClient();

  const [invoices, setInvoices] = useState<InvoiceRow[]>(initialInvoices);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const paidCount = useMemo(() => invoices.filter((i) => i.status === "paid").length, [invoices]);

  // Realtime: update state invoice tanpa refresh halaman
  useEffect(() => {
    const channel = supabase
      .channel(`milestone-client-invoices-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "invoices", filter: `application_id=eq.${orderId}` },
        (payload) => {
          const updated = payload.new as Partial<InvoiceRow> & { id: string };
          setInvoices((prev) =>
            prev.map((inv) => (inv.id === updated.id ? { ...inv, ...updated } : inv)),
          );
          if (updated.status === "paid") {
            toast.success(`✅ ${updated.milestone_label ?? "Termin"} berhasil dibayar!`);
          } else if (updated.xendit_invoice_url && updated.status === "pending") {
            // Link baru tersedia (di-generate oleh admin) — tampilkan tanpa toast berlebihan
            setInvoices((prev) =>
              prev.map((inv) =>
                inv.id === updated.id ? { ...inv, xendit_invoice_url: updated.xendit_invoice_url } : inv,
              ),
            );
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId, supabase]);

  // Bayar — jika link sudah ada, langsung buka; jika belum, generate dulu
  const handlePay = (row: InvoiceRow) => {
    if (row.xendit_invoice_url) {
      window.open(row.xendit_invoice_url, "_blank");
      return;
    }

    setActiveKey(row.milestone_key);
    startTransition(async () => {
      const result = await createMilestonePaymentLink(orderId, row.milestone_key);
      setActiveKey(null);

      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      if ("invoiceUrl" in result && result.invoiceUrl) {
        // Update state lokal sebelum redirect agar tidak flash
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.id === row.id ? { ...inv, xendit_invoice_url: result.invoiceUrl!, status: "pending" } : inv,
          ),
        );
        window.open(result.invoiceUrl, "_blank");
      }
    });
  };

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <Card className="rounded-[2rem] p-2 border-slate-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
          Milestone-Based Invoicing
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress header */}
        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100">
          <p className="text-sm font-semibold text-slate-700">Progress pembayaran bertahap</p>
          <Badge variant="outline" className="font-bold">
            {paidCount}/{invoices.length} paid
          </Badge>
        </div>

        {invoices.map((row) => {
          const isLoading = isPending && activeKey === row.milestone_key;
          const hasUrl = !!row.xendit_invoice_url;

          return (
            <div key={row.id} className="rounded-xl border border-slate-100 p-4 bg-white">
              {/* Info termin */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">{row.milestone_label}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {row.percentage}% — Rp {Number(row.amount || 0).toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {row.status === "paid" && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                  <Badge className={statusBadgeClass(row.status)}>{row.status}</Badge>
                </div>
              </div>

              {/* Aksi */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {row.status !== "paid" && (
                  <Button
                    onClick={() => handlePay(row)}
                    disabled={isLoading}
                    className="h-9 rounded-lg"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : hasUrl ? (
                      <ExternalLink className="h-4 w-4 mr-2" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    {hasUrl ? "Buka Link Bayar" : "Bayar Sekarang"}
                  </Button>
                )}

                <PDFDownloadLink
                  document={
                    <InvoicePDF
                      orderId={orderId}
                      clientName={clientName}
                      serviceName={serviceName}
                      milestones={invoices}
                      total={total}
                    />
                  }
                  fileName={`invoice-${row.milestone_key}-${orderId}.pdf`}
                >
                  {({ loading }) => (
                    <Button variant="outline" className="h-9 rounded-lg">
                      {loading
                        ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        : <Download className="h-4 w-4 mr-2" />}
                      Unduh PDF
                    </Button>
                  )}
                </PDFDownloadLink>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
