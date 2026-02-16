import type { NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

/**
 * Proxy (Next.js 16+): menggantikan middleware.ts untuk refresh session
 * dan proteksi route (redirect ke /login atau /dashboard).
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|wav)$).*)",
  ],
};
