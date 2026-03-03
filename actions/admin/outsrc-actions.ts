"use server";

import { createAdminClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Type definition berdasarkan skema tabel public.outsrc Anda
export type OutsrcPersonnel = {
  id: string;
  name: string;
  expertise_field: string;
  phone: string | null;
  email: string | null;
  status: "available" | "busy" | "inactive";
  created_at: string;
};

// 1. Fungsi untuk MENGAMBIL data (Dipanggil di page.tsx)
export async function getOutsrc() {
  const supabase = await createAdminClient();
  
  const { data, error } = await supabase
    .from("outsrc")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal mengambil data outsrc:", error.message);
    return [];
  }
  
  return data as OutsrcPersonnel[];
}

// 2. Fungsi untuk MENAMBAH data (Dipanggil di form)
export async function createOutsrc(formData: {
  name: string;
  expertise_field: string;
  phone?: string;
  email?: string;
}) {
  const supabase = await createAdminClient();

  const { error } = await supabase.from("outsrc").insert([
    {
      name: formData.name,
      expertise_field: formData.expertise_field,
      phone: formData.phone || null,
      email: formData.email || null,
      status: "available", // Default status dari schema
    },
  ]);

  if (error) {
    console.error("Gagal tambah outsrc:", error.message);
    return { success: false, error: error.message };
  }
  
  revalidatePath("/admin/outsrc");
  return { success: true };
}

// 3. Fungsi untuk MENDAPATKAN 1 data (Untuk halaman detail nantinya)
export async function getOutsrcById(id: string) {
  const supabase = await createAdminClient();
  
  const { data, error } = await supabase
    .from("outsrc")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Gagal mengambil detail outsrc:", error.message);
    return null;
  }
  
  return data as OutsrcPersonnel;
}

// 4. Fungsi untuk MENDAPATKAN aplikasi yang ditangani oleh mitra outsourcing
export async function getApplicationsByOutsrc(outsrcId: string) {
  const supabase = await createAdminClient();
  
  const { data, error } = await supabase
    .from("applications")
    .select(`
      id,
      status,
      created_at,
      user_id,
      service_id,
      profiles:user_id (full_name),
      services:service_id (name)
    `)
    .eq("assigned_outsrc_id", outsrcId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching applications for outsrc:", error.message);
    return [];
  }
  
  return data || [];
}
