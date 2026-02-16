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
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm();
  const watchedValues = watch();

  // Mengambil Field Dinamis berdasarkan Layanan yang dipilih
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

      // 1. LOGIKA UPLOAD FILE KE STORAGE
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

      // 2. SIMPAN DATA KE TABLE APPLICATIONS
      // Pastikan kolom form_data di database bertipe JSONB
      const { error: insertError } = await supabase.from('applications').insert({
        user_id: user.id,
        service_id: selectedServiceId,
        status: 'pending',
        current_step: 'Application Received', 
        form_data: finalFormData, // Objek JSON yang berisi data form dan path file
        payment_status: 'pending', 
      });

      if (insertError) throw insertError;

      // 3. Tampilkan Pop-up Sukses
      setIsSuccessOpen(true);

    } catch (error: any) {
      console.error("Submission Error:", error);
      alert(error.message || "Terjadi kesalahan saat mengirim pengajuan. Pastikan tabel database sudah diperbarui.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Pop-up Sukses - Jalur redirect diperbaiki ke /user/dashboard/applications */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-none p-0 overflow-hidden shadow-2xl">
          <div className="bg-primary p-12 flex justify-center">
            <div className="bg-white/20 p-4 rounded-full animate-bounce backdrop-blur-md">
              <PartyPopper className="h-12 w-12 text-white" />
            </div>
          </div>
          <div className="p-8 text-center space-y-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight text-center">
                Pengajuan Berhasil!
              </DialogTitle>
              <DialogDescription className="text-center font-medium text-slate-500">
                Data Anda telah kami terima. Tim ahli Bandarin akan segera meninjau dokumen dan memberikan penawaran harga terbaik.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center">
              <Button 
                onClick={() => {
                  setIsSuccessOpen(false);
                  router.push('/user/dashboard/applications'); // FIX: Jalur redirect disesuaikan
                  router.refresh();
                }}
                className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20"
              >
                Lihat Progress Saya
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Konten Form Tetap Sama namun dengan Visual Lebih Tegas */}
      <Card className="border-none shadow-xl rounded-[2rem] bg-white dark:bg-slate-900">
        <CardContent className="p-8">
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jenis Layanan</Label>
            <select 
              className="w-full h-16 p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-sm"
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

      {/* Form Dinamis Berdasarkan Fields */}
      {selectedServiceId && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
            <CardContent className="p-10 space-y-8">
              <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <Info className="h-6 w-6 text-primary" />
                </div>
                <h2 className="font-black text-2xl tracking-tighter">Persyaratan Dokumen</h2>
              </div>

              {isLoadingFields ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : fields.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {fields.map((field) => (
                    <div key={field.id} className={`space-y-3 ${field.field_type === 'textarea' ? 'md:col-span-2' : ''}`}>
                      <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400">
                        {field.label} {field.is_required && <span className="text-red-500">*</span>}
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
                          className="w-full p-5 rounded-2xl border-2 bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 min-h-[150px] font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
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
                            className={`flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-[2rem] cursor-pointer transition-all ${
                              watchedValues[field.field_name]?.[0] 
                              ? "bg-primary/5 border-primary" 
                              : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-primary"
                            }`}
                          >
                            {watchedValues[field.field_name]?.[0] ? (
                              <>
                                <div className="p-4 bg-primary rounded-2xl mb-3 text-white shadow-lg">
                                  <FileCheck className="h-7 w-7" />
                                </div>
                                <span className="text-sm font-black text-primary truncate max-w-[250px]">
                                  {watchedValues[field.field_name][0].name}
                                </span>
                              </>
                            ) : (
                              <>
                                <UploadCloud className="h-12 w-12 text-slate-300 group-hover:text-primary mb-3 transition-colors" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">
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
                <div className="text-center py-16 bg-slate-50 dark:bg-slate-950 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-slate-400 font-bold italic">
                    Layanan ini tidak membutuhkan dokumen tambahan.
                  </p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-20 text-xl font-black rounded-[1.5rem] shadow-2xl shadow-primary/20 hover:scale-[1.01] transition-transform" 
                disabled={isSubmitting || isLoadingFields}
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-3 h-7 w-7 animate-spin" /> SEDANG MENGIRIM...</>
                ) : (
                  <>Kirim Pengajuan Sekarang <CheckCircle2 className="ml-3 h-7 w-7" /></>
                )}
              </Button>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}