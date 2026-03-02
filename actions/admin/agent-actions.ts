// actions/admin/agent-actions.ts
"use server";

import { createClient, createAdminClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// ----- MASTER DATA AGENT -----

export async function getAgents() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getAgentById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) throw new Error(error?.message || "Agent not found");
  return data;
}

export async function createAgent(formData: any) {
  const supabase = await createAdminClient(); // gunakan service role untuk hindari masalah RLS

  const { error } = await supabase.from("agents").insert([
    {
      name: formData.name,
      agency_name: formData.agency_name,
      email: formData.email,
      phone: formData.phone,
      specialization: formData.specialization,
      status: "active",
    },
  ]);

  if (error) {
    console.error("Gagal tambah agen:", error.message);
    return { error: error.message };
  }

  revalidatePath("/admin/agents");
  return { success: true };
}

export async function deleteAgent(id: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase.from("agents").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/agents");
  return { success: true };
}

// ----- RELASI APLIKASI YANG DITANGANI AGENT -----

export async function getApplicationsByAgent(agentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select(
      `
      *,
      services:services!applications_service_id_fkey (name),
      profiles:profiles!applications_userid_fkey (full_name)
    `
    )
    .eq("assigned_agent_id", agentId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

// ----- OPERASIONAL: PENUGASAN & TRACKING -----

export async function assignAgent(applicationId: string, agentId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("applications")
    .update({ assigned_agent_id: agentId })
    .eq("id", applicationId);

  if (error) return { error: error.message };
  revalidatePath(`/admin/services/orders/${applicationId}`);
  return { success: true };
}

export async function addTrackingStep(data: {
  application_id: string;
  agent_id: string;
  agency_name: string;
  step_name: string;
  status: string;
  notes?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("application_tracking").insert([data]);

  if (error) return { error: error.message };
  revalidatePath(`/admin/services/orders/${data.application_id}`);
  return { success: true };
}

export async function getTrackingHistory(applicationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("application_tracking")
    .select(`
      *,
      agents (name)
    `)
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}
