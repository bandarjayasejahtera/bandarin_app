'use client'

import { useState, useActionState } from 'react'
import { loginAction, loginWithGoogle } from '@/actions/auth-actions'
import { Building2, Loader2, X } from 'lucide-react'

export function AuthForm({ onClose }: { onClose?: () => void }) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin')
  
  // Hook ini menangani loading state (isPending) dan balikan dari server (state.message)
  const [state, action, isPending] = useActionState(loginAction, null)

  return (
    <div className="w-full bg-white rounded-2xl shadow-2xl overflow-hidden relative border border-gray-100">
      
      {/* Tombol Close */}
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-red-500 transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* HEADER */}
      <div className="flex flex-col p-8 pb-4 text-center space-y-3">
        <div className="mx-auto w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-900 rounded-xl flex items-center justify-center shadow-lg mb-1">
          <Building2 className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-blue-950">Selamat Datang</h2>
          <p className="text-sm text-gray-500 mt-1">
            {activeTab === 'signin' ? "Masuk ke dashboard Anda" : "Daftar akun baru sekarang"}
          </p>
        </div>
      </div>

      <div className="p-8 pt-2">
        {/* TAB SWITCHER */}
        <div className="grid w-full grid-cols-2 h-12 items-center justify-center rounded-xl bg-gray-50 p-1 text-gray-500 mb-6 border border-gray-100">
          <button
            onClick={() => setActiveTab('signin')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg h-full text-sm font-bold transition-all focus:outline-none ${
              activeTab === 'signin' 
                ? 'bg-white text-blue-950 shadow-sm ring-1 ring-black/5' 
                : 'hover:text-blue-600'
            }`}
          >
            Masuk
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg h-full text-sm font-bold transition-all focus:outline-none ${
              activeTab === 'signup' 
                ? 'bg-white text-blue-950 shadow-sm ring-1 ring-black/5' 
                : 'hover:text-blue-600'
            }`}
          >
            Daftar
          </button>
        </div>

        {/* --- FORM LOGIN --- */}
        {activeTab === 'signin' ? (
          <form action={action} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="nama@perusahaan.com"
                className="flex h-12 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 text-sm text-[#181818] outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-gray-400"
              />
            </div>
            
            <div className="space-y-1.5 text-left">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Password</label>
                <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">Lupa password?</a>
              </div>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="flex h-12 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 text-sm text-[#181818] outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-gray-400"
              />
            </div>

            {/* ERROR MESSAGE LOGIN */}
            {state?.message && (
              <div className={`text-xs font-medium p-3 rounded-xl border flex items-center gap-2 ${
                  state.message.includes("berhasil") 
                  ? "bg-green-50 text-green-700 border-green-200" 
                  : "bg-red-50 text-red-600 border-red-100"
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${state.message.includes("berhasil") ? "bg-green-600" : "bg-red-600"}`} />
                {state.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all h-12 px-4 w-full bg-blue-900 hover:bg-blue-800 active:scale-[0.98] text-white shadow-lg hover:shadow-blue-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Masuk Sekarang"}
            </button>
          </form>
        ) : (
          /* --- FORM DAFTAR (FIXED) --- */
          /* [!code highlight] Tambahkan action={action} agar terhubung ke server */
          <form action={action} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
             
             {/* Field Email */}
             <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Email</label>
              <input 
                name="email"
                type="email" 
                required
                className="flex h-12 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 text-sm text-[#181818] outline-none focus:bg-white focus:border-blue-500 transition-all placeholder:text-gray-400" 
                placeholder="nama@email.com" 
              />
            </div>

            {/* Field Nomor Handphone */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Nomor Handphone / WhatsApp</label>
              <input 
                name="phone"
                type="tel" 
                required
                className="flex h-12 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 text-sm text-[#181818] outline-none focus:bg-white focus:border-blue-500 transition-all placeholder:text-gray-400" 
                placeholder="08xxxxxxxxxx" 
              />
            </div>

            {/* Field Password */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Password</label>
              <input 
                name="password"
                type="password" 
                required
                className="flex h-12 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 text-sm text-[#181818] outline-none focus:bg-white focus:border-blue-500 transition-all placeholder:text-gray-400" 
                placeholder="Buat password" 
              />
            </div>

            {/* Field Konfirmasi Password */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Konfirmasi Password</label>
              <input 
                name="confirmPassword"
                type="password" 
                required
                className="flex h-12 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 text-sm text-[#181818] outline-none focus:bg-white focus:border-blue-500 transition-all placeholder:text-gray-400" 
                placeholder="Ulangi password" 
              />
            </div>

            {/* [!code highlight] Tambahkan Pesan Feedback untuk Signup */}
            {state?.message && (
              <div className={`text-xs font-medium p-3 rounded-xl border flex items-center gap-2 ${
                  state.message.includes("berhasil") 
                  ? "bg-green-50 text-green-700 border-green-200" 
                  : "bg-red-50 text-red-600 border-red-100"
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${state.message.includes("berhasil") ? "bg-green-600" : "bg-red-600"}`} />
                {state.message}
              </div>
            )}

            {/* [!code highlight] Ubah type="submit" dan tambahkan disabled={isPending} */}
            <button 
              type="submit" 
              disabled={isPending}
              className="mt-4 w-full flex items-center justify-center gap-2 h-12 bg-blue-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-blue-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Buat Akun Baru"}
            </button>
          </form>
        )}

        {/* DIVIDER */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest"><span className="bg-white px-3 text-gray-400">Atau Lanjut Dengan</span></div>
        </div>

        {/* GOOGLE BUTTON */}
        <button
          onClick={() => loginWithGoogle()}
          type="button"
          className="inline-flex items-center justify-center gap-3 rounded-xl text-sm font-bold transition-all border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 h-12 px-4 w-full text-gray-700"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google Account
        </button>
      </div>
    </div>
  )
}