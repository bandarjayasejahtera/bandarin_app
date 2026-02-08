import { AuthForm } from "@/components/auth/auth-form"; // Pastikan pakai Named Import { AuthForm }

export default function LoginPage() {
  return (
    // Wrapper background agar form login berada di tengah layar
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-slate-900">
      <div className="w-full max-w-md">
        <AuthForm />
      </div>
    </div>
  );
}