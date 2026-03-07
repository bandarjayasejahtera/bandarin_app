// app/api/webhooks/xendit/route.ts
// ⚠️  PERHATIAN: File ini HARUS bernama route.ts (bukan ruote.ts)

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

// Helper: ambil full_name / name dari relasi Supabase (bisa array atau single object)
function getProfileName(profiles: { full_name?: string } | { full_name?: string }[] | null | undefined): string {
  if (!profiles) return 'Klien';
  const p = Array.isArray(profiles) ? profiles[0] : profiles;
  return p?.full_name ?? 'Klien';
}
function getServiceName(services: { name?: string } | { name?: string }[] | null | undefined): string {
  if (!services) return 'Layanan';
  const s = Array.isArray(services) ? services[0] : services;
  return s?.name ?? 'Layanan';
}

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

    // ========================================================================
    // 3A. ALUR PEMBAYARAN MILESTONE (TERMIN)
    // ========================================================================
    const { data: milestoneInvoice, error: milestoneErr } = await supabaseAdmin
      .from('invoices')
      .select('id, application_id, status, milestone_label, milestone_key, xendit_external_id')
      .eq('xendit_external_id', external_id)
      .single();

    if (!milestoneErr && milestoneInvoice) {
      if (status === 'PAID' || status === 'SETTLED') {
        // Cegah update duplikat
        if (milestoneInvoice.status === 'paid') {
          return NextResponse.json({ message: 'Milestone already processed' }, { status: 200 });
        }

        // 1. Update status termin menjadi lunas
        await supabaseAdmin
          .from('invoices')
          .update({
            status: 'paid',
            paid_at: paid_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', milestoneInvoice.id);

        // Revalidate cache halaman admin & client
        revalidatePath(`/admin/services/orders/${milestoneInvoice.application_id}`);
        revalidatePath(`/client/applications/${milestoneInvoice.application_id}`);

        // 2. Ambil data aplikasi untuk notifikasi
        const { data: order } = await supabaseAdmin
          .from('applications')
          .select(`
            id, user_id, company_name, quoted_price, status,
            profiles:profiles!applications_userid_fkey (full_name),
            services:services!applications_service_id_fkey (name)
          `)
          .eq('id', milestoneInvoice.application_id)
          .single();

        if (order) {
          const clientName = getProfileName(order.profiles as { full_name?: string } | { full_name?: string }[] | null);
          const serviceName = getServiceName(order.services as { name?: string } | { name?: string }[] | null);
          const displayTarget = order.company_name ? `${serviceName} (${order.company_name})` : serviceName;
          const nominalBayar = amount ? `Rp ${Number(amount).toLocaleString('id-ID')}` : '';

          // 3. Notifikasi ke KLIEN
          await supabaseAdmin.from('notifications').insert({
            user_id: order.user_id,
            title: `✅ Termin ${milestoneInvoice.milestone_label} Berhasil!`,
            message: `Pembayaran termin ${milestoneInvoice.milestone_label}${nominalBayar ? ` ${nominalBayar}` : ''} untuk ${displayTarget} telah dikonfirmasi.`,
            link: `/client/applications/${order.id}`,
            is_read: false,
          });

          // 4. Notifikasi ke ADMIN
          const { data: admin } = await supabaseAdmin.from('profiles').select('id').eq('role', 'admin').limit(1).single();
          if (admin) {
            await supabaseAdmin.from('notifications').insert({
              user_id: admin.id,
              title: `💰 Pembayaran Termin Masuk!`,
              message: `${clientName} telah membayar termin ${milestoneInvoice.milestone_label}${nominalBayar ? ` ${nominalBayar}` : ''} untuk ${displayTarget}.`,
              link: `/admin/services/orders/${order.id}`,
              is_read: false,
            });
          }

          // 5. Log Event
          void supabaseAdmin.from('application_logs').insert({
            application_id: order.id,
            status_title: `Pembayaran ${milestoneInvoice.milestone_label} Dikonfirmasi`,
            description: `Invoice termin ${external_id} berhasil dibayar${nominalBayar ? ` sebesar ${nominalBayar}` : ''} oleh ${clientName}.`,
            timestamp: new Date().toISOString(),
          }).then(() => {}, () => {});

          // 6. LOGIKA BISNIS: Jika yang dibayar adalah DP, ubah status order jadi "process" agar pekerjaan dimulai
          if (milestoneInvoice.milestone_key === 'dp' && order.status === 'pending') {
            await supabaseAdmin.from('applications')
              .update({ status: 'process', updated_at: new Date().toISOString() })
              .eq('id', order.id);
          }
        }

      } else if (status === 'EXPIRED') {
        await supabaseAdmin.from('invoices').update({ status: 'expired', updated_at: new Date().toISOString() }).eq('id', milestoneInvoice.id);
      } else if (status === 'FAILED') {
        await supabaseAdmin.from('invoices').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', milestoneInvoice.id);
      }

      return NextResponse.json({ message: 'Milestone invoice processed' }, { status: 200 });
    }


    // ========================================================================
    // 3B. ALUR PEMBAYARAN PENUH (LEGACY FLOW)
    // ========================================================================
    const { data: order, error: findError } = await supabaseAdmin
      .from('applications')
      .select(`
        id, user_id, company_name, payment_status, quoted_price,
        profiles:profiles!applications_userid_fkey (full_name),
        services:services!applications_service_id_fkey (name)
      `)
      .eq('payment_invoice_id', external_id)
      .single();

    if (findError || !order) {
      console.warn(`[XENDIT WEBHOOK] Invoice tidak dikenal: ${external_id} — diabaikan`);
      return NextResponse.json({ message: 'Invoice tidak ditemukan, diabaikan' }, { status: 200 });
    }

    const clientName = getProfileName(order.profiles as { full_name?: string } | { full_name?: string }[] | null);
    const serviceName = getServiceName(order.services as { name?: string } | { name?: string }[] | null);
    const displayTarget = order.company_name ? `${serviceName} (${order.company_name})` : serviceName;

    if (status === 'PAID' || status === 'SETTLED') {
      if (order.payment_status === 'paid') return NextResponse.json({ message: 'Already processed' }, { status: 200 });

      await supabaseAdmin.from('applications').update({
        payment_status: 'paid', status: 'process', payment_paid_at: paid_at || new Date().toISOString(), updated_at: new Date().toISOString(),
      }).eq('id', order.id);

      const nominalBayar = amount ? `Rp ${Number(amount).toLocaleString('id-ID')}` : order.quoted_price ? `Rp ${Number(order.quoted_price).toLocaleString('id-ID')}` : '';

      await supabaseAdmin.from('notifications').insert({
        user_id: order.user_id, title: '✅ Pembayaran Berhasil!', message: `Pembayaran${nominalBayar ? ` ${nominalBayar}` : ''} untuk ${displayTarget} telah dikonfirmasi.`, link: `/client/applications/${order.id}`, is_read: false,
      });

      const { data: admin } = await supabaseAdmin.from('profiles').select('id').eq('role', 'admin').limit(1).single();
      if (admin) {
        await supabaseAdmin.from('notifications').insert({
          user_id: admin.id, title: '💰 Pembayaran Masuk!', message: `${clientName} telah membayar${nominalBayar ? ` ${nominalBayar}` : ''} untuk ${displayTarget}.`, link: `/admin/services/orders/${order.id}`, is_read: false,
        });
      }

      void supabaseAdmin.from('application_logs').insert({
        application_id: order.id, status_title: 'Pembayaran Dikonfirmasi', description: `Invoice ${external_id} berhasil dibayar${nominalBayar ? ` sebesar ${nominalBayar}` : ''} oleh ${clientName}. Status berubah ke Proses Pengerjaan.`, timestamp: new Date().toISOString(),
      }).then(() => {}, () => {}); 

    } else if (status === 'EXPIRED') {
      await supabaseAdmin.from('applications').update({ payment_status: 'expired', updated_at: new Date().toISOString() }).eq('id', order.id);
    } else if (status === 'FAILED') {
      await supabaseAdmin.from('applications').update({ payment_status: 'failed', updated_at: new Date().toISOString() }).eq('id', order.id);
    }

    return NextResponse.json({ message: 'Webhook berhasil diproses' }, { status: 200 });

  } catch (error) {
    console.error('[XENDIT WEBHOOK] ❌ Server Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}