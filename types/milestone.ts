// types/milestone.ts — shared types for milestone/invoice UI

export type StageConfig = {
  order: number;
  label: string;
  percentage: number;
  due_days_offset: number;
};

export const STAGE_PRESETS: Record<string, StageConfig[]> = {
  full_payment: [
    { order: 1, label: "Lunas 100%", percentage: 100, due_days_offset: 0 },
  ],
  "2_stages": [
    { order: 1, label: "DP (Down Payment)", percentage: 50, due_days_offset: 0 },
    { order: 2, label: "Pelunasan Hasil", percentage: 50, due_days_offset: 14 },
  ],
  "3_stages": [
    { order: 1, label: "DP Awal", percentage: 30, due_days_offset: 0 },
    { order: 2, label: "Progres Instansi", percentage: 40, due_days_offset: 15 },
    { order: 3, label: "Pelunasan Akhir", percentage: 30, due_days_offset: 30 },
  ],
  "4_stages": [
    { order: 1, label: "Termin 1", percentage: 25, due_days_offset: 0 },
    { order: 2, label: "Termin 2", percentage: 25, due_days_offset: 14 },
    { order: 3, label: "Termin 3", percentage: 25, due_days_offset: 28 },
    { order: 4, label: "Pelunasan", percentage: 25, due_days_offset: 42 },
  ],
};

export type Milestone = {
  id: string;
  application_id: string;
  milestone_key: string;
  milestone_label: string;
  milestone_order?: number;
  percentage: number;
  amount: number | string;
  partial_paid_amount?: number | null;
  status: string;
  due_date?: string | null;
  paid_at?: string | null;
  xendit_invoice_url?: string | null;
  xendit_external_id?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type AdminMilestoneInvoicesProps = {
  applicationId: string;
  invoices?: Milestone[];
  totalPrice?: number;
  clientName?: string;
};

export type PaymentTransaction = {
  id: string;
  created_at: string;
  payment_method: string;
  amount: number;
  [key: string]: unknown;
};
