// actions/payment.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { Xendit } from 'xendit-node';

export async function createPaymentToken(id: string) {
  try {
    const supabase = await createClient();

    // 1. Verifikasi user login
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'Silakan login terlebih dahulu.' };

    // 2. Ambil data order
    const { data: order, error: orderError } = await supabase
      .from('applications')
      .select('*, services:services!applications_service_id_fkey (name)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) return { error: 'Data pesanan tidak ditemukan.' };

    // 3. Validasi status
    if (!['quoted', 'pending'].includes(order.status)) {
      return { error: 'Pesanan tidak dalam status yang dapat dibayar.' };
    }

    if (!order.quoted_price || Number(order.quoted_price) <= 0) {
      return { error: 'Harga belum ditetapkan oleh admin. Tunggu konfirmasi harga terlebih dahulu.' };
    }

    // 4. Jika sudah ada invoice aktif yang belum expired, kembalikan URL-nya
    if (order.payment_status === 'paid') {
      return { error: 'Pembayaran sudah dikonfirmasi. Tidak perlu membayar kembali.' };
    }

    // 5. Inisialisasi Xendit
    if (!process.env.XENDIT_SECRET_KEY) {
      console.error('[PAYMENT] XENDIT_SECRET_KEY tidak ditemukan di environment.');
      return { error: 'Konfigurasi payment gateway belum diatur. Hubungi admin.' };
    }

    const xenditClient = new Xendit({ secretKey: process.env.XENDIT_SECRET_KEY });

    // 6. Generate invoice ID unik
    const invoiceId = `ORDER-${order.id.slice(0, 8).toUpperCase()}-${Date.now()}`;
    const serviceName = order.services?.name
      ? String(order.services.name).substring(0, 100)
      : 'Layanan Legalitas Bandarin';

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // 7. Buat invoice Xendit
    const invoiceData = {
      externalId: invoiceId,
      amount: Number(order.quoted_price),
      description: serviceName,
      currency: 'IDR',
      customer: {
        givenNames: order.company_name || 'Klien Bandarin',
        email: user.email,
      },
      invoiceDuration: 86400, // 24 jam
      successRedirectUrl: `${appUrl}/client/applications/${order.id}?payment=success`,
      failureRedirectUrl: `${appUrl}/client/applications/${order.id}?payment=failed`,
      // Aktifkan semua metode pembayaran
      paymentMethods: ['BCA', 'BNI', 'BRI', 'MANDIRI', 'PERMATA', 'OVO', 'DANA', 'GOPAY', 'SHOPEEPAY', 'QRIS'],
    };

    const invoice = await xenditClient.Invoice.createInvoice({ data: invoiceData });

    if (!invoice?.invoiceUrl) {
      return { error: 'Gagal mendapatkan URL pembayaran dari Xendit.' };
    }

    // 8. Simpan invoice_id ke database
    await supabase
      .from('applications')
      .update({
        payment_invoice_id: invoiceId,
        payment_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    console.log(`[PAYMENT] ✅ Invoice dibuat: ${invoiceId} untuk order ${id}`);

    return { invoiceUrl: invoice.invoiceUrl, invoiceId };
  } catch (err: any) {
    console.error('[PAYMENT] ❌ Xendit Error:', err?.message || err);
    return { error: 'Gagal membuat invoice. Pastikan konfigurasi Xendit sudah benar.' };
  }
}

// Cek status pembayaran terkini
export async function getPaymentStatus(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('applications')
    .select('id, payment_status, payment_invoice_id, payment_paid_at, quoted_price, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  return data;
}

// Reset payment oleh admin (untuk invoice expired)
export async function adminResetPayment(orderId: string) {
  const supabase = await createClient();

  // Validasi admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') return { error: 'Forbidden' };

  const { error } = await supabase
    .from('applications')
    .update({
      payment_status: 'pending',
      payment_invoice_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) return { error: error.message };

  return { success: true };
}
