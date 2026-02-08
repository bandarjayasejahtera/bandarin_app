'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function loginAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  
  // Ambil data umum
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Ambil data khusus pendaftaran (field ini tidak ada di form login biasa)
  const phone = formData.get("phone") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // ==========================================
  // LOGIKA REGISTER (JIKA ADA INPUT NOMOR HP)
  // ==========================================
  if (phone) {
    // 1. Validasi Password Match
    if (password !== confirmPassword) {
      return { message: "Password dan konfirmasi password tidak cocok." };
    }

    // 2. Daftar ke Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Data ini dikirim agar Trigger SQL 'handle_new_user' 
        // bisa memasukkannya ke tabel 'profiles'
        data: {
          phone: phone,
        },
      },
    });

    if (error) {
      console.error("Signup Error:", error);
      return { message: error.message || "Gagal mendaftar." };
    }

    // 3. Cek Auto-Login (Jika "Confirm Email" dimatikan di Supabase)
    // Jika sesi ada, berarti user sudah terverifikasi otomatis.
    if (data.session) {
      revalidatePath("/", "layout");
      redirect("/dashboard");
    }

    // 4. Jika butuh verifikasi email
    return { 
      message: "Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi akun sebelum login." 
    };
  }

  // ==========================================
  // LOGIKA LOGIN (JIKA TIDAK ADA INPUT HP)
  // ==========================================
  else {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login Error:", error.message);
      
      // Custom pesan error agar lebih ramah pengguna
      if (error.message.includes("Invalid login")) {
        return { message: "Email atau password salah." };
      }
      if (error.message.includes("Email not confirmed")) {
        return { message: "Email belum diverifikasi. Silakan cek inbox Anda." };
      }
      
      return { message: error.message };
    }

    // Login Sukses -> Redirect ke Dashboard
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }
}

// ==========================================
// LOGIKA LOGIN GOOGLE (OAUTH)
// ==========================================
export async function loginWithGoogle() {
  const supabase = await createClient();
  const origin = (await headers()).get('origin');
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (data.url) {
    redirect(data.url);
  }
}