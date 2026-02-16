import { ServiceFormClient } from "@/app/admin/services/new/service-form-client";

export default function NewServicePage() {
  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Buat Layanan Baru</h1>
        <p className="text-slate-500">Definisikan nama layanan dan field yang wajib diisi oleh user.</p>
      </div>
      
      <ServiceFormClient />
    </div>
  );
}