'use server'

import { productSchema } from "@/lib/schemas";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createProduct(prevState: any, formData: FormData) {
  // 1. Validasi Data
  const rawData = Object.fromEntries(formData.entries());
  const validated = productSchema.safeParse(rawData);

  // 2. Jika Gagal, balikin error ke UI
  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  // 3. Jika Sukses, simpan ke Supabase
  const supabase = await createClient();
  const { error } = await supabase.from("products").insert(validated.data);

  if (error) {
    return { success: false, message: "Gagal simpan ke DB" };
  }

  // 4. Refresh Halaman (Biar data baru muncul)
  revalidatePath("/dashboard");
  return { success: true, message: "Berhasil!" };
}