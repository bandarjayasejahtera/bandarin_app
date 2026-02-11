import React from 'react';
import { createClient } from "@/utils/supabase/server";
import { Plus, Layers } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DeleteServiceButton } from './delete-service-button';

export default async function AdminServicesPage() {
  const supabase = await createClient();
  
  // Mengambil data layanan beserta jumlah field
  const { data: services } = await supabase
    .from('services')
    .select(`
      *,
      service_fields(count)
    `)
    .order('name');

  return (
    <div className="space-y-8 transition-colors duration-500">
      {/* HEADER HALAMAN */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Manajemen Layanan
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Atur jenis layanan dan struktur formulir CRM Anda secara dinamis.
          </p>
        </div>
        <Link href="/admin/services/new">
          <Button className="h-12 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 font-black flex items-center gap-2 rounded-2xl shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02]">
            <Plus size={20} />
            Layanan Baru
          </Button>
        </Link>
      </div>

      {/* GRID LAYANAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services?.map((service) => (
          <Card 
            key={service.id} 
            className="group hover:shadow-2xl transition-all duration-500 border-slate-200 dark:border-slate-800 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-blue-950 rounded-[2rem] overflow-hidden"
          >
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                {/* Ikon Layanan - Adaptif */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm">
                  <Layers size={28} />
                </div>
                <div className="flex gap-1">
                  <DeleteServiceButton serviceId={service.id} serviceName={service.name} />
                </div>
              </div>
              
              <div className="space-y-2 mb-6">
                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                  {service.name}
                </h3>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-[0.2em]">
                  {service.code}
                </p>
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-8 min-h-[60px] leading-relaxed font-medium">
                {service.description || "Tidak ada deskripsi untuk layanan ini."}
              </p>
              
              <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800/60">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                    Struktur Form
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {service.service_fields[0]?.count || 0} Pertanyaan
                  </span>
                </div>
                
                <Link href={`/admin/services/${service.id}/fields`}>
                  <Button 
                    variant="outline" 
                    className="rounded-xl font-black text-[10px] uppercase tracking-wider border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all h-10 px-4"
                  >
                    Konfigurasi Form
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* EMPTY STATE */}
        {(!services || services.length === 0) && (
          <div className="col-span-full py-32 text-center bg-slate-50/50 dark:bg-slate-900/20 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 transition-colors">
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl w-fit mx-auto shadow-sm mb-6 border border-slate-100 dark:border-slate-800">
              <Layers className="h-12 w-12 text-slate-300 dark:text-slate-700" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-black text-lg">Belum ada layanan yang dibuat.</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">Mulai dengan menambahkan layanan baru untuk klien Anda.</p>
          </div>
        )}
      </div>
    </div>
  );
}