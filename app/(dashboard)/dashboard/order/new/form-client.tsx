'use client'

import { useState, useActionState } from "react";
import { Building2, FileText, CheckCircle, Wallet, Loader2 } from "lucide-react";

export function OrderFormClient({ services, createApplicationAction }: { services: any[], createApplicationAction: any }) {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [state, action, isPending] = useActionState(createApplicationAction, null);

  // Helper icon berdasarkan kode layanan
  const getIcon = (code: string) => {
    if (code.includes("PT")) return <Building2 className="h-6 w-6" />;
    if (code.includes("CV")) return <FileText className="h-6 w-6" />;
    if (code.includes("NIB")) return <CheckCircle className="h-6 w-6" />;
    return <Wallet className="h-6 w-6" />;
  };

  return (
    <form action={action} className="space-y-8">
      
      {/* 1. PILIH LAYANAN (GRID CARD) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((svc) => (
          <label 
            key={svc.id}
            className={`cursor-pointer relative p-4 rounded-xl border-2 transition-all flex items-start gap-4 ${
              selectedService === svc.id 
                ? "border-blue-600 bg-blue-50 shadow-md ring-1 ring-blue-600" 
                : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
            }`}
          >
            <input 
              type="radio" 
              name="service_id" 
              value={svc.id} 
              className="sr-only" 
              onChange={() => setSelectedService(svc.id)}
              required
            />
            
            <div className={`p-3 rounded-full shrink-0 ${
              selectedService === svc.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
            }`}>
              {getIcon(svc.code)}
            </div>
            
            <div className="flex-1">
              <h3 className={`font-bold text-sm md:text-base ${selectedService === svc.id ? "text-blue-900" : "text-gray-900"}`}>
                {svc.name}
              </h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{svc.description}</p>
              <p className="text-sm font-bold text-orange-600 mt-2">
                Rp {svc.price.toLocaleString("id-ID")}
              </p>
            </div>

            {/* Centang Biru */}
            {selectedService === svc.id && (
              <div className="absolute top-4 right-4 text-blue-600">
                <CheckCircle className="h-5 w-5 fill-blue-100" />
              </div>
            )}
          </label>
        ))}
      </div>

      {/* 2. FORM DETAIL (Muncul Animasi setelah pilih layanan) */}
      <div className={`space-y-4 transition-all duration-300 ${selectedService ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 grayscale pointer-events-none'}`}>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2 text-sm uppercase tracking-wide">Detail Usaha</h3>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-gray-500">Nama Perusahaan (Rencana)</label>
            <input 
              name="company_name" 
              type="text" 
              placeholder="Contoh: PT Maju Bersama Jaya" 
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 text-gray-900"
              required={!!selectedService}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-gray-500">Alamat Lengkap</label>
            <textarea 
              name="company_address" 
              rows={3}
              placeholder="Jalan, No, RT/RW, Kelurahan, Kecamatan..." 
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none transition-all resize-none placeholder:text-gray-400 text-gray-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-gray-500">Catatan Tambahan (Opsional)</label>
            <textarea 
              name="notes" 
              rows={2}
              placeholder="Kebutuhan khusus atau pertanyaan..." 
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none transition-all resize-none placeholder:text-gray-400 text-gray-900"
            />
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {state?.message && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
            {state.message}
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <button 
          type="submit" 
          disabled={!selectedService || isPending}
          className="w-full py-4 bg-blue-900 text-white rounded-xl font-bold text-lg shadow-xl hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          {isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Ajukan Sekarang"}
        </button>
      </div>

    </form>
  );
}