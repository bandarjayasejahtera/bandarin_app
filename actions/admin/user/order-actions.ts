//actions/admin/user/order-actions.ts

'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { applicationSchema, type ApplicationInput } from "@/lib/validators/order";

export async function createApplicationAction(formData: ApplicationInput) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi berakhir, silakan login kembali." };

  // Validasi data menggunakan Zod schema yang sudah kita buat
  const validatedFields = applicationSchema.safeParse(formData);
  if (!validatedFields.success) {
    return { error: "Pastikan semua data terisi dengan benar." };
  }

  const { data, error } = await supabase
    .from('applications')
    .insert({
      user_id: user.id,
      service_id: validatedFields.data.service_id,
      company_name: validatedFields.data.company_name,
      company_address: validatedFields.data.company_address,
      notes: validatedFields.data.notes,
      status: 'pending' 
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/user/dashboard');
  return { success: true, id: data.id };
}