"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// 1. Get Services (untuk form buat pengajuan)
export async function getServices() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("name");

  if (error) {
    console.error("Fetch Services Error:", error);
    return [];
  }
  return data ?? [];
}

// 2. Create Application (buat pengajuan baru)
export async function createApplication(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { message: "Unauthorized" };

  const service_id = formData.get("service_id") as string;
  const company_name = formData.get("company_name") as string;
  const company_address = formData.get("company_address") as string;
  const notes = formData.get("notes") as string;

  if (!service_id || !company_name?.trim()) {
    return { message: "Nama layanan dan nama perusahaan wajib diisi." };
  }

  const { error } = await supabase.from("applications").insert({
    user_id: user.id,
    service_id,
    company_name: company_name.trim(),
    company_address: company_address?.trim() ?? null,
    notes: notes?.trim() ?? null,
    status: "process",
    current_step: "Verifikasi Data",
  });

  if (error) {
    console.error("Create Application Error:", error);
    return { message: "Gagal membuat pengajuan" };
  }

  revalidatePath("/dashboard/order");
  revalidatePath("/dashboard/orders");
  return { message: "success" };
}

// 3. Get Order Details by ID
export async function getOrderDetails(orderId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("applications")
    .select(`
      *,
      services ( name, code, price ),
      application_messages (
        id, message, created_at, user_id,
        profiles ( full_name, role )
      ),
      application_logs (
        status_title, description, timestamp
      )
    `)
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("Fetch Detail Error:", error);
    return null;
  }

  // Sort messages: Oldest to Newest
  if (data.application_messages) {
    data.application_messages.sort((a: any, b: any) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  // Sort logs: Newest to Oldest
  if (data.application_logs) {
    data.application_logs.sort((a: any, b: any) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  return data;
}

// 4. Send Chat Message
export async function sendMessage(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { message: "Unauthorized" };

  const applicationId = formData.get("application_id") as string;
  const message = formData.get("message") as string;

  if (!message || message.trim() === "") return { message: "Pesan tidak boleh kosong" };

  const { error } = await supabase.from("application_messages").insert({
    application_id: applicationId,
    user_id: user.id,
    message: message.trim(),
  });

  if (error) {
    console.error("Send Message Error:", error);
    return { message: "Gagal mengirim pesan" };
  }

  revalidatePath(`/dashboard/order/${applicationId}`);
  return { message: "success" };
}
