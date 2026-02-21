//components/payment/payment-button.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { createPaymentToken } from "@/actions/payment";
import { toast } from "sonner";

export default function PaymentButton({ applicationId }: { applicationId: string }) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    
    try {
      const result = await createPaymentToken(applicationId);

      if (result.error) {
        toast.error(result.error);
        setLoading(false);
        return;
      }

      // Jika berhasil mendapatkan URL Invoice Xendit, arahkan klien ke sana
      if (result.invoiceUrl) {
        toast.loading("Mengarahkan ke halaman pembayaran aman Xendit...", { duration: 2000 });
        window.location.href = result.invoiceUrl;
      } else {
        toast.error("Gagal mendapatkan link pembayaran.");
        setLoading(false);
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem.");
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handlePay} 
      disabled={loading}
      className="w-full md:w-auto h-16 px-10 bg-white text-blue-600 font-black rounded-2xl text-lg shadow-xl hover:bg-slate-50 transition-all active:scale-95 flex gap-3"
    >
      {loading ? <Loader2 className="animate-spin" /> : <CreditCard className="h-6 w-6" />}
      {loading ? "MENYIAPKAN..." : "LANJUT PEMBAYARAN"}
    </Button>
  );
}