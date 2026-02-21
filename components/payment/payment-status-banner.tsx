// components/payment/payment-status-banner.tsx
// Komponen ini menampilkan status pembayaran yang berbeda:
// - QUOTED: Tampilkan harga + tombol bayar
// - PAID: Konfirmasi pembayaran berhasil (hijau)
// - EXPIRED: Peringatan invoice kadaluarsa (amber)
// - PENDING: Menunggu pembayaran

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Receipt,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import PaymentButton from './payment-button';

interface PaymentStatusBannerProps {
  applicationId: string;
  status: string; // status aplikasi (quoted/process/etc)
  paymentStatus: string | null; // pending/paid/expired/failed
  quotedPrice: number | null;
  paymentPaidAt?: string | null;
  paymentInvoiceId?: string | null;
  isAdmin?: boolean;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
}

export function PaymentStatusBanner({
  applicationId,
  status,
  paymentStatus,
  quotedPrice,
  paymentPaidAt,
  paymentInvoiceId,
  isAdmin = false,
}: PaymentStatusBannerProps) {
  // ===== PAID — Konfirmasi Sukses =====
  if (paymentStatus === 'paid') {
    return (
      <Card className="bg-emerald-600 text-white p-8 md:p-10 rounded-[3rem] border-none shadow-2xl shadow-emerald-200 overflow-hidden relative group">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-200" />
              <Badge className="bg-emerald-500 text-white border-none font-black text-[10px] uppercase tracking-widest">
                Pembayaran Dikonfirmasi
              </Badge>
            </div>
            <h2 className="text-xl font-bold uppercase opacity-80 mb-1">Total Dibayar</h2>
            <div className="text-5xl font-black tracking-tighter">
              {quotedPrice ? formatRupiah(quotedPrice) : '—'}
            </div>
            {paymentPaidAt && (
              <p className="text-emerald-200 text-sm mt-2 font-medium">
                Dibayar pada{' '}
                {format(new Date(paymentPaidAt), "dd MMM yyyy 'pukul' HH:mm", { locale: idLocale })}
              </p>
            )}
            {paymentInvoiceId && (
              <p className="text-emerald-300 text-[11px] mt-1 font-mono opacity-80">
                Ref: {paymentInvoiceId}
              </p>
            )}
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <p className="text-emerald-200 text-xs font-bold text-center">
              Tim Bandarin sedang<br />memproses pengajuan Anda
            </p>
          </div>
        </div>
        {/* Dekorasi */}
        <div className="absolute top-0 right-0 h-40 w-40 bg-white opacity-5 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-700" />
      </Card>
    );
  }

  // ===== EXPIRED — Invoice Kadaluarsa =====
  if (paymentStatus === 'expired') {
    return (
      <Card className="bg-amber-50 border-2 border-amber-200 p-8 rounded-[3rem] shadow-sm overflow-hidden relative">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-black text-amber-800 mb-1">Invoice Kadaluarsa</h3>
            <p className="text-amber-700 font-medium">
              Link pembayaran Anda sudah melewati batas waktu 24 jam.
              {isAdmin ? ' Silakan reset payment untuk menerbitkan invoice baru.' : ' Hubungi admin untuk menerbitkan invoice baru.'}
            </p>
            {quotedPrice && (
              <p className="text-amber-600 font-black text-lg mt-2">
                Tagihan: {formatRupiah(quotedPrice)}
              </p>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // ===== QUOTED — Tampilkan Tagihan & Tombol Bayar =====
  if (status === 'quoted' && quotedPrice && quotedPrice > 0) {
    return (
      <Card className="bg-blue-600 text-white p-8 md:p-10 rounded-[3rem] border-none shadow-2xl shadow-blue-200 overflow-hidden relative group">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <Badge className="bg-blue-500 text-white border-none mb-4 uppercase font-black text-[10px] tracking-widest">
              Penawaran Tersedia
            </Badge>
            <h2 className="text-xl font-bold uppercase opacity-80 mb-1">Total Tagihan</h2>
            <div className="text-5xl font-black tracking-tighter">
              {formatRupiah(quotedPrice)}
            </div>
            <p className="text-blue-200 text-sm mt-2 font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Link pembayaran berlaku 24 jam setelah dibuat
            </p>
          </div>

          {isAdmin ? (
            // Admin: tampilkan keterangan menunggu pembayaran
            <div className="flex flex-col items-center gap-3 bg-white/10 rounded-2xl px-8 py-6">
              <Receipt className="h-8 w-8 text-blue-200" />
              <p className="text-white font-bold text-center text-sm">
                Menunggu Pembayaran Klien
              </p>
              <p className="text-blue-200 text-xs text-center">
                Klien akan diarahkan ke halaman<br />pembayaran Xendit
              </p>
            </div>
          ) : (
            // Klien: tombol bayar
            <PaymentButton applicationId={applicationId} />
          )}
        </div>
        {/* Dekorasi */}
        <div className="absolute top-0 right-0 h-40 w-40 bg-white opacity-5 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-700" />
      </Card>
    );
  }

  // Tidak ada yang perlu ditampilkan (status belum quoted atau harga belum diisi)
  return null;
}
