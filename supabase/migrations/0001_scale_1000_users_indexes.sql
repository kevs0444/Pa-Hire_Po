-- Migration: 0001_scale_1000_users_indexes.sql
-- Purpose: Composite indexes tuned for 1,000+ registered users across Admin Directory,
--          per-user job pipeline sorting, scan log trimming, and AI resume snapshot caps.
-- Safe to run multiple times (idempotent).

create index if not exists user_profiles_role_active_idx
  on public.user_profiles(role, is_suspended, last_active_at desc);

create index if not exists user_jobs_user_status_score_idx
  on public.user_jobs(user_id, status, match_score desc);

create index if not exists scan_logs_user_ts_idx
  on public.scan_logs(user_id, timestamp desc);

create index if not exists tailored_resumes_user_created_idx
  on public.tailored_resumes(user_id, created_at desc);
