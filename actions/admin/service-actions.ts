//actions/admin/service-actions.ts
'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/** Mengembalikan jumlah pesanan (applications) yang menggunakan layanan ini. */
export async function getServiceUsageAction(serviceId: string): Promise<{ count: number; error?: string }> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('service_id', serviceId);

  if (error) return { count: 0, error: error.message };
  return { count: count ?? 0 };
}

export async function deleteServiceAction(serviceId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', serviceId);

  if (error) {
    console.error("Delete error:", error.message);
    return { error: error.message };
  }

  revalidatePath('/admin/services');
  return { success: true };
}