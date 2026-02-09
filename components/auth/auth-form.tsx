// components/auth/auth-form.tsx
"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, loginWithGoogle } from "@/actions/auth/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, Lock, Phone, ArrowRight, Github, 
  HandMetal, UserCheck, AlertCircle 
} from "lucide-react";

export function AuthForm({ onClose }: { onClose?: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  
  // State untuk UX Kidal/Kanan
  const [handedness, setHandedness] = useState<"left" | "right">("right");

  async function handleSubmit(formData: FormData) {
    setError(null);
    // Tambahkan nilai handedness secara manual ke formData
    if (mode === "register") {
      formData.append("handedness", handedness);
    }
    
    const result = await loginAction(null, formData);
    if (result?.message) {
      setError(result.message);
    }
  }

  return (
    <div className="bg-white dark:bg-deep-space-blue-900 p-8 rounded-3xl shadow-2xl border border-cool-steel-100 dark:border-deep-space-blue-800 w-full relative overflow-hidden">
      
      {/* Header Form */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-deep-space-blue-950 dark:text-white">
          {mode === "login" ? "Selamat Datang!" : "Buat Akun Baru"}
        </h2>
        <p className="text-sm text-cool-steel-500 mt-2">
          {mode === "login" ? "Masuk untuk pantau legalitas bisnis Anda." : "Lengkapi data untuk mulai pengurusan izin."}
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        {/* Email & Password (Selalu ada) */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-cool-steel-400" />
            <Input id="email" name="email" type="email" placeholder="nama@perusahaan.com" className="pl-10" required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-cool-steel-400" />
            <Input id="password" name="password" type="password" placeholder="••••••••" className="pl-10" required />
          </div>
        </div>

        {/* Field Khusus Register */}
        <AnimatePresence>
          {mode === "register" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pt-2 overflow-hidden"
            >
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="Ulangi password" required />
              </div>

              {/* --- TOGGLE UX KIDAL / KANAN --- */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-deep-space-blue-950 rounded-2xl border border-dashed border-slate-200 dark:border-deep-space-blue-800">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-cool-steel-500 flex items-center gap-2">
                    <HandMetal className="h-3 w-3" /> Preferensi Tangan (Wajib)
                  </Label>
                  <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded">UX Personal</span>
                </div>
                
                <div className="relative grid grid-cols-2 bg-white dark:bg-deep-space-blue-900 p-1 rounded-xl border border-cool-steel-200 dark:border-deep-space-blue-800 shadow-sm">
                  {/* Sliding Background */}
                  <motion.div
                    className="absolute inset-y-1 rounded-lg bg-primary shadow-lg shadow-primary/20"
                    initial={false}
                    animate={{ 
                      x: handedness === "left" ? "4%" : "100%", 
                      width: "48%" 
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                  
                  <button
                    type="button"
                    onClick={() => setHandedness("left")}
                    className={`relative z-10 py-2 text-xs font-bold transition-colors ${handedness === "left" ? "text-white" : "text-cool-steel-500"}`}
                  >
                    Kidal (Left)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHandedness("right")}
                    className={`relative z-10 py-2 text-xs font-bold transition-colors ${handedness === "right" ? "text-white" : "text-cool-steel-500"}`}
                  >
                    Kanan (Right)
                  </button>
                </div>
                <p className="text-[12px] text-cool-steel-400 text-center italic">
                  Kami akan menyesuaikan letak tombol navigasi dashboard untuk kenyamanan Anda.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Nomor WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-cool-steel-400" />
                  <Input id="phone" name="phone" type="tel" placeholder="0812..." className="pl-10" required />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="p-3 bg-red-50 border border-red-100 rounded-xl flex gap-2 items-center text-red-600 text-xs font-medium"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        )}

        <SubmitButton mode={mode} />
      </form>

      {/* Toggle Mode */}
      <div className="mt-8 text-center">
        <button 
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="text-sm font-bold text-primary hover:underline"
        >
          {mode === "login" ? "Belum punya akun? Daftar gratis" : "Sudah punya akun? Masuk di sini"}
        </button>
      </div>
    </div>
  );
}

function SubmitButton({ mode }: { mode: "login" | "register" }) {
  const { pending } = useFormStatus();

  return (
    <Button 
      type="submit" 
      disabled={pending}
      className="w-full h-12 bg-primary hover:bg-deep-space-blue-800 text-white font-bold rounded-xl shadow-lg shadow-primary/20 group"
    >
      {pending ? (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Memproses...
        </div>
      ) : (
        <>
          {mode === "login" ? "Masuk ke Dashboard" : "Daftar Sekarang"}
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </>
      )}
    </Button>
  );
}