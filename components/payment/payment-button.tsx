// components/payment/payment-button.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { createPaymentToken } from '@/actions/payment';
import { toast } from 'sonner';

interface Props {
  applicationId: string;
  hasExistingInvoice?: boolean; // true jika sudah ada invoice sebelumnya
}

export default function PaymentButton({ applicationId, hasExistingInvoice = false }: Props) {
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

      if (result.invoiceUrl) {
        toast.loading('Mengarahkan ke halaman pembayaran Xendit yang aman...', {
          duration: 3000,
        });
        // Sedikit delay agar toast terlihat sebelum redirect
        await new Promise((r) => setTimeout(r, 1500));
        window.location.href = result.invoiceUrl;
      } else {
        toast.error('Gagal mendapatkan link pembayaran.');
        setLoading(false);
      }
    } catch {
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePay}
      disabled={loading}
      className="w-full md:w-auto h-16 px-10 bg-white text-blue-600 font-black rounded-2xl text-lg shadow-xl hover:bg-slate-50 transition-all active:scale-95 flex gap-3 disabled:opacity-70"
    >
      {loading ? (
        <Loader2 className="animate-spin h-6 w-6" />
      ) : (
        <CreditCard className="h-6 w-6" />
      )}
      {loading ? 'MENYIAPKAN...' : hasExistingInvoice ? 'LANJUTKAN PEMBAYARAN' : 'BAYAR SEKARANG'}
    </Button>
  );
}
