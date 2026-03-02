export const dynamic = "force-dynamic";

import React from 'react';
import { createClient } from "@/utils/supabase/server";
import { Plus, Layers, Search, Settings2, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ServiceCardClient } from './service-card-client';

export default async function AdminServicesPage() {
  const supabase = await createClient();
  
  // Mengambil data layanan beserta jumlah field secara dinamis
  const { data: services } = await supabase
    .from('services')
    .select(`
      *,
      service_fields(count)
    `)
    .order('name');

  return (
    <div className="space-y-10 pb-12 transition-all duration-500">
      
      {/* --- STRATEGIC HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            <LayoutGrid className="h-4 w-4" />
            <span>Katalog CRM</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
            Manajemen Layanan
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg">
            Konfigurasi struktur formulir dan jenis layanan legalitas secara dinamis untuk efisiensi operasional.
          </p>
        </div>

        <div className="flex items-center gap-3">
            <Link href="/admin/services/new">
                <Button className="h-14 px-8 bg-slate-900 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white font-bold flex items-center gap-3 rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <Plus size={20} className="stroke-[3]" />
                    <span>Layanan Baru</span>
                </Button>
            </Link>
        </div>
      </div>

      {/* --- SEARCH & FILTER BAR (Visual Only) --- */}
      <div className="flex items-center gap-4 bg-white/50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
        <div className="flex-1 flex items-center gap-3 px-4 text-slate-400">
            <Search className="h-5 w-5" />
            <input 
                type="text" 
                placeholder="Cari layanan berdasarkan nama atau kode..." 
                className="bg-transparent border-none outline-none w-full text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
            />
        </div>
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />
        <Button variant="ghost" size="sm" className="hidden md:flex gap-2 font-bold text-xs text-slate-600 dark:text-slate-400 uppercase tracking-widest px-4">
            <Settings2 className="h-4 w-4" /> Filter
        </Button>
      </div>

      {/* --- SERVICE GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {services?.map((service) => (
          <ServiceCardClient key={service.id} service={service} />
        ))}

        {/* --- EMPTY STATE --- */}
        {(!services || services.length === 0) && (
          <div className="col-span-full py-40 text-center bg-white/50 dark:bg-slate-900/20 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <div className="p-8 bg-white dark:bg-slate-900 rounded-full w-fit mx-auto shadow-xl mb-8">
              <Layers className="h-16 w-16 text-slate-200 dark:text-slate-700" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Katalog Layanan Kosong</h3>
            <p className="text-slate-400 dark:text-slate-500 font-medium mt-2 max-w-xs mx-auto">Mulai bangun fondasi bisnis Anda dengan menambahkan layanan pertama hari ini.</p>
            <Link href="/admin/services/new" className="inline-block mt-8">
                <Button variant="outline" className="rounded-full border-2 font-bold px-8 h-12">
                    Buat Layanan Sekarang
                </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}