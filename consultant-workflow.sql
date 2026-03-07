-- 1. Tabel Checklist Dokumen
create table if not exists public.application_checklists (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  document_name text not null,
  status text not null default 'pending', -- pending, verified, rejected
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint checklist_status_check check (
    status = any (array['pending'::text, 'verified'::text, 'rejected'::text])
  )
);

-- 2. Update Tabel Applications untuk Sub-Status (Instansi)
alter table public.applications 
add column if not exists sub_status text; 
-- sub_status akan diisi manual oleh admin, misal: "PUPR", "BPN", "OSS" saat status utama = 'processing'
