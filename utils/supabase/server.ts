import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Client standar untuk operasi user biasa (mengikuti RLS)
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Method setAll dipanggil dari Server Component.
            // Bisa diabaikan jika middleware sudah menangani refresh session.
          }
        },
      },
    }
  )
}

// Client khusus Admin untuk bypass RLS (Gunakan hanya di Server Actions Admin)
// Pastikan SUPABASE_SERVICE_ROLE_KEY sudah ada di .env.local
export async function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, 
    {
      cookies: {
        getAll() { return [] },
        setAll() { },
      },
    }
  )
}