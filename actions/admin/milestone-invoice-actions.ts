// actions/admin/milestone-invoice-actions.ts

'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// 1. Ambil data invoice berdasarkan tabel 'invoices' yang benar
export async function getMilestoneInvoices(applicationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true });
  
  return { success: !error, invoices: data || [], error: error?.message };
}

// 2. Perbaiki fungsi pembuat milestone agar mendukung dpPercentage dari Admin UI
export async function ensureMilestoneInvoices(
  applicationId: string, 
  totalPrice: number, 
  dpPercentage: number = 30 // Ditambahkan parameter default
) {
  const supabase = await createClient();

  // Cek apakah sudah ada milestone untuk aplikasi ini
  const { data: existing } = await supabase
    .from('invoices')
    .select('id')
    .eq('application_id', applicationId);

  if (existing && existing.length > 0) return { success: true };

  // 3. Logika penentuan termin berdasarkan slider UI (2 termin: DP & Final)
  let milestones = [];
  
  if (dpPercentage === 100) {
      milestones = [
          { milestone_key: 'final', milestone_label: "Pembayaran Penuh", percentage: 100 }
      ];
  } else {
      milestones = [
          { milestone_key: 'dp', milestone_label: "Down Payment (DP)", percentage: dpPercentage },
          { milestone_key: 'final', milestone_label: "Pelunasan Hasil", percentage: 100 - dpPercentage },
      ];
  }

  // Siapkan data untuk di-insert ke tabel 'invoices' sesuai skema SQL
  const inserts = milestones.map(m => ({
    application_id: applicationId,
    milestone_key: m.milestone_key, // Sesuai dengan check constraint di SQL
    milestone_label: m.milestone_label,
    percentage: m.percentage,
    amount: (totalPrice * m.percentage) / 100,
    status: 'unpaid'
  }));

  const { error } = await supabase.from('invoices').insert(inserts);
  
  revalidatePath(`/admin/services/orders/${applicationId}`);
  return { success: !error, error: error?.message };
}

// 4. Tambahkan kerangka fungsi untuk membuat Payment Link (Xendit)
export async function createMilestonePaymentLink(
  applicationId: string, 
  milestoneKey: 'dp' | 'stage2' | 'final'
) {
  const supabase = await createClient();
  
  // A. Ambil data invoice spesifik yang mau dibayar
  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('*')
    .eq('application_id', applicationId)
    .eq('milestone_key', milestoneKey)
    .single();

  if (fetchError || !invoice) {
    return { error: "Invoice tidak ditemukan." };
  }

  if (invoice.status === 'paid') {
    return { error: "Invoice ini sudah lunas." };
  }

  // B. TODO: Integrasi Xendit API di sini
  // 1. Buat payload ke Xendit (amount, external_id, dll)
  // 2. Lakukan fetch ke endpoint Xendit API
  // 3. Dapatkan `invoice_url` dari response Xendit

  // Simulasi respons dari Xendit (Ganti ini nanti dengan kode asli Xendit)
  const dummyXenditUrl = `https://checkout.xendit.co/web/${invoice.id}`;
  const dummyExternalId = `inv_${applicationId}_${milestoneKey}`;

  // C. Update database dengan URL Xendit dan ubah status jadi 'pending'
  const { error: updateError } = await supabase
    .from('invoices')
    .update({ 
      xendit_external_id: dummyExternalId,
      xendit_invoice_url: dummyXenditUrl,
      status: 'pending' 
    })
    .eq('id', invoice.id);

  if (updateError) {
    return { error: "Gagal mengupdate link pembayaran di database." };
  }

  revalidatePath(`/admin/services/orders/${applicationId}`);
  revalidatePath(`/client/applications/${applicationId}`);
  
  return { success: true, invoiceUrl: dummyXenditUrl };
}