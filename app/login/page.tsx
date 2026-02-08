// 👇 Perhatikan bagian akhir: ganti 'auth-form' jadi 'login-form'
import { AuthForm } from "@/components/auth/auth-form"; 
import { Building2 } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 relative overflow-hidden">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-40" 
           style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      {/* Container Form */}
      <div className="relative z-10 w-full max-w-md px-4">
        <AuthForm />
      </div>

      {/* Footer Copyright */}
      <div className="absolute bottom-4 text-xs text-gray-400">
        © 2026 Bandarin App. Secure Login.
      </div>
    </div>
  );
}