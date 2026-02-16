'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// 1. Get Active Services
export async function getServices() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("price", { ascending: true });

  if (error) {
    console.error("Error fetching services:", error);
    return [];
  }
  return data;
}

// 2. Create New Application
export async function createApplication(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: "Unauthorized" };

  const service_id = formData.get("service_id") as string;
  const company_name = formData.get("company_name") as string;
  const company_address = formData.get("company_address") as string;
  const notes = formData.get("notes") as string;

  if (!service_id) return { message: "Harap pilih jenis layanan." };
  if (!company_name) return { message: "Nama perusahaan wajib diisi." };

  const { error } = await supabase.from("applications").insert({
    user_id: user.id,
    service_id: service_id,
    company_name: company_name,
    company_address: company_address,
    notes: notes,
    status: 'draft',
    current_step: 'Verifikasi Berkas',
    payment_status: 'pending'
  });

  if (error) {
    console.error("Create App Error:", error);
    return { message: "Gagal membuat pengajuan. Coba lagi nanti." };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard/applications");
}

// 3. Get Order Details
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

  if (error) return null;

  // Sort messages (Oldest -> Newest)
  if (data.application_messages) {
    data.application_messages.sort((a: any, b: any) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }
  
  // Sort logs (Newest -> Oldest)
  if (data.application_logs) {
    data.application_logs.sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  return data;
}

// 4. Send Message
export async function sendMessage(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: "Unauthorized" };

  const applicationId = formData.get("application_id") as string;
  const message = formData.get("message") as string;

  if (!message || message.trim() === "") return { message: "Pesan kosong" };

  const { error } = await supabase.from("application_messages").insert({
    application_id: applicationId,
    user_id: user.id,
    message: message,
  });

  if (error) return { message: "Gagal kirim" };

  revalidatePath(`/dashboard/applications/${applicationId}`);
  return { message: "success" };
}