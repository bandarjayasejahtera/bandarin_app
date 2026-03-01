// actions/update-status/chat-actions.ts
'use server'

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function sendMessageAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const applicationId = formData.get("application_id") as string;
  const message = formData.get("message") as string;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !message) return { message: 'error' };

  const { error } = await supabase
    .from('application_messages')
    .insert({
      application_id: applicationId,
      user_id: user.id,
      message: message
    });

  if (error) return { message: 'error' };

  revalidatePath(`/client/applications/${applicationId}`);
  revalidatePath(`/admin/services/orders/${applicationId}`);
  
  return { message: 'success' };
}

// 🚀 FUNGSI BARU UNTUK MARK AS READ MENGGUNAKAN ADMIN PRIVILEGES (BYPASS RLS)
export async function markMessagesAsReadAction(applicationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    // Gunakan Service Role Key untuk menembus proteksi RLS Supabase
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin
      .from('application_messages')
      .update({ is_read: true })
      .eq('application_id', applicationId)
      .neq('user_id', user.id) // Hanya tandai pesan milik Admin/Orang lain
      .eq('is_read', false);

    if (error) throw error;

    // Bersihkan Cache Next.js untuk Halaman List & Halaman Detail
    revalidatePath('/client/applications', 'page');
    revalidatePath(`/client/applications/${applicationId}`, 'page');

    return { success: true };
  } catch (err: any) {
    console.error("Gagal menembus RLS untuk Mark As Read:", err);
    return { success: false, error: err.message };
  }
}