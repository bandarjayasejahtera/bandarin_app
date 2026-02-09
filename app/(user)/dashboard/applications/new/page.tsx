//(user)/dashboard/applications/new/page.tsx
import { createClient } from "@/utils/supabase/server";
import { ApplicationFormClient } from "./form-client";

export default async function NewApplicationPage() {
  const supabase = await createClient();
  
  // Ambil daftar layanan untuk dropdown
  const { data: services } = await supabase
    .from('services')
    .select('id, name, price')
    .order('name');

  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">Pengajuan Baru</h1>
        <p className="text-muted-foreground">Lengkapi formulir di bawah untuk memulai legalitas Anda.</p>
      </div>
      
      <ApplicationFormClient services={services || []} />
    </div>
  );
}