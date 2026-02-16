export const dynamic = "force-dynamic";

import React from 'react';
import { createClient } from "@/utils/supabase/server";
import { 
  Plus, 
  Layers, 
  Search, 
  Settings2, 
  MoreVertical, 
  LayoutGrid, 
  FileText,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeleteServiceButton } from './delete-service-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
          <Card 
            key={service.id} 
            className="group relative border-none bg-white dark:bg-slate-900 shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[2rem] overflow-hidden"
          >
            {/* Dekorasi Aksen Background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 dark:bg-blue-600/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />

            <CardContent className="p-8 relative z-10">
              <div className="flex justify-between items-start mb-8">
                {/* Ikon Layanan - Modern Style */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-900 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-blue-500/30 group-hover:-translate-y-1">
                  <Layers size={28} className="stroke-[2.5]" />
                </div>

                {/* Dropdown Menu Aksi */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <MoreVertical className="h-5 w-5 text-slate-400" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-slate-200 dark:border-slate-800">
                        <DropdownMenuItem asChild>
                            <Link href={`/admin/services/${service.id}/fields`} className="flex items-center gap-3 py-2.5 px-3 cursor-pointer rounded-xl font-bold text-sm">
                                <Settings2 className="h-4 w-4 text-blue-500" /> Konfigurasi Form
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/admin/services/${service.id}/fields`} className="flex items-center gap-3 py-2.5 px-3 cursor-pointer rounded-xl font-bold text-sm">
                                <ExternalLink className="h-4 w-4 text-slate-500" /> Edit Metadata
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
                        <div className="px-1 pt-1">
                            <DeleteServiceButton serviceId={service.id} serviceName={service.name} />
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="space-y-1 mb-4">
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.2em] border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 py-0.5 rounded-lg mb-2">
                  {service.code}
                </Badge>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                  {service.name}
                </h3>
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-8 min-h-[40px] leading-relaxed font-medium">
                {service.description || "Deskripsi layanan belum dikonfigurasi oleh administrator."}
              </p>
              
              <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800/50">
                <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500">
                    <FileText size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">
                        {service.service_fields[0]?.count || 0} Pertanyaan
                    </span>
                </div>
                
                <Link href={`/admin/services/${service.id}/fields`}>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto font-black text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 hover:text-slate-900 dark:hover:text-white transition-all group/btn"
                  >
                    Atur Struktur <Plus className="h-3 w-3 ml-1 transition-transform group-hover/btn:rotate-90" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
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