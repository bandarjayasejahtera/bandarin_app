export const dynamic = "force-dynamic";

import { AuthForm } from "@/components/auth/auth-form";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <AuthForm />
      </div>
    </div>
  );
}
