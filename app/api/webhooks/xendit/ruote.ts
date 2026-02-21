//app/api/webhooks/xendit/ruote.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // 1. VERIFIKASI KEAMANAN (PENTING!)
    // Ambil token dari header 'x-callback-token' yang dikirim Xendit
    const callbackToken = request.headers.get('x-callback-token');
    
    // Cocokkan dengan token di .env.local Anda
    if (callbackToken !== process.env.XENDIT_WEBHOOK_TOKEN) {
      console.warn("[XENDIT WEBHOOK] 🚨 Akses Ditolak: Token tidak valid atau tidak ada.");
      return NextResponse.json({ message: 'Unauthorized / Forbidden' }, { status: 403 });
    }

    // 2. Jika aman, ambil data payload
    const body = await request.json();
    console.log("[XENDIT WEBHOOK] Notifikasi masuk aman:", body.external_id, body.status);

    const { external_id, status, paid_at } = body;

    if (!external_id || !status) {
      return NextResponse.json({ message: 'Payload tidak lengkap' }, { status: 400 });
    }

    // 3. Update Database berdasarkan Status Xendit
    if (status === 'PAID' || status === 'SETTLED') {
      const { error } = await supabaseAdmin
        .from('applications')
        .update({
          payment_status: 'paid',
          status: 'paid', // Mengubah timeline
          payment_paid_at: paid_at || new Date().toISOString()
        })
        .eq('payment_invoice_id', external_id);

      if (error) {
        console.error("[XENDIT WEBHOOK] Gagal update DB:", error.message);
        return NextResponse.json({ message: 'Gagal update database' }, { status: 500 });
      }
      
      console.log(`[XENDIT WEBHOOK] ✅ Sukses! Order ${external_id} telah dibayar.`);
    } 
    else if (status === 'EXPIRED') {
      await supabaseAdmin
        .from('applications')
        .update({ payment_status: 'expired' })
        .eq('payment_invoice_id', external_id);
    }

    // 4. Beri respon 200 OK agar Xendit tahu pesan sudah diterima
    return NextResponse.json({ message: 'Webhook berhasil diproses' }, { status: 200 });

  } catch (error) {
    console.error("[XENDIT WEBHOOK] ❌ Terjadi Kesalahan Server:", error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}