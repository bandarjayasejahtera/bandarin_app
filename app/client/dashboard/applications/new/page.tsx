// app/user/dashboard/applications/new/page.tsx
import { createClient } from "@/utils/supabase/server";
import { ApplicationFormClient } from "./form-client";

export default async function NewApplicationPage() {
  const supabase = await createClient();
  
  // Ambil daftar layanan yang aktif untuk ditampilkan di dropdown
  const { data: services } = await supabase
    .from('services')
    .select('id, name, description')
    .order('name');

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tighter text-blue-900 dark:text-white uppercase">
          Mulai Pengajuan
        </h1>
        <p className="text-slate-500 font-medium">
          Pilih jenis layanan legalitas dan lengkapi persyaratan yang diperlukan.
        </p>
      </div>
      
      {/* Melewatkan data services ke Client Component */}
      <ApplicationFormClient services={services || []} />
    </div>
  );
}