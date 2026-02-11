"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Loader2, 
  UploadCloud, 
  Info, 
  FileCheck, 
  CheckCircle2, 
  PartyPopper 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function ApplicationFormClient({ services }: { services: any[] }) {
  const router = useRouter();
  const supabase = createClient();
  
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [fields, setFields] = useState<any[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false); // State untuk Pop-up

  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm();
  const watchedValues = watch();

  useEffect(() => {
    async function fetchFields() {
      if (!selectedServiceId) {
        setFields([]);
        return;
      }
      
      setIsLoadingFields(true);
      const { data, error } = await supabase
        .from('service_fields')
        .select('*')
        .eq('service_id', selectedServiceId)
        .order('sort_order', { ascending: true });

      if (!error) setFields(data || []);
      setIsLoadingFields(false);
    }

    fetchFields();
    reset(); 
  }, [selectedServiceId, supabase, reset]);

  const onSubmit = async (formData: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Silakan login kembali");

    try {
      const finalFormData = { ...formData };

      // 1. LOGIKA UPLOAD FILE
      for (const field of fields) {
        if (field.field_type === 'file') {
          const fileList = formData[field.field_name];
          
          if (fileList && fileList.length > 0) {
            const file = fileList[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${field.field_name}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('application-docs')
              .upload(filePath, file);

            if (uploadError) throw new Error(`Gagal upload ${field.label}: ${uploadError.message}`);
            finalFormData[field.field_name] = filePath;
          }
        }
      }

      // 2. SIMPAN DATA KE TABLE APPLICATIONS (Disesuaikan dengan Schema Baru)
      const { error: insertError } = await supabase.from('applications').insert({
        user_id: user.id,
        service_id: selectedServiceId,
        status: 'pending',
        current_step: 'Application Received', // Menyesuaikan database baru Anda
        form_data: finalFormData,
        payment_status: 'pending', // Inisialisasi status pembayaran
      });

      if (insertError) throw insertError;

      // 3. Tampilkan Pop-up Sukses
      setIsSuccessOpen(true);

    } catch (error: any) {
      alert(error.message || "Terjadi kesalahan saat mengirim pengajuan");
    }
  };

  return (
    <div className="space-y-8">
      {/* Pop-up Sukses */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-none p-0 overflow-hidden">
          <div className="bg-primary p-8 flex justify-center">
            <div className="bg-white/20 p-4 rounded-full animate-bounce">
              <PartyPopper className="h-12 w-12 text-white" />
            </div>
          </div>
          <div className="p-8 text-center space-y-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight text-center">
                Pengajuan Berhasil!
              </DialogTitle>
              <DialogDescription className="text-center font-medium text-slate-500">
                Data Anda telah kami terima. Tim ahli Bandarin akan segera meninjau dokumen dan memberikan penawaran harga terbaik untuk Anda.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center">
              <Button 
                onClick={() => {
                  setIsSuccessOpen(false);
                  router.push('/dashboard/applications');
                  router.refresh();
                }}
                className="w-full h-12 rounded-2xl font-black text-lg shadow-xl shadow-primary/20"
              >
                Lihat Progress Saya
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="border-2 border-primary/10 rounded-3xl overflow-hidden shadow-sm">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label className="text-lg font-black tracking-tight">Jenis Layanan</Label>
            <select 
              className="w-full p-4 rounded-2xl border-2 bg-background focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-sm"
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
            >
              <option value="">-- Pilih Layanan Legalitas --</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {selectedServiceId && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="rounded-3xl border-slate-200">
            <CardContent className="pt-8 space-y-8">
              <div className="flex items-center gap-3 pb-4 border-b">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Info className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-black text-xl tracking-tight">Informasi Persyaratan</h2>
              </div>

              {isLoadingFields ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : fields.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {fields.map((field) => (
                    <div key={field.id} className={`space-y-2 ${field.field_type === 'textarea' ? 'md:col-span-2' : ''}`}>
                      <Label className="font-black text-[11px] uppercase tracking-widest text-slate-400">
                        {field.label} {field.is_required && <span className="text-destructive">*</span>}
                      </Label>
                      
                      {field.field_type === 'text' && (
                        <Input 
                          {...register(field.field_name, { required: field.is_required })} 
                          placeholder={field.placeholder}
                          className="h-14 rounded-2xl border-2 focus-visible:ring-primary/20 font-bold"
                        />
                      )}

                      {field.field_type === 'textarea' && (
                        <textarea 
                          {...register(field.field_name, { required: field.is_required })}
                          placeholder={field.placeholder}
                          className="w-full p-4 rounded-2xl border-2 bg-background min-h-[120px] font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        />
                      )}

                      {field.field_type === 'file' && (
                        <div className="relative group">
                          <Input 
                            type="file" 
                            className="hidden" 
                            id={`file-${field.id}`}
                            {...register(field.field_name, { required: field.is_required })}
                          />
                          <label 
                            htmlFor={`file-${field.id}`}
                            className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-3xl cursor-pointer transition-all ${
                              watchedValues[field.field_name]?.[0] 
                              ? "bg-primary/5 border-primary shadow-inner" 
                              : "bg-slate-50 border-slate-200 hover:border-primary hover:bg-white"
                            }`}
                          >
                            {watchedValues[field.field_name]?.[0] ? (
                              <>
                                <div className="p-3 bg-primary rounded-2xl mb-2 text-white shadow-lg">
                                  <FileCheck className="h-6 w-6" />
                                </div>
                                <span className="text-xs font-black text-primary truncate max-w-[220px]">
                                  {watchedValues[field.field_name][0].name}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Klik untuk ganti file</span>
                              </>
                            ) : (
                              <>
                                <UploadCloud className="h-10 w-10 text-slate-300 group-hover:text-primary mb-2 transition-colors" />
                                <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">
                                  Upload {field.label}
                                </span>
                              </>
                            )}
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <p className="text-sm text-slate-400 font-bold italic">
                    Layanan ini tidak membutuhkan dokumen tambahan.
                  </p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-16 text-lg font-black rounded-3xl shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-transform" 
                disabled={isSubmitting || isLoadingFields}
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Sedang Mengirim...</>
                ) : (
                  <>Kirim Pengajuan Legalitas <CheckCircle2 className="ml-2 h-6 w-6" /></>
                )}
              </Button>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}