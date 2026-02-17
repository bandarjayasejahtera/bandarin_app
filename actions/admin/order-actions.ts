//actions/admin/order-actions.ts
'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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

  // --- TRIGGER NOTIFIKASI UNTUK KLIEN ---
  if (updates.status && app) {
    await supabase.from('notifications').insert({
      user_id: app.user_id,
      title: "Update Status Pesanan",
      message: `Pesanan ${app.company_name} Anda kini berstatus: ${updates.status}`,
      link: `/client/applications/${orderId}`, // Link untuk klien melihat detail pembaruan
      is_read: false
    });
  }

  revalidatePath('/admin');
  revalidatePath(`/admin/services/orders/${orderId}`);
  revalidatePath('/client/applications');
  
  return { success: true };
}