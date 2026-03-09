//actions/milestone-invoice-actions.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { Invoice } from 'xendit-node';

export type MilestoneKey = 'dp' | 'stage2' | 'final';

// Helper untuk menangani relasi Supabase yang mungkin berbentuk array atau objek
function resolveRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

// 1. Ambil semua invoice untuk satu aplikasi
export async function getMilestoneInvoices(applicationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true });

  return { success: !error, invoices: data ?? [], error: error?.message };
}

// 2. Inisialisasi Termin (Idempotent)
export async function ensureMilestoneInvoices(
  applicationId: string,
  totalPrice: number,
  dpPercentage: number = 50,
) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('invoices')
    .select('*')
    .eq('application_id', applicationId);

  if (existing && existing.length > 0) return { success: true, invoices: existing };

  const total = Math.round(totalPrice);
  const milestones = dpPercentage === 100 
    ? [{ key: 'final', label: 'Pembayaran Penuh', pct: 100 }]
    : [
        { key: 'dp', label: 'Down Payment (DP)', pct: dpPercentage },
        { key: 'final', label: 'Pelunasan', pct: 100 - dpPercentage }
      ];

  let currentSum = 0;
  const inserts = milestones.map((m, idx) => {
    const isLast = idx === milestones.length - 1;
    const amount = isLast ? total - currentSum : Math.floor((total * m.pct) / 100);
    if (!isLast) currentSum += amount;
    
    return {
      application_id: applicationId,
      milestone_key: m.key,
      milestone_label: m.label,
      percentage: m.pct,
      amount,
      status: 'unpaid'
    };
  });

  const { data: inserted, error } = await supabase.from('invoices').insert(inserts).select();
  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/services/orders/${applicationId}`);
  return { success: true, invoices: inserted ?? [] };
}

// 3. Generate Xendit links untuk semua termin yang belum punya link
export async function generateAllMilestoneLinks(applicationId: string) {
  const supabase = await createClient();
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, milestone_key, status, xendit_invoice_url')
    .eq('application_id', applicationId)
    .neq('status', 'paid');

  if (!invoices?.length) return { success: true };

  for (const inv of invoices) {
    if (inv.xendit_invoice_url) continue;
    const key = inv.milestone_key as MilestoneKey;
    if (key) await createMilestonePaymentLink(applicationId, key);
  }

  revalidatePath(`/admin/services/orders/${applicationId}`);
  revalidatePath(`/client/applications/${applicationId}`);
  return { success: true };
}

// 4. Buat Link Pembayaran Xendit (Real Integration)
export async function createMilestonePaymentLink(applicationId: string, milestoneKey: MilestoneKey) {
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('application_id', applicationId)
    .eq('milestone_key', milestoneKey)
    .single();

  if (!invoice) return { error: 'Invoice tidak ditemukan.' };
  if (invoice.status === 'paid') return { error: 'Sudah lunas.' };

  // Kembalikan link jika masih aktif (pending)
  if (invoice.xendit_invoice_url && invoice.status === 'pending') {
    return { success: true, invoiceUrl: invoice.xendit_invoice_url };
  }

  // Ambil data pelanggan untuk Xendit
  const { data: app } = await supabase
    .from('applications')
    .select(`
      company_name,
      profiles:profiles!applications_userid_fkey (full_name, email),
      services:services!applications_service_id_fkey (name)
    `)
    .eq('id', applicationId)
    .single();

  const profile = resolveRelation((app as any)?.profiles);
  const service = resolveRelation((app as any)?.services);
  const description = `${invoice.milestone_label} - ${service?.name ?? 'Layanan'}${app?.company_name ? ` (${app.company_name})` : ''}`;

  // External ID unik dengan timestamp untuk menghindari duplikasi Xendit jika link lama expired
  const externalId = `inv_${applicationId}_${milestoneKey}_${Date.now()}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const xendit = new Invoice({ secretKey: process.env.XENDIT_SECRET_KEY! });
    const response = await xendit.createInvoice({
      data: {
        externalId,
        amount: Number(invoice.amount),
        description,
        payerEmail: profile?.email,
        currency: 'IDR' as any,
        successRedirectUrl: `${appUrl}/client/applications/${applicationId}?payment=success`,
        failureRedirectUrl: `${appUrl}/client/applications/${applicationId}?payment=failed`,
      }
    });

    await supabase
      .from('invoices')
      .update({
        xendit_external_id: externalId,
        xendit_invoice_url: response.invoiceUrl,
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', invoice.id);

    revalidatePath(`/client/applications/${applicationId}`);
    return { success: true, invoiceUrl: response.invoiceUrl };
  } catch (err) {
    return { error: 'Gagal membuat invoice Xendit.' };
  }
}