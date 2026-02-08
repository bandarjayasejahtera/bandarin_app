'use client'

import { useState, useActionState } from 'react'
import { loginAction, loginWithGoogle } from '@/actions/auth-actions'
import { Building2, Loader2, X } from 'lucide-react'

// [!code ++] Tambahkan prop onClose
export function AuthForm({ onClose }: { onClose?: () => void }) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin')
  const [state, action, isPending] = useActionState(loginAction, null)

  return (
    // [!code change] Hapus min-h-screen dan bg-gray-50. Gunakan w-full relative.
    <div className="w-full bg-white rounded-xl shadow-2xl overflow-hidden relative">
      
      {/* [!code ++] Tombol Close (Hanya muncul jika onClose ada/mode popup) */}
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* HEADER: LOGO & JUDUL */}
      <div className="flex flex-col p-6 pb-2 text-center space-y-2">
        <div className="mx-auto w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg mb-2">
          <Building2 className="w-7 h-7 text-white" />
        </div>
        <div className="tracking-tight text-2xl font-bold text-blue-950">
          Bandarin
        </div>
        <p className="text-sm text-gray-500">
          Akses layanan legalitas bisnis Anda
        </p>
      </div>

      <div className="p-6 pt-4">
        
        {/* TAB SWITCHER */}
        <div className="grid w-full grid-cols-2 h-11 items-center justify-center rounded-lg bg-gray-100 p-1 text-gray-500 mb-6">
          <button
            onClick={() => setActiveTab('signin')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition-all focus:outline-none ${
              activeTab === 'signin' 
                ? 'bg-white text-blue-950 shadow-sm' 
                : 'hover:bg-gray-200/50 hover:text-gray-700'
            }`}
          >
            Masuk
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition-all focus:outline-none ${
              activeTab === 'signup' 
                ? 'bg-white text-blue-950 shadow-sm' 
                : 'hover:bg-gray-200/50 hover:text-gray-700'
            }`}
          >
            Daftar
          </button>
        </div>

        {/* FORM AREA */}
        {activeTab === 'signin' ? (
          <form action={action} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold uppercase text-gray-500" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="nama@perusahaan.com"
                className="flex h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
              {state?.errors?.email && <p className="text-red-500 text-xs">{state.errors.email[0]}</p>}
            </div>
            
            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase text-gray-500" htmlFor="password">Password</label>
                <a href="#" className="text-xs text-blue-600 hover:underline">Lupa password?</a>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="flex h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
               {state?.errors?.password && <p className="text-red-500 text-xs">{state.errors.password[0]}</p>}
            </div>

            {state?.message && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                {state.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-bold transition-all h-11 px-4 w-full bg-blue-900 hover:bg-blue-800 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Masuk Sekarang"}
            </button>
          </form>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="space-y-2 text-left">
              <label className="text-xs font-bold uppercase text-gray-500">Nama Lengkap</label>
              <input type="text" className="flex h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:bg-white focus:border-blue-500" placeholder="Nama Anda" />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold uppercase text-gray-500">Email</label>
              <input type="email" className="flex h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:bg-white focus:border-blue-500" placeholder="nama@email.com" />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold uppercase text-gray-500">Password</label>
              <input type="password" className="flex h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:bg-white focus:border-blue-500" placeholder="Buat password" />
            </div>
            <button type="button" className="w-full h-11 bg-blue-900 text-white rounded-lg text-sm font-bold shadow-lg hover:bg-blue-800">
              Buat Akun Baru
            </button>
          </div>
        )}

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center text-xs font-medium uppercase"><span className="bg-white px-2 text-gray-400">Atau</span></div>
        </div>

        <button
          onClick={() => loginWithGoogle()}
          type="button"
          className="inline-flex items-center justify-center gap-3 rounded-lg text-sm font-semibold transition-colors border border-gray-200 bg-white hover:bg-gray-50 h-11 px-4 w-full text-gray-700"
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