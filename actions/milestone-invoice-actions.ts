'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { Invoice } from 'xendit-node';

export type MilestoneKey = 'dp' | 'stage2' | 'final';

// ── helpers ──────────────────────────────────────────────────────────────────

function resolveRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

// ── 1. GET ────────────────────────────────────────────────────────────────────

export async function getMilestoneInvoices(applicationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true });

  return { success: !error, invoices: data ?? [], error: error?.message };
}

// ── 2. ENSURE ─────────────────────────────────────────────────────────────────

/**
 * Idempotent: bila invoice sudah ada, kembalikan data existing.
 * Bila belum, buat termin baru lalu kembalikan data yang baru dibuat.
 */
export async function ensureMilestoneInvoices(
  applicationId: string,
  totalPrice: number,
  dpPercentage: number = 50,
) {
  const supabase = await createClient();

  // Cek data existing
  const { data: existing } = await supabase
    .from('invoices')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true });

  if (existing && existing.length > 0) {
    return { success: true, invoices: existing };
  }

  // Susun termin
  const total = Math.round(totalPrice);
  type MilestoneDef = { milestone_key: MilestoneKey; milestone_label: string; percentage: number };

  const milestones: MilestoneDef[] =
    dpPercentage === 100
      ? [{ milestone_key: 'final', milestone_label: 'Pembayaran Penuh', percentage: 100 }]
      : [
          { milestone_key: 'dp', milestone_label: 'Down Payment (DP)', percentage: dpPercentage },
          { milestone_key: 'final', milestone_label: 'Pelunasan Hasil', percentage: 100 - dpPercentage },
        ];

  // Hitung amount; termin terakhir mendapat sisa agar total selalu tepat
  let runningSum = 0;
  const inserts = milestones.map((m, idx) => {
    const isLast = idx === milestones.length - 1;
    const amount = isLast
      ? total - runningSum
      : Math.floor((total * m.percentage) / 100);
    if (!isLast) runningSum += amount;
    return {
      application_id: applicationId,
      milestone_key: m.milestone_key,
      milestone_label: m.milestone_label,
      percentage: m.percentage,
      amount,
      status: 'unpaid',
    };
  });

  const { data: inserted, error } = await supabase
    .from('invoices')
    .insert(inserts)
    .select();

  if (error) return { success: false, invoices: [], error: error.message };

  revalidatePath(`/admin/services/orders/${applicationId}`);
  return { success: true, invoices: inserted ?? [] };
}

// ── 3. CREATE PAYMENT LINK ────────────────────────────────────────────────────

/**
 * Buat invoice Xendit untuk satu termin.
 * Idempotent: bila link sudah ada dan status masih pending, kembalikan URL existing.
 */
export async function createMilestonePaymentLink(
  applicationId: string,
  milestoneKey: MilestoneKey,
) {
  const supabase = await createClient();

  // Ambil invoice
  const { data: invoice, error: fetchErr } = await supabase
    .from('invoices')
    .select('*')
    .eq('application_id', applicationId)
    .eq('milestone_key', milestoneKey)
    .single();

  if (fetchErr || !invoice) return { error: 'Invoice tidak ditemukan.' };
  if (invoice.status === 'paid') return { error: 'Invoice ini sudah lunas.' };

  // Bila link sudah ada, kembalikan tanpa hit Xendit lagi
  if (invoice.xendit_invoice_url && invoice.status === 'pending') {
    return { success: true, invoiceUrl: invoice.xendit_invoice_url as string };
  }

  // Ambil data aplikasi untuk deskripsi invoice
  const { data: app } = await supabase
    .from('applications')
    .select(`
      company_name,
      profiles:profiles!applications_userid_fkey (full_name, email),
      services:services!applications_service_id_fkey (name)
    `)
    .eq('id', applicationId)
    .single();

  const profile = resolveRelation((app as any)?.profiles as { full_name?: string; email?: string } | { full_name?: string; email?: string }[] | null);
  const service = resolveRelation((app as any)?.services as { name?: string } | { name?: string }[] | null);

  const clientName = profile?.full_name ?? 'Klien';
  const clientEmail = profile?.email ?? undefined;
  const serviceName = service?.name ?? 'Layanan';
  const companyPart = (app as any)?.company_name ? ` (${(app as any).company_name})` : '';
  const description = `${invoice.milestone_label} — ${serviceName}${companyPart} · ${clientName}`;

  const externalId = `inv_${applicationId}_${milestoneKey}_${Date.now()}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  try {
    const xenditInvoice = new Invoice({ secretKey: process.env.XENDIT_SECRET_KEY! });

    const result = await xenditInvoice.createInvoice({
      data: {
        externalId,
        amount: Number(invoice.amount),
        description,
        payerEmail: clientEmail,
        currency: 'IDR' as unknown as any,
        successRedirectUrl: `${appUrl}/client/applications/${applicationId}?payment=success`,
        failureRedirectUrl: `${appUrl}/client/applications/${applicationId}?payment=failed`,
      },
    });

    const { error: updateErr } = await supabase
      .from('invoices')
      .update({
        xendit_external_id: externalId,
        xendit_invoice_url: result.invoiceUrl,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.id);

    if (updateErr) return { error: 'Gagal menyimpan link pembayaran ke database.' };

    revalidatePath(`/admin/services/orders/${applicationId}`);
    revalidatePath(`/client/applications/${applicationId}`);

    return { success: true, invoiceUrl: result.invoiceUrl };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal terhubung ke Xendit.';
    console.error('[XENDIT] Gagal membuat invoice:', err);
    return { error: msg };
  }
}

// ── 4. BATCH GENERATE ─────────────────────────────────────────────────────────

/**
 * Generate link Xendit untuk semua termin yang belum punya link.
 * Dipanggil dari handleSaveConfig setelah ensureMilestoneInvoices.
 */
export async function generateAllMilestoneLinks(applicationId: string) {
  const supabase = await createClient();

  const { data: invoices } = await supabase
    .from('invoices')
    .select('milestone_key, status, xendit_invoice_url')
    .eq('application_id', applicationId);

  if (!invoices || invoices.length === 0) return { success: false, error: 'Tidak ada invoice.' };

  const results: { key: string; ok: boolean; error?: string }[] = [];

  for (const inv of invoices) {
    if (inv.status === 'paid') continue;
    if (inv.xendit_invoice_url && inv.status === 'pending') continue;

    const res = await createMilestonePaymentLink(applicationId, inv.milestone_key as MilestoneKey);
    results.push({ key: inv.milestone_key, ok: 'success' in res, error: 'error' in res ? res.error : undefined });
  }

  revalidatePath(`/admin/services/orders/${applicationId}`);
  revalidatePath(`/client/applications/${applicationId}`);

  const hasError = results.some((r) => !r.ok);
  return { success: !hasError, results };
}
