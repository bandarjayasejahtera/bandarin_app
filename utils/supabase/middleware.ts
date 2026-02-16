// utils/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // 1. Buat response awal
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Update cookie di request DAN response agar sinkron
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 2. Refresh Session (PENTING: Jangan gunakan getUser di sini untuk logic berat)
  const { data: { user } } = await supabase.auth.getUser()

  // 3. Proteksi Dasar: Hanya cek apakah user login atau tidak
  // Logika Role Admin lebih aman & cepat dilakukan di Layout (Server Component)

  // Jika akses /dashboard/* atau /admin/* tapi tidak login -> tendang ke /login
  if (
    (request.nextUrl.pathname.startsWith('/dashboard') || 
     request.nextUrl.pathname.startsWith('/admin')) 
    && !user
  ) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Jika sudah login tapi akses /login -> lempar ke dashboard
  if (request.nextUrl.pathname === '/login' && user) {
     return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}