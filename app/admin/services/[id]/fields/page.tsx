import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { ChevronLeft, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { FieldEditorClient } from "./field-editor-client";

// Memastikan sinkronisasi data real-time untuk CRM tingkat lanjut
export const dynamic = "force-dynamic";

export default async function ServiceFieldsPage({
  params,
}: {
  // Next.js 16 mewajibkan params didefinisikan sebagai Promise
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Ambil data layanan utama
  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .single();

  if (!service) notFound();

  // 2. Ambil daftar field yang sudah dikonfigurasi
  const { data: existingFields } = await supabase
    .from("service_fields")
    .select("*")
    .eq("service_id", id)
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-8 transition-all duration-500">
      {/* Header Navigasi - Desain Strategis BI */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link 
            href="/admin/services" 
            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all shadow-sm group"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600 group-hover:text-blue-600 dark:text-slate-400 dark:group-hover:text-white" />
          </Link>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LayoutGrid className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Form Builder Architecture
              </span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
              Konfigurasi: {service.name}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              Mengatur parameter input dinamis untuk kode: <span className="text-blue-600 dark:text-blue-400 font-bold">{service.code}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Container untuk Editor - Card di dalam sini harus menggunakan Deep Space Style */}
      <div className="relative">
        <FieldEditorClient
          serviceId={id} 
          initialFields={existingFields || []} 
        />
      </div>
    </div>
  );
}