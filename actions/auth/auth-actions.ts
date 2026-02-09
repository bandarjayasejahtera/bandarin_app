// actions/auth/auth-actions.ts
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

  // Ambil data khusus pendaftaran
  const phone = formData.get("phone") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  
  /** * FITUR UX: Dominasi Tangan (Handedness)
   * Mengambil nilai dari Toggle Switch (contoh value: 'left' atau 'right')
   */
  const handedness = formData.get("handedness") as string;

  // ==========================================
  // LOGIKA REGISTER (JIKA ADA INPUT NOMOR HP)
  // ==========================================
  if (phone) {
    // 1. Validasi Password Match
    if (password !== confirmPassword) {
      return { message: "Password dan konfirmasi password tidak cocok." };
    }

    // 2. Validasi Wajib (Required) untuk Dominasi Tangan
    // Memastikan user memilih Kidal atau Kanan untuk UX yang sempurna
    if (!handedness) {
      return { message: "Pilihan dominan tangan (Kidal/Kanan) wajib diisi untuk kenyamanan penggunaan." };
    }

    // 3. Daftar ke Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Data metadata dikirim agar Trigger SQL 'handle_new_user' 
        // bisa memasukkannya ke tabel 'profiles' secara otomatis
        data: {
          phone: phone,
          handedness: handedness, // Menyimpan preferensi UX Kidal/Kanan
        },
      },
    });

    if (error) {
      console.error("Signup Error:", error);
      return { message: error.message || "Gagal mendaftar." };
    }

    // 4. Cek Auto-Login
    if (data.session) {
      revalidatePath("/", "layout");
      redirect("/dashboard");
    }

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
      
      if (error.message.includes("Invalid login")) {
        return { message: "Email atau password salah." };
      }
      if (error.message.includes("Email not confirmed")) {
        return { message: "Email belum diverifikasi. Silakan cek inbox Anda." };
      }
      
      return { message: error.message };
    }

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