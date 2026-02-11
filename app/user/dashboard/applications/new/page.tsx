import { createClient } from "@/utils/supabase/server";
import { ApplicationFormClient } from "./form-client";

export default async function NewApplicationPage() {
  const supabase = await createClient();
  
  // Ambil daftar layanan yang aktif
  const { data: services } = await supabase
    .from('services')
    .select('id, name, description')
    .order('name');

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-primary">Mulai Pengajuan</h1>
        <p className="text-muted-foreground">Pilih jenis layanan dan lengkapi persyaratan yang diperlukan.</p>
      </div>
      
      <ApplicationFormClient services={services || []} />
    </div>
  );
}