// actions/admin/agent-actions.ts
"use server";

import { createAdminClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Type definitions
export type Agent = {
  id: string;
  name: string;
  agency_name: string;
  email: string | null;
  phone: string | null;
  specialization: string | null;
  status: "active" | "inactive";
  created_at: string;
};

// 1. Dapatkan semua agen (Untuk halaman daftar agen)
export async function getAgents() {
  const supabase = await createAdminClient();
  
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching agents:", error.message);
    return [];
  }
  
  return data as Agent[];
}

// 2. Dapatkan agen berdasarkan ID (Untuk halaman detail agen)
export async function getAgentById(id: string) {
  const supabase = await createAdminClient();
  
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching agent by ID:", error.message);
    return null;
  }
  
  return data as Agent;
}

// 3. Dapatkan aplikasi yang sedang ditangani oleh agen ini
export async function getApplicationsByAgent(agentId: string) {
  const supabase = await createAdminClient();
  
  // PERBAIKAN: Sintaks relasi Supabase yang benar (menghilangkan alias yang salah)
  const { data, error } = await supabase
    .from("applications")
    .select(`
      id,
      status,
      created_at,
      user_id,
      service_id,
      profiles:profiles!applications_userid_fkey ( full_name ),
      services:services!applications_service_id_fkey ( name )
    `)
    .eq("assigned_agent_id", agentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching applications for agent:", error.message);
    return [];
  }
  
  return data || [];
}

// 4. Tambah agen baru
export async function createAgent(formData: {
  name: string;
  agency_name: string;
  email?: string;
  phone?: string;
  specialization?: string;
}) {
  const supabase = await createAdminClient();

  const { error } = await supabase.from("agents").insert([
    {
      name: formData.name,
      agency_name: formData.agency_name,
      email: formData.email || null,
      phone: formData.phone || null,
      specialization: formData.specialization || null,
      status: "active",
    },
  ]);

  if (error) {
    console.error("Error creating agent:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/agents");
  return { success: true };
}

// 5. Update agen
export async function updateAgent(id: string, updateData: Partial<Agent>) {
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("agents")
    .update(updateData)
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  
  revalidatePath("/admin/agents");
  revalidatePath(`/admin/agents/${id}`);
  return { success: true };
}

// 6. Assign Agent to Application
export async function assignAgent(applicationId: string, agentId: string) {
  const supabase = await createAdminClient();
  
  const { error } = await supabase
    .from("applications")
    .update({ assigned_agent_id: agentId })
    .eq("id", applicationId);

  if (error) return { success: false, error: error.message };
  
  revalidatePath(`/admin/services/orders/${applicationId}`);
  return { success: true };
}

// 7. Add Tracking Step
export async function addTrackingStep(data: {
  application_id: string;
  agent_id: string;
  agency_name: string;
  step_name: string;
  status: string;
  notes?: string;
}) {
  const supabase = await createAdminClient();
  
  const { error } = await supabase.from("application_tracking").insert([data]);

  if (error) return { success: false, error: error.message };
  
  revalidatePath(`/admin/services/orders/${data.application_id}`);
  return { success: true };
}

// 8. Get Tracking History
export async function getTrackingHistory(applicationId: string) {
  const supabase = await createAdminClient();
  
  const { data, error } = await supabase
    .from("application_tracking")
    .select(`
      *,
      agents (name)
    `)
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tracking history:", error.message);
    return [];
  }
  
  return data;
}