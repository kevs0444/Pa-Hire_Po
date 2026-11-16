-- Migration: 0002_applications_roles_and_tracking.sql
-- Purpose: Persist job lifecycle timestamps (saved/applied/hidden), company application stages,
--          notes, and linked edited/tailored resume snapshots per user.
-- Safe to run multiple times (idempotent).

alter table public.user_jobs
  add column if not exists saved_at timestamptz,
  add column if not exists applied_at timestamptz,
  add column if not exists hidden_at timestamptz,
  add column if not exists application_stage text not null default 'applied',
  add column if not exists application_notes text not null default '',
  add column if not exists tailored_resume_id uuid references public.tailored_resumes(id) on delete set null,
  add column if not exists status_updated_at timestamptz not null default now();

create index if not exists user_jobs_user_status_updated_idx
  on public.user_jobs(user_id, status, status_updated_at desc);

alter table public.tailored_resumes
  add column if not exists source_type text not null default 'ai-tailor',
  add column if not exists is_sent boolean not null default false,
  add column if not exists sent_at timestamptz,
  add column if not exists notes text not null default '',
  add column if not exists updated_at timestamptz not null default now();

create index if not exists tailored_resumes_user_company_idx
  on public.tailored_resumes(user_id, is_sent, created_at desc);
