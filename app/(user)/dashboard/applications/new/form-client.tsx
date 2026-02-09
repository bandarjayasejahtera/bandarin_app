//(user)/dashboard/applications/new/form-client.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { applicationSchema, ApplicationInput } from "@/lib/applicationSchema/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export function ApplicationFormClient({ services }: { services: any[] }) {
  const router = useRouter();
  const supabase = createClient();
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema)
  });

  const onSubmit = async (values: ApplicationInput) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    const { error } = await supabase.from('applications').insert({
      ...values,
      user_id: user.id,
      status: 'pending'
    });

    if (!error) {
      router.push('/dashboard/applications');
      router.refresh();
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Pilih Layanan</Label>
            <select 
              {...register("service_id")}
              className="w-full p-2 rounded-md border bg-background"
            >
              <option value="">-- Pilih Layanan --</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name} - Rp {s.price.toLocaleString()}</option>
              ))}
            </select>
            {errors.service_id && <p className="text-xs text-destructive">{errors.service_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Nama Perusahaan / Usaha</Label>
            <Input {...register("company_name")} placeholder="Contoh: PT Maju Jaya" />
            {errors.company_name && <p className="text-xs text-destructive">{errors.company_name.message}</p>}
          </div>

          <Button type="submit" className="w-full font-bold" disabled={isSubmitting}>
            {isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}