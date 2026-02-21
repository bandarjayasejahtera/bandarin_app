// actions/payment.ts
'use server'

import { createClient } from "@/utils/supabase/server";
import { Xendit } from 'xendit-node';

export async function createPaymentToken(id: string) {
  try {
    const supabase = await createClient();

    // 1. Verifikasi User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Silakan login terlebih dahulu." };

    // 2. Ambil data order
    const { data: order, error: orderError } = await supabase
      .from('applications')
      .select('*, services:services!applications_service_id_fkey (name)')
      .eq('id', id)
      .single();

    if (orderError || !order) return { error: "Data pesanan tidak ditemukan." };
    if (!order.quoted_price || order.quoted_price <= 0) return { error: "Harga tidak valid." };

    // 3. Inisialisasi Xendit Client
    if (!process.env.XENDIT_SECRET_KEY) {
      return { error: "Kunci Xendit tidak ditemukan di konfigurasi server." };
    }
    const xenditClient = new Xendit({ secretKey: process.env.XENDIT_SECRET_KEY });

    // 4. Generate Invoice ID Unik
    const invoiceId = `ORDER-${order.id.slice(0, 8).toUpperCase()}-${Date.now()}`;
    const serviceName = order.services?.name ? order.services.name.substring(0, 100) : "Layanan Bandarin";

    // 5. Buat Invoice Xendit
    const data = {
      externalId: invoiceId,
      amount: order.quoted_price,
      description: serviceName,
      customer: {
        givenNames: order.company_name || "Klien Bandarin",
        email: user.email,
        mobileNumber: order.form_data?.phone || undefined,
      },
      // Klien akan otomatis dikembalikan ke halaman pesanan setelah sukses/gagal bayar
      successRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/client/applications/${order.id}`,
      failureRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/client/applications/${order.id}`,
      currency: "IDR",
    };

    const invoice = await xenditClient.Invoice.createInvoice({ data });

    // 6. Simpan Invoice ID ke Supabase
    await supabase
      .from('applications')
      .update({ 
        payment_invoice_id: invoiceId,
        payment_status: 'pending' 
      })
      .eq('id', id);

    // 7. Kembalikan URL Invoice Xendit ke Client
    return { invoiceUrl: invoice.invoiceUrl };

  } catch (err: any) {
    console.error("❌ XENDIT ERROR:", err);
    return { error: "Gagal membuat invoice Xendit. Cek terminal VS Code." };
  }
}