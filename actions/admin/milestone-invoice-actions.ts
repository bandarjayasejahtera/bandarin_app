'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getMilestoneInvoices(applicationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('order_milestones')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true });
  
  return { success: !error, invoices: data || [], error: error?.message };
}

export async function ensureMilestoneInvoices(applicationId: string, totalPrice: number) {
  const supabase = await createClient();

  // Cek apakah sudah ada milestone
  const { data: existing } = await supabase
    .from('order_milestones')
    .select('id')
    .eq('application_id', applicationId);

  if (existing && existing.length > 0) return { success: true };

  // Buat 3 termin otomatis (30%, 40%, 30%)
  const milestones = [
    { title: "Down Payment (DP)", percentage: 30 },
    { title: "Progress Pengerjaan", percentage: 40 },
    { title: "Pelunasan Hasil", percentage: 30 },
  ];

  const inserts = milestones.map(m => ({
    application_id: applicationId,
    title: m.title,
    percentage: m.percentage,
    amount: (totalPrice * m.percentage) / 100,
    status: 'unpaid'
  }));

  const { error } = await supabase.from('order_milestones').insert(inserts);
  
  revalidatePath(`/admin/services/orders/${applicationId}`);
  return { success: !error, error: error?.message };
}