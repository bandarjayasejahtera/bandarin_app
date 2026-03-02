//actions/admin/order-actions.ts
'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/** Pesan notifikasi ramah pengguna per status pesanan */
function getNotificationForStatus(status: string): { title: string; message: string } {
  const messages: Record<string, { title: string; message: string }> = {
    quoted: {
      title: "Penawaran Harga Telah Dikirim",
      message: "Admin telah mengirimkan penawaran harga. Silakan lakukan pembayaran untuk melanjutkan pesanan Anda.",
    },
    paid: {
      title: "Pembayaran Diterima",
      message: "Pembayaran Anda telah dikonfirmasi. Tim kami akan segera memproses pesanan Anda.",
    },
    process: {
      title: "Pesanan Sedang Dikerjakan",
      message: "Pesanan Anda sedang dalam pengerjaan. Anda akan diberitahu ketika sudah selesai.",
    },
    review: {
      title: "Dokumen Dalam Review",
      message: "Dokumen Anda sedang ditinjau tim. Hasil akhir akan segera diserahkan.",
    },
    completed: {
      title: "Pesanan Selesai",
      message: "Pesanan Anda telah selesai. Dokumen hasil dapat diunduh di halaman detail pesanan.",
    },
    cancelled: {
      title: "Pesanan Dibatalkan",
      message: "Pesanan ini telah dibatalkan. Jika ada pertanyaan, silakan hubungi kami.",
    },
    pending: {
      title: "Pesanan Ditinjau",
      message: "Pesanan Anda sedang ditinjau oleh admin. Anda akan segera menerima penawaran harga.",
    },
  };
  return (
    messages[status] ?? {
      title: "Update Status Pesanan",
      message: "Ada pembaruan pada pesanan Anda. Silakan cek halaman detail pesanan.",
    }
  );
}

export async function updateOrderStatusAction(
  orderId: string, 
  updates: { status?: string; quoted_price?: number; admin_notes?: string }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Ambil data aplikasi untuk mendapatkan user_id klien
  const { data: app } = await supabase
    .from('applications')
    .select('user_id, company_name')
    .eq('id', orderId)
    .single();

  // Update data pengajuan
  const { error } = await supabase
    .from('applications')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (error) return { error: error.message };

  // --- NOTIFIKASI UNTUK KLIEN (judul & pesan ramah pengguna) ---
  if (updates.status && app) {
    const { title, message } = getNotificationForStatus(updates.status);
    await supabase.from('notifications').insert({
      user_id: app.user_id,
      title,
      message,
      link: `/client/applications/${orderId}`,
      is_read: false
    });
  }

  revalidatePath('/admin');
  revalidatePath(`/admin/services/orders/${orderId}`);
  revalidatePath('/client/applications');
  
  return { success: true };
}