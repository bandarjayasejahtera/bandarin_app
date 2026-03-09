// actions/admin/profiles.ts

"use server";

import { createAdminClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getProfiles() {
  const supabase = await createAdminClient();
  
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching profiles:", error.message);
    return [];
  }
  
  return data;
}

export async function updateProfileRole(userId: string, newRole: string) {
  const supabase = await createAdminClient();
  
  // 1. Update role di tabel profiles
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (updateError) return { success: false, error: updateError.message };

  // 2. FITUR PINTAR: Jika role diubah menjadi 'agent', cek apakah dia sudah ada di tabel agents
  if (newRole === 'agent') {
    const { data: existingAgent } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', userId)
      .single();

    // Jika belum ada, buatkan otomatis!
    if (!existingAgent) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        await supabase.from('agents').insert({
          user_id: userId,
          name: profile.full_name || 'Agen Baru',
          agency_name: 'Internal (Auto-Generated)',
          email: profile.email,
          phone: profile.phone,
          status: 'active'
        });
      }
    }
  }

  // TODO: Anda bisa menambahkan logika serupa untuk outsrc di sini jika perlu

  revalidatePath("/admin/profiles");
  return { success: true };
}