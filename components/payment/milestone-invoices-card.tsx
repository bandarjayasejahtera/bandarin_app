"use client";

import { useMemo, useState, useTransition } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Loader2, Download, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InvoicePDF } from "@/components/payment/InvoicePDF";
import { createMilestonePaymentLink } from "@/actions/milestone-invoice-actions";

type InvoiceRow = {
  id: string;
  milestone_key: "dp" | "stage2" | "final";
  milestone_label: string;
  percentage: number;
  amount: number;
  status: "unpaid" | "pending" | "paid" | "expired" | "failed";
  xendit_invoice_url?: string | null;
};

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
  const [invoices] = useState<InvoiceRow[]>(initialInvoices);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const paidCount = useMemo(() => invoices.filter((i) => i.status === "paid").length, [invoices]);

  const handlePay = (row: InvoiceRow) => {
    setActiveKey(row.milestone_key);
    startTransition(async () => {
      const result = await createMilestonePaymentLink(orderId, row.milestone_key);
      setActiveKey(null);
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      if ("invoiceUrl" in result && result.invoiceUrl) {
        window.location.href = result.invoiceUrl;
      }
    });
  };

  return (
    <Card className="rounded-[2rem] p-2 border-slate-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
          Milestone-Based Invoicing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100">
          <p className="text-sm font-semibold text-slate-700">Progress pembayaran bertahap</p>
          <Badge variant="outline" className="font-bold">{paidCount}/{invoices.length} paid</Badge>
        </div>

        {invoices.map((row) => (
          <div key={row.id} className="rounded-xl border border-slate-100 p-4 bg-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900">{row.milestone_label}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {row.percentage}% - Rp {Number(row.amount || 0).toLocaleString("id-ID")}
                </p>
              </div>
              <Badge
                className={
                  row.status === "paid"
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200 border"
                    : row.status === "pending"
                    ? "bg-amber-100 text-amber-700 border-amber-200 border"
                    : "bg-slate-100 text-slate-600 border-slate-200 border"
                }
              >
                {row.status}
              </Badge>
            </div>

            <div className="mt-3 flex items-center gap-2">
              {row.status !== "paid" && (
                <Button
                  onClick={() => handlePay(row)}
                  disabled={isPending && activeKey === row.milestone_key}
                  className="h-9 rounded-lg"
                >
                  {isPending && activeKey === row.milestone_key ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  Bayar milestone
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
                fileName={`invoice-milestone-${orderId}.pdf`}
              >
                {({ loading }) => (
                  <Button variant="outline" className="h-9 rounded-lg">
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                    Unduh PDF
                  </Button>
                )}
              </PDFDownloadLink>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

