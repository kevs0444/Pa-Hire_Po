export const SUPABASE_SCHEMA_SQL = `-- Pa-Hire Po: Relational Supabase Schema, RLS, Auto-Admin Security & Resume Storage
-- Run this once in Supabase Dashboard -> SQL Editor:
--   Primary (Vercel supabase-erin-elephant): https://supabase.com/dashboard/project/muftcprpqnzuzfosvftz/sql/new
--   Alternate direct project:               https://supabase.com/dashboard/project/fndmgrllmmdmmopvcoew/sql/new

create extension if not exists pgcrypto;

-- 1. User Profiles & App Preferences
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'user' check (role in ('admin', 'user')),
  is_suspended boolean not null default false,
  profile_data jsonb not null default '{}'::jsonb,
  auto_apply_config jsonb default '{}'::jsonb,
  queued_job_ids text[] not null default '{}',
  theme text not null default 'light',
  resume_file_path text,
  resume_file_name text,
  last_scanned_at timestamptz,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_profiles_email_idx on public.user_profiles (lower(email));
create index if not exists user_profiles_role_idx on public.user_profiles (role);
create index if not exists user_profiles_last_active_idx on public.user_profiles (last_active_at desc);
create index if not exists user_profiles_role_active_idx on public.user_profiles (role, is_suspended, last_active_at desc);

-- 2. Saved, Applied & Discovered Job Listings per User
create table if not exists public.user_jobs (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  title text not null,
  company text not null,
  location text not null,
  source text not null,
  url text not null,
  posted_at text not null,
  salary text,
  description text not null,
  work_type text not null,
  searched_role text not null,
  is_pivot_suggestion boolean not null default false,
  is_fallback boolean not null default false,
  experience_required text not null default 'Open / Not Specified',
  experience_fit text not null default 'fit',
  match_score integer not null default 50,
  matched_skills text[] not null default '{}',
  missing_skills text[] not null default '{}',
  match_reason text not null default '',
  tailoring_tips text[] not null default '{}',
  status text not null default 'suggested',
  discovered_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists user_jobs_user_status_idx on public.user_jobs (user_id, status);
create index if not exists user_jobs_match_score_idx on public.user_jobs (user_id, match_score desc);
create index if not exists user_jobs_user_status_score_idx on public.user_jobs (user_id, status, match_score desc);

-- 3. Multi-Board Scan History Logs per User
create table if not exists public.scan_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  timestamp timestamptz not null default now(),
  searched_roles text[] not null default '{}',
  total_found integer not null default 0,
  new_added integer not null default 0,
  meta jsonb not null default '[]'::jsonb,
  primary key (user_id, id)
);

create index if not exists scan_logs_user_ts_idx on public.scan_logs (user_id, timestamp desc);

-- 4. Tailored Resume Snapshots (AI & Smart Engine)
create table if not exists public.tailored_resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id text,
  job_title text,
  company text,
  tailor_method text,
  resume_data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists tailored_resumes_user_idx on public.tailored_resumes (user_id, created_at desc);

-- 5. Security-Definer Admin Helper (prevents RLS infinite recursion + search_path hardened)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    lower(coalesce((select auth.jwt()) ->> 'email', '')) = 'markevinalcantara40@gmail.com'
    or exists (
      select 1
      from public.user_profiles
      where id = (select auth.uid())
        and role = 'admin'
        and not is_suspended
    );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- 5b. Prevent Privilege Escalation on user_profiles via PostgREST
create or replace function public.enforce_user_profile_security()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if current_user not in ('postgres', 'service_role', 'supabase_admin') and not (select public.is_admin()) then
    if tg_op = 'INSERT' then
      new.role := 'user';
      new.is_suspended := false;
    elsif tg_op = 'UPDATE' then
      new.role := old.role;
      new.is_suspended := old.is_suspended;
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_user_profile_security() from public, anon, authenticated;

drop trigger if exists trg_enforce_user_profile_security on public.user_profiles;
create trigger trg_enforce_user_profile_security
  before insert or update on public.user_profiles
  for each row execute function public.enforce_user_profile_security();

-- 6. Explicit Data API Privileges (Least Privilege: authenticated + service_role only)
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on table
  public.user_profiles,
  public.user_jobs,
  public.scan_logs,
  public.tailored_resumes
to authenticated, service_role;

-- 7. Row-Level Security (RLS with InitPlan SELECT wrapping & strict role bounds)
alter table public.user_profiles enable row level security;
alter table public.user_jobs enable row level security;
alter table public.scan_logs enable row level security;
alter table public.tailored_resumes enable row level security;

drop policy if exists "user_profiles_select" on public.user_profiles;
create policy "user_profiles_select" on public.user_profiles
  for select to authenticated
  using ((select auth.uid()) = id or (select public.is_admin()));

drop policy if exists "user_profiles_insert" on public.user_profiles;
create policy "user_profiles_insert" on public.user_profiles
  for insert to authenticated
  with check (
    ((select auth.uid()) = id and role = 'user' and not is_suspended)
    or (select public.is_admin())
  );

drop policy if exists "user_profiles_update" on public.user_profiles;
create policy "user_profiles_update" on public.user_profiles
  for update to authenticated
  using (((select auth.uid()) = id and not is_suspended) or (select public.is_admin()))
  with check (
    ((select auth.uid()) = id and role = 'user' and not is_suspended)
    or (select public.is_admin())
  );

drop policy if exists "user_profiles_delete" on public.user_profiles;
create policy "user_profiles_delete" on public.user_profiles
  for delete to authenticated
  using ((select auth.uid()) = id or (select public.is_admin()));

drop policy if exists "user_jobs_all" on public.user_jobs;
create policy "user_jobs_all" on public.user_jobs
  for all to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()))
  with check ((select auth.uid()) = user_id or (select public.is_admin()));

drop policy if exists "scan_logs_all" on public.scan_logs;
create policy "scan_logs_all" on public.scan_logs
  for all to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()))
  with check ((select auth.uid()) = user_id or (select public.is_admin()));

drop policy if exists "tailored_resumes_all" on public.tailored_resumes;
create policy "tailored_resumes_all" on public.tailored_resumes
  for all to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()))
  with check ((select auth.uid()) = user_id or (select public.is_admin()));

-- 8. Private Storage Bucket for Uploaded Resumes
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

drop policy if exists "resumes_bucket_select" on storage.objects;
create policy "resumes_bucket_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'resumes'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
  );

drop policy if exists "resumes_bucket_insert" on storage.objects;
create policy "resumes_bucket_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'resumes'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
  );

drop policy if exists "resumes_bucket_update" on storage.objects;
create policy "resumes_bucket_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'resumes'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
  )
  with check (
    bucket_id = 'resumes'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
  );

drop policy if exists "resumes_bucket_delete" on storage.objects;
create policy "resumes_bucket_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'resumes'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
  );
`;
