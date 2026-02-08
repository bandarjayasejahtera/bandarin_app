//lib/validators/order.ts
import { z } from "zod";

export const applicationSchema = z.object({
  service_id: z.string().uuid(),
  company_name: z.string().min(2, "Nama perusahaan minimal 2 Suku Kata"),
  company_address: z.string().optional(),
  notes: z.string().optional(),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;