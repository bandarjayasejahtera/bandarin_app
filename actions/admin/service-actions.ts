'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteServiceAction(serviceId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', serviceId);

  if (error) {
    console.error("Delete error:", error.message);
    return { error: error.message }; // Kembalikan error sebagai objek
  }

  revalidatePath('/admin/services');
  return { success: true };
}