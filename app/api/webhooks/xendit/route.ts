//app/api/webhooks/xendit/route.ts

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

// Gunakan Service Role untuk bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
  try {
    // 1. Verifikasi Token Webhook
    const callbackToken = request.headers.get('x-callback-token');
    if (callbackToken !== process.env.XENDIT_WEBHOOK_TOKEN) {
      console.error('[XENDIT] Token tidak valid');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { external_id, status, paid_at, amount } = body;

    console.log(`[XENDIT] Callback diterima: ${external_id} - Status: ${status}`);

    // 2. Cari Invoice Milestone berdasarkan External ID
    const { data: invoice, error: fetchErr } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('xendit_external_id', external_id)
      .single();

    if (fetchErr || !invoice) {
      console.error(`[XENDIT] Invoice tidak ditemukan di DB: ${external_id}`);
      return NextResponse.json({ message: 'Invoice not found' }, { status: 200 });
    }

    // 3. Proses jika status PAID atau SETTLED
    if (status === 'PAID' || status === 'SETTLED') {
      if (invoice.status === 'paid') {
        return NextResponse.json({ message: 'Already processed' });
      }

      // A. Update status invoice ke LUNAS
      const { error: invErr } = await supabaseAdmin
        .from('invoices')
        .update({ 
          status: 'paid', 
          paid_at: paid_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invoice.id);

      if (invErr) throw invErr;

      // B. Logika Bisnis: Jika DP Lunas, aktifkan Aplikasi
      if (invoice.milestone_key === 'dp') {
        await supabaseAdmin
          .from('applications')
          .update({ 
            status: 'process', // Pastikan status ini sesuai dengan enum di DB Anda
            updated_at: new Date().toISOString() 
          })
          .eq('id', invoice.application_id);

        // Catat di Logs
        await supabaseAdmin.from('application_logs').insert({
          application_id: invoice.application_id,
          status_title: 'Pembayaran DP Diterima',
          description: `Pembayaran ${external_id} sebesar Rp ${amount.toLocaleString()} berhasil.`,
          timestamp: new Date().toISOString()
        });
      }

      // C. Paksa pembersihan cache (Revalidate) agar status di UI berubah
      revalidatePath(`/admin/services/orders/${invoice.application_id}`);
      revalidatePath(`/client/applications/${invoice.application_id}`);
      
      console.log(`[XENDIT] Berhasil memproses: ${external_id}`);
    }

    return NextResponse.json({ message: 'Success' });
  } catch (error: any) {
    console.error('[XENDIT ERROR]', error.message);
    return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
  }
}