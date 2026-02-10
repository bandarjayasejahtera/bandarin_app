'use server'

import { createClient } from "@/utils/supabase/server";
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

  revalidatePath(`/dashboard/applications/${applicationId}`);
  return { message: 'success' };
}