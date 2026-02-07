import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Log in</h1>
      <p className="max-w-sm text-center text-muted-foreground text-sm">
        Sign in to access your dashboard. Configure your preferred auth provider
        (e.g. Supabase Auth) here.
      </p>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
