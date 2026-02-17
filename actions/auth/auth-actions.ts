// actions/auth/auth-actions.ts
'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function loginAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  // Data Register
  const phone = formData.get("phone") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const handedness = formData.get("handedness") as string;
  const fullName = formData.get("fullName") as string; // <-- AMBIL DATA

  // === LOGIKA REGISTER ===
  if (phone) {
    if (password !== confirmPassword) return { message: "Password tidak cocok." };
    if (!handedness) return { message: "Pilih preferensi tangan." };
    
    // Validasi Nama
    if (!fullName || fullName.trim().length < 3) {
      return { message: "Nama lengkap wajib diisi (min 3 karakter)." };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName, // <-- KIRIM KE SUPABASE METADATA
          phone: phone,
          handedness: handedness, 
        },
      },
    });

    if (error) {
      console.error("Signup Error:", error);
      return { message: error.message };
    }

    if (data.session) {
      revalidatePath("/", "layout");
      redirect("/client");
    }

    return { message: "Pendaftaran berhasil! Cek email untuk verifikasi." };
  }

  // === LOGIKA LOGIN ===
  else {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { message: error.message.includes("Invalid login") ? "Email/Password salah." : error.message };
    }
    revalidatePath("/", "layout");
    redirect("/client");
  }
}

// ... (fungsi loginWithGoogle tetap sama) ...