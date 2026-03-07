'use server';

import { createClient } from '@/utils/supabase/server';
import { Xendit } from 'xendit-node';
import { revalidatePath } from 'next/cache';
import Decimal from 'decimal.js';

type MilestoneKey = 'dp' | 'stage2' | 'final';

// Helper to calculate amounts safely
function computeMilestoneAmounts(total: number, dpPercentage: number) {
  const totalDec = new Decimal(total);
  const dpPct = new Decimal(dpPercentage);
  
  if (dpPct.equals(100)) {
    return [
      { key: 'dp' as MilestoneKey, label: 'Pembayaran Penuh (100%)', percentage: 100, amount: totalDec.toNumber() }
    ];
  }

  const remainingPct = new Decimal(100).minus(dpPct);
  
  // Logic Baru: Jika DP < 100, sisanya adalah Pelunasan (1 tahap saja)
  const finalPct = remainingPct;

  const dpAmount = totalDec.times(dpPct).div(100).floor();
  const finalAmount = totalDec.minus(dpAmount);

  return [
    { key: 'dp' as MilestoneKey, label: `DP (${dpPct.toNumber()}%)`, percentage: dpPct.toNumber(), amount: dpAmount.toNumber() },
    { key: 'final' as MilestoneKey, label: `Pelunasan (${finalPct.toNumber()}%)`, percentage: finalPct.toNumber(), amount: finalAmount.toNumber() },
  ];
}

async function canAccessApplication(appId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, ok: false, reason: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const { data: app } = await supabase
    .from('applications')
    .select('id, user_id, quoted_price, company_name, services:services!applications_service_id_fkey(name)')
    .eq('id', appId)
    .single();

  if (!app) return { supabase, ok: false, reason: 'Order not found' };

  const isAdmin = profile?.role === 'admin';
  const isOwner = app.user_id === user.id;
  if (!isAdmin && !isOwner) return { supabase, ok: false, reason: 'Forbidden' };

  return { supabase, ok: true, app, user };
}

export async function ensureMilestoneInvoices(
  orderId: string, 
  totalAmount?: number, 
  dpPercentage: number = 30,
  shouldRevalidate: boolean = true
) {
  const access = await canAccessApplication(orderId);
  if (!access.ok || !access.app) return { error: access.reason };

  const total = totalAmount !== undefined ? totalAmount : (Number(access.app.quoted_price) || 0);
  if (total <= 0) return { error: 'Harga order belum ditetapkan.' };

  const { supabase } = access;
  
  // Check existing invoices
  const { data: existing, error: fetchError } = await supabase
    .from('invoices')
    .select('*')
    .eq('application_id', orderId)
    .order('percentage', { ascending: true });

  if (fetchError) return { error: fetchError.message };

  // If existing invoices exist, check if we need to regenerate
  // We regenerate if:
  // 1. Total amount changed (handled by caller passing new totalAmount, but we should check against sum of existing)
  // 2. DP percentage implies a structural change (e.g. 100% vs <100%) AND existing invoices are all unpaid.
  // For now, if invoices exist and are unpaid, we can replace them if requested (e.g. via explicit action).
  // But ensureMilestoneInvoices is usually idempotent.
  // However, the user wants to adjust the slider. So we should probably force update if called explicitly with a new percentage.
  // Let's assume if this function is called, we want to enforce the structure.
  
  // Filter out paid invoices. We cannot change paid invoices.
  const paidInvoices = existing?.filter(inv => inv.status === 'paid') || [];
  
  if (paidInvoices.length > 0) {
    // If any invoice is paid, we can't easily restructure everything.
    // But maybe we can adjust the remaining unpaid ones?
    // For simplicity, if payment has started, we lock the structure.
    // Unless the user explicitly wants to reset (which is dangerous).
    // We will return existing invoices if any are paid.
    // But wait, if only DP is paid, maybe we can adjust the rest?
    // The prompt says "Jika satu termin dibayar, remaining_balance harus langsung berkurang di UI dan Database."
    // This implies dynamic adjustment.
    // But changing the DP percentage after DP is paid doesn't make sense.
    // So we only allow adjustment if DP is NOT paid.
    return { success: true, invoices: existing };
  }

  // If no invoices are paid, we can delete and recreate.
  if (existing && existing.length > 0) {
     const { error: deleteError } = await supabase
        .from('invoices')
        .delete()
        .eq('application_id', orderId)
        .eq('status', 'unpaid') // Only delete unpaid
        .neq('status', 'paid'); // Double check
     
     if (deleteError) return { error: deleteError.message };
  }

  const milestones = computeMilestoneAmounts(total, dpPercentage);
  
  const payload = milestones.map((m) => ({
    application_id: orderId,
    milestone_key: m.key,
    milestone_label: m.label,
    percentage: m.percentage,
    amount: m.amount,
    status: 'unpaid',
  }));

  const { error: insertError } = await supabase.from('invoices').insert(payload);
  if (insertError) return { error: insertError.message };

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('application_id', orderId)
    .order('percentage', { ascending: true });

  if (shouldRevalidate) {
    revalidatePath(`/client/applications/${orderId}`);
    revalidatePath(`/admin/services/orders/${orderId}`);
  }
  return { success: true, invoices: invoices || [] };
}

export async function getMilestoneInvoices(orderId: string) {
  const access = await canAccessApplication(orderId);
  if (!access.ok) return { error: access.reason, invoices: [] };

  const { supabase } = access;
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('application_id', orderId)
    .order('percentage', { ascending: true });

  if (error) return { error: error.message, invoices: [] };
  return { success: true, invoices: data || [] };
}

export async function createMilestonePaymentLink(orderId: string, milestoneKey: MilestoneKey) {
  const access = await canAccessApplication(orderId);
  if (!access.ok || !access.app || !access.user) return { error: access.reason };
  const { supabase, app, user } = access;

  // We don't call ensureMilestoneInvoices here to avoid accidental regeneration.
  // We assume invoices exist.
  
  const { data: invoiceRow, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('application_id', orderId)
    .eq('milestone_key', milestoneKey)
    .single();

  if (invoiceError || !invoiceRow) return { error: 'Milestone invoice tidak ditemukan.' };
  if (invoiceRow.status === 'paid') return { error: 'Milestone ini sudah dibayar.' };
  if (!process.env.XENDIT_SECRET_KEY) return { error: 'Konfigurasi Xendit belum tersedia.' };

  if (invoiceRow.status === 'pending' && invoiceRow.xendit_invoice_url) {
    return { success: true, invoiceUrl: invoiceRow.xendit_invoice_url, externalId: invoiceRow.xendit_external_id };
  }

  const xenditClient = new Xendit({ secretKey: process.env.XENDIT_SECRET_KEY });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const externalId = `MS-${orderId.slice(0, 8).toUpperCase()}-${milestoneKey}-${Date.now()}`;
  const serviceName = Array.isArray(app.services) 
    ? (app.services[0] as any)?.name 
    : (app.services as any)?.name;

  const invoice = await xenditClient.Invoice.createInvoice({
    data: {
      externalId,
      amount: Number(invoiceRow.amount),
      description: `Milestone ${invoiceRow.milestone_label} - ${serviceName || 'Layanan Bandarin'}`,
      currency: 'IDR',
      customer: {
        givenNames: app.company_name || 'Klien Bandarin',
        email: user.email,
      },
      invoiceDuration: 86400,
      successRedirectUrl: `${appUrl}/client/applications/${orderId}?payment=success`,
      failureRedirectUrl: `${appUrl}/client/applications/${orderId}?payment=failed`,
      paymentMethods: ['BCA', 'BNI', 'BRI', 'MANDIRI', 'PERMATA', 'OVO', 'DANA', 'GOPAY', 'SHOPEEPAY', 'QRIS'],
    },
  });

  if (!invoice?.invoiceUrl) return { error: 'Gagal membuat payment link milestone.' };

  const dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      status: 'pending',
      xendit_external_id: externalId,
      xendit_invoice_url: invoice.invoiceUrl,
      due_at: dueAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceRow.id);

  if (updateError) return { error: updateError.message };

  revalidatePath(`/client/applications/${orderId}`);
  return { success: true, invoiceUrl: invoice.invoiceUrl, externalId };
}
