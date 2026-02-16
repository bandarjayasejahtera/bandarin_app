'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Memperbarui status dan detail pesanan (Admin Only)
 */
export async function updateOrderStatusAction(
  orderId: string, 
  updates: { 
    status?: string; 
    quoted_price?: number; 
    admin_notes?: string 
  }
) {
  const supabase = await createClient();

  // 1. Verifikasi Autentikasi & Role Admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') return { error: "Forbidden: Admin access required" };

  // 2. Eksekusi Update
  const { error } = await supabase
    .from('applications')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    console.error("Update Order Error:", error.message);
    return { error: error.message };
  }

  // 3. Revalidasi cache agar UI Dashboard & Detail Pesanan diperbarui
  revalidatePath('/admin');
  revalidatePath(`/admin/services/orders/${orderId}`);
  
  return { success: true };
}

/**
 * Mengambil semua pesanan untuk database klien di Admin
 */
export async function getAllOrdersAction() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      services(name, category),
      profiles(full_name, email, phone)
    `)
    .order('created_at', { ascending: false });

  if (error) return { error: error.message };
  return { data };
}