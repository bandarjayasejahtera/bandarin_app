// lib/applicationSchema/schemas.ts
import { z } from "zod";

// ... existing loginSchema ...

export const applicationSchema = z.object({
  service_id: z.string().min(1, { message: "Pilih layanan terlebih dahulu." }),
  company_name: z.string().min(3, { message: "Nama perusahaan minimal 3 karakter." }),
  company_address: z.string().optional(),
  notes: z.string().optional(),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;