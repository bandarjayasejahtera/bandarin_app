//actions/order.ts
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

// 2. Create New Application (DENGAN LOGIKA NOTIFIKASI)
export async function createApplication(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.log("❌ User tidak terautentikasi");
    return { message: "Unauthorized" };
  }

  const service_id = formData.get("service_id") as string;
  const company_name = formData.get("company_name") as string;
  const company_address = formData.get("company_address") as string;
  const notes = formData.get("notes") as string;

  if (!service_id) return { message: "Harap pilih jenis layanan." };
  if (!company_name) return { message: "Nama perusahaan wajib diisi." };

  console.log("🚀 Memulai proses insert aplikasi...");

  // A. Insert Aplikasi
  const { data: newApp, error: appError } = await supabase.from("applications").insert({
    user_id: user.id,
    service_id: service_id,
    company_name: company_name,
    company_address: company_address,
    notes: notes,
    status: 'draft',
    current_step: 'Verifikasi Berkas',
    payment_status: 'pending'
  }).select('id').single();

  if (appError) {
    console.error("❌ Gagal Insert Aplikasi:", appError.message);
    return { message: "Gagal membuat pengajuan. Coba lagi nanti." };
  }

  console.log("✅ Aplikasi berhasil dibuat. ID:", newApp.id);

  // B. CARI ADMIN UNTUK DIKIRIMI NOTIFIKASI
  // (Memerlukan Policy RLS 'SELECT' pada table profiles yang sudah kita buat di Langkah 1)
  const { data: admin, error: adminError } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .single();

  if (adminError || !admin) {
    console.error("⚠️ Gagal mencari Admin. Pastikan ada user role 'admin' dan RLS profiles sudah benar.");
  } else {
    console.log("🎯 Admin ditemukan (ID: " + admin.id + "). Mengirim notifikasi...");
    
    // C. INSERT KE TABEL NOTIFICATIONS
    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: admin.id, // ID Admin
      title: "Pesanan Baru Masuk!",
      message: `Klien ${company_name} mengajukan layanan baru.`,
      link: `/admin/services/orders/${newApp.id}`, // Link untuk Admin
      is_read: false
    });

    if (notifError) {
      console.error("❌ Gagal Insert Notifikasi:", notifError.message);
    } else {
      console.log("✅ Sukses! Notifikasi masuk ke database.");
    }
  }

  revalidatePath("/admin");
  revalidatePath("/client/applications");
  redirect("/client/applications");
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

  if (data.application_messages) {
    data.application_messages.sort((a: any, b: any) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }
  
  if (data.application_logs) {
    data.application_logs.sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  return data;
}

// 4. Send Message (DENGAN LOGIKA NOTIFIKASI)
export async function sendMessage(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: "Unauthorized" };

  const applicationId = formData.get("application_id") as string;
  const message = formData.get("message") as string;

  if (!message || message.trim() === "") return { message: "Pesan kosong" };

  // A. Insert Pesan
  const { error: msgError } = await supabase.from("application_messages").insert({
    application_id: applicationId,
    user_id: user.id,
    message: message,
  });

  if (msgError) return { message: "Gagal kirim" };

  // B. LOGIKA NOTIFIKASI CHAT
  const { data: app } = await supabase
    .from('applications')
    .select('user_id, company_name')
    .eq('id', applicationId)
    .single();

  if (app) {
    let recipientId = "";
    let title = "Pesan Baru";
    let targetLink = "";

    if (user.id === app.user_id) {
       // PENGIRIM = KLIEN -> PENERIMA = ADMIN
       const { data: admin } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();
       if (admin) {
         recipientId = admin.id;
         title = `Chat: ${app.company_name}`;
         targetLink = `/admin/services/orders/${applicationId}`;
       }
    } else {
       // PENGIRIM = ADMIN -> PENERIMA = KLIEN
       recipientId = app.user_id;
       title = "Pesan Admin Bandarin";
       targetLink = `/client/applications/${applicationId}`;
    }

    if (recipientId) {
      await supabase.from('notifications').insert({
        user_id: recipientId,
        title: title,
        message: message.substring(0, 50) + "...",
        link: targetLink,
        is_read: false
      });
    }
  }

  revalidatePath(`/admin/services/orders/${applicationId}`); // Refresh Admin
  revalidatePath(`/client/applications/${applicationId}`); // Refresh Client
  return { message: "success" };
}