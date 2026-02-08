import React from 'react';
import { Building, User, LogOut, Globe } from 'lucide-react';

export default function BandarinClone() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* --- HEADER --- */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-900 leading-tight">Bandarin</h1>
                <p className="text-xs text-gray-500 font-medium">Jasa Perizinan OSS</p>
              </div>
            </div>

            {/* Desktop Navigation & User Menu */}
            <div className="flex items-center gap-4">
              
              {/* Menu Tabs */}
              <nav className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                <a href="#" className="px-3 py-1.5 text-sm font-medium bg-white text-blue-700 shadow-sm rounded-md border-b-2 border-blue-600 transition-all">
                  Layanan
                </a>
                <a href="#" className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-white/60 rounded-md transition-all">
                  Pengajuan Saya
                </a>
              </nav>

              {/* Language Switcher */}
              <button className="hidden sm:inline-flex items-center justify-center h-8 px-3 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                EN
              </button>

              {/* User Info */}
              <div className="flex items-center gap-2 text-sm text-gray-700 font-medium border-l pl-4 border-gray-200">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">finaltest@bandarin.id</span>
              </div>

              {/* Logout Button */}
              <button className="inline-flex items-center justify-center gap-2 h-8 px-3 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 transition-colors">
                <LogOut className="w-3.5 h-3.5" />
                Keluar
              </button>
            </div>
          </div>

          {/* Mobile Navigation (Visible only on small screens) */}
          <div className="mt-3 md:hidden">
            <nav className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-lg">
              <a href="#" className="flex justify-center px-3 py-1.5 text-sm font-medium bg-white text-blue-700 shadow-sm rounded-md border-b-2 border-blue-600">
                Layanan
              </a>
              <a href="#" className="flex justify-center px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-white/60 rounded-md">
                Pengajuan Saya
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-12 md:pt-24 pb-8">
        <div className="space-y-6">
          
          {/* Page Title */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Katalog Layanan Perizinan</h2>
              <p className="text-gray-600 mt-1">Pilih layanan perizinan yang Anda butuhkan</p>
            </div>
          </div>

          {/* Content Card (Loading State) */}
          <div className="rounded-xl border border-gray-200 bg-white text-gray-900 shadow-sm">
            <div className="p-6 py-12 text-center">
              {/* Spinner */}
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500 font-medium">Memuat layanan...</p>
            </div>
          </div>

        </div>
      </main>
      
    </div>
  );
}