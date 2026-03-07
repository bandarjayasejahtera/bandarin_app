// app/api/webhooks/xendit/route.ts
// ⚠️  PERHATIAN: File ini HARUS bernama route.ts (bukan ruote.ts)

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service Role — bypass RLS, HANYA boleh di server/webhook
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
  try {
    // 1. VERIFIKASI KEAMANAN: Cocokkan x-callback-token dari Xendit
    const callbackToken = request.headers.get('x-callback-token');
    if (callbackToken !== process.env.XENDIT_WEBHOOK_TOKEN) {
      console.warn('[XENDIT WEBHOOK] 🚨 Token tidak valid:', callbackToken?.slice(0, 8));
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // 2. Parse payload dari Xendit
    const body = await request.json();
    const { external_id, status, paid_at, amount } = body;

    console.log(`[XENDIT WEBHOOK] ▶ ${external_id} → ${status}`);

    if (!external_id || !status) {
      return NextResponse.json({ message: 'Payload tidak lengkap' }, { status: 400 });
    }

    // 3. Cari order berdasarkan payment_invoice_id, SERTA ambil data Profil dan Service
    // 3a. Cek apakah ini invoice milestone
    const { data: milestoneInvoice, error: milestoneErr } = await supabaseAdmin
      .from('invoices')
      .select('id, application_id, status, milestone_label, xendit_external_id')
      .eq('xendit_external_id', external_id)
      .single();

    if (!milestoneErr && milestoneInvoice) {
      if (status === 'PAID' || status === 'SETTLED') {
        await supabaseAdmin
          .from('invoices')
          .update({
            status: 'paid',
            paid_at: paid_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', milestoneInvoice.id);
      } else if (status === 'EXPIRED') {
        await supabaseAdmin
          .from('invoices')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('id', milestoneInvoice.id);
      } else if (status === 'FAILED') {
        await supabaseAdmin
          .from('invoices')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', milestoneInvoice.id);
      }

      return NextResponse.json({ message: 'Milestone invoice processed' }, { status: 200 });
    }

    // 3b. Legacy flow: payment_invoice_id pada applications
    const { data: order, error: findError } = await supabaseAdmin
      .from('applications')
      .select(`
        id, 
        user_id, 
        company_name, 
        payment_status, 
        quoted_price,
        profiles:profiles!applications_userid_fkey (full_name),
        services:services!applications_service_id_fkey (name)
      `)
      .eq('payment_invoice_id', external_id)
      .single();

    if (findError || !order) {
      console.warn(`[XENDIT WEBHOOK] Invoice tidak dikenal: ${external_id} — diabaikan`);
      return NextResponse.json({ message: 'Invoice tidak ditemukan, diabaikan' }, { status: 200 });
    }

    // ========================================================================
    // 🚀 LOGIKA FALLBACK NAMA: Cegah kata "null" muncul di notifikasi
    // ========================================================================
    // Ambil nama klien dengan aman
    const clientName = Array.isArray(order.profiles) 
      ? order.profiles[0]?.full_name 
      : order.profiles?.full_name || 'Klien';

    // Ambil nama layanan dengan aman
    const serviceName = Array.isArray(order.services) 
      ? order.services[0]?.name 
      : order.services?.name || 'Layanan';

    // Format target notifikasi (Contoh: "Pendirian PT - PT Sukses Makmur" atau sekadar "Pendirian PT")
    const displayTarget = order.company_name 
      ? `${serviceName} (${order.company_name})` 
      : serviceName;
    // ========================================================================

    // 4. Proses berdasarkan status Xendit
    if (status === 'PAID' || status === 'SETTLED') {
      // Cegah update duplikat
      if (order.payment_status === 'paid') {
        console.log(`[XENDIT WEBHOOK] Order ${order.id} sudah paid, skip.`);
        return NextResponse.json({ message: 'Already processed' }, { status: 200 });
      }

      // Update: payment_status=paid, status workflow=process
      const { error: updateError } = await supabaseAdmin
        .from('applications')
        .update({
          payment_status: 'paid',
          status: 'process',
          payment_paid_at: paid_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (updateError) {
        console.error('[XENDIT WEBHOOK] Gagal update DB:', updateError.message);
        return NextResponse.json({ message: 'Gagal update database' }, { status: 500 });
      }

      // Format rupiah untuk notifikasi
      const nominalBayar = amount
        ? `Rp ${Number(amount).toLocaleString('id-ID')}`
        : order.quoted_price
        ? `Rp ${Number(order.quoted_price).toLocaleString('id-ID')}`
        : '';

      // Notifikasi ke KLIEN
      await supabaseAdmin.from('notifications').insert({
        user_id: order.user_id,
        title: '✅ Pembayaran Berhasil!',
        message: `Pembayaran${nominalBayar ? ` ${nominalBayar}` : ''} untuk ${displayTarget} telah dikonfirmasi. Tim Bandarin segera memproses pengajuan Anda.`,
        link: `/client/applications/${order.id}`,
        is_read: false,
      });

      // Notifikasi ke ADMIN
      const { data: admin } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .single();

      if (admin) {
        await supabaseAdmin.from('notifications').insert({
          user_id: admin.id,
          title: '💰 Pembayaran Masuk!',
          message: `${clientName} telah membayar${nominalBayar ? ` ${nominalBayar}` : ''} untuk ${displayTarget}. Segera mulai pengerjaan.`,
          link: `/admin/services/orders/${order.id}`,
          is_read: false,
        });
      }

      // Log event ke application_logs
      void supabaseAdmin
        .from('application_logs')
        .insert({
          application_id: order.id,
          status_title: 'Pembayaran Dikonfirmasi',
          description: `Invoice ${external_id} berhasil dibayar${nominalBayar ? ` sebesar ${nominalBayar}` : ''} oleh ${clientName}. Status berubah ke Proses Pengerjaan.`,
          timestamp: new Date().toISOString(),
        })
        .then(() => {}, () => {}); // Fire-and-forget

      console.log(`[XENDIT WEBHOOK] ✅ Order ${order.id} berhasil dibayar → process`);

    } else if (status === 'EXPIRED') {
      await supabaseAdmin
        .from('applications')
        .update({ payment_status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', order.id);

      await supabaseAdmin.from('notifications').insert({
        user_id: order.user_id,
        title: '⏰ Invoice Kadaluarsa',
        message: `Invoice pembayaran untuk ${displayTarget} telah habis masa berlakunya. Hubungi admin untuk menerbitkan invoice baru.`,
        link: `/client/applications/${order.id}`,
        is_read: false,
      });

      console.log(`[XENDIT WEBHOOK] ⏰ Invoice ${external_id} kadaluarsa.`);

    } else if (status === 'FAILED') {
      await supabaseAdmin
        .from('applications')
        .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', order.id);

      console.log(`[XENDIT WEBHOOK] ❌ Invoice ${external_id} gagal.`);
    }

    return NextResponse.json({ message: 'Webhook berhasil diproses' }, { status: 200 });

  } catch (error) {
    console.error('[XENDIT WEBHOOK] ❌ Server Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}