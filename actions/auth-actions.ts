'use server'

import { loginSchema } from "@/lib/schemas";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

// --- FUNGSI 1: LOGIN EMAIL & PASSWORD ---
export async function loginAction(prevState: any, formData: FormData) {
  // 1. Ambil data dari Form
  const rawData = Object.fromEntries(formData.entries());

  // 2. Validasi dengan Zod
  const validated = loginSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validated.data;

  // 3. Login ke Supabase
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      message: "Email atau Password salah!", 
    };
  }

  // 4. Redirect jika sukses
  redirect("/dashboard");
}

// --- FUNGSI 2: LOGIN GOOGLE (YANG TADI HILANG) ---
export async function loginWithGoogle() {
  const supabase = await createClient();
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Pastikan URL ini sudah di-whitelist di Supabase Dashboard -> Auth -> URL Configuration
      // Dan pastikan variabel NEXT_PUBLIC_SITE_URL ada di .env.local
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (data.url) {
    redirect(data.url);
  }
}