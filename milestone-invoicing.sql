-- Milestone-based invoicing for applications/orders
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  milestone_key text not null,
  milestone_label text not null,
  percentage integer not null,
  amount numeric not null,
  status text not null default 'unpaid',
  xendit_external_id text null,
  xendit_invoice_url text null,
  due_at timestamptz null,
  paid_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoices_milestone_key_check check (
    milestone_key = any (array['dp'::text, 'stage2'::text, 'final'::text])
  ),
  constraint invoices_status_check check (
    status = any (array['unpaid'::text, 'pending'::text, 'paid'::text, 'expired'::text, 'failed'::text])
  ),
  constraint invoices_unique_per_milestone unique (application_id, milestone_key)
);

create index if not exists invoices_application_id_idx on public.invoices(application_id);
create index if not exists invoices_xendit_external_id_idx on public.invoices(xendit_external_id);
