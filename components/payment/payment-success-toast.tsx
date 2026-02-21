// components/payment/payment-success-toast.tsx
// Komponen ini membaca query param ?payment=success/failed dari redirect Xendit
// dan menampilkan toast notification yang sesuai.
'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Props {
  paymentParam?: string;
}

export function PaymentSuccessToast({ paymentParam }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!paymentParam) return;

    if (paymentParam === 'success') {
      toast.success('🎉 Pembayaran berhasil dikonfirmasi!', {
        description: 'Status pengajuan Anda kini sedang diproses oleh tim Bandarin.',
        duration: 6000,
      });
    } else if (paymentParam === 'failed') {
      toast.error('❌ Pembayaran gagal atau dibatalkan', {
        description: 'Silakan coba lagi atau hubungi admin jika mengalami kendala.',
        duration: 6000,
      });
    }

    // Bersihkan query param dari URL tanpa reload halaman
    router.replace(window.location.pathname, { scroll: false });
  }, [paymentParam, router]);

  return null; // Komponen ini tidak me-render UI
}
