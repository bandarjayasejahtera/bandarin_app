import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// PENTING: Nama fungsinya harus 'proxy', bukan 'middleware' lagi
export function proxy(request: NextRequest) { 
  // Logika sederhana: Izinkan semua request lewat (pass through)
  return NextResponse.next()
}

// Config matcher untuk menentukan di rute mana proxy ini aktif
export const config = {
  matcher: '/about/:path*', 
}