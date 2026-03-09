// utils/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Jika belum login dan mencoba akses rute terproteksi
  const isProtectedRoute = path.startsWith('/admin') || path.startsWith('/client') || path.startsWith('/agent') || path.startsWith('/outsrc');
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login"; // Sesuaikan dengan halaman login Anda
    return NextResponse.redirect(url);
  }

  // RBAC (Role-Based Access Control)
  if (user && isProtectedRoute) {
    // Ambil role dari tabel profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'client'; // default fallback

    // Aturan Pengalihan (Redirect Rules)
    if (path.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL(`/${role}`, request.url));
    }
    if (path.startsWith('/agent') && role !== 'agent') {
      return NextResponse.redirect(new URL(`/${role}`, request.url));
    }
    if (path.startsWith('/outsrc') && role !== 'outsrc') {
      return NextResponse.redirect(new URL(`/${role}`, request.url));
    }
    if (path.startsWith('/client') && role !== 'client') {
      // Pengecualian: Admin mungkin ingin melihat view client
      if (role !== 'admin') {
         return NextResponse.redirect(new URL(`/${role}`, request.url));
      }
    }
  }

  // Jika user sudah login dan mengakses root (/), arahkan ke dashboard masing-masing
  if (user && (path === '/' || path === '/login')) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const role = profile?.role || 'client';
    return NextResponse.redirect(new URL(`/${role}`, request.url));
  }

  return supabaseResponse;
}