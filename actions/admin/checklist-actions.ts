"use server";

import { createAdminClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type ChecklistItem = {
  id: string;
  document_name: string;
  status: "pending" | "verified" | "rejected";
  notes: string | null;
};

export async function getChecklist(applicationId: string) {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("application_checklists")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return data as ChecklistItem[];
}

export async function addChecklistItem(applicationId: string, documentName: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase.from("application_checklists").insert({
    application_id: applicationId,
    document_name: documentName,
    status: "pending",
  });

  if (error) return { error: error.message };
  revalidatePath(`/admin/services/orders/${applicationId}`);
  return { success: true };
}

export async function updateChecklistItemStatus(itemId: string, status: string, applicationId: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("application_checklists")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", itemId);

  if (error) return { error: error.message };
  revalidatePath(`/admin/services/orders/${applicationId}`);
  return { success: true };
}

export async function deleteChecklistItem(itemId: string, applicationId: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("application_checklists")
    .delete()
    .eq("id", itemId);

  if (error) return { error: error.message };
  revalidatePath(`/admin/services/orders/${applicationId}`);
  return { success: true };
}
