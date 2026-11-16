---
type: architecture
status: verified
priority: p0-now
area: infra
milestone: v4-ux-polish
commit_ref: "22c463d"
files:
  - supabase/schema.sql
  - supabase/migrations/0001_scale_1000_users_indexes.sql
  - supabase/migrations/0002_applications_roles_and_tracking.sql
  - src/lib/supabase/config.ts
  - src/lib/supabase/free-tier-limits.ts
  - src/lib/supabase/store-mapper.ts
  - src/lib/storage.ts
updated: 2026-11-16
tags:
  - pahirepo
  - architecture
  - supabase
  - postgres
---

# Architecture — Supabase Schema, RLS & 1k-User Scale

## Single Vercel Store Lock
- **Project:** `supabase-erin-elephant` (`muftcprpqnzuzfosvftz`, `https://muftcprpqnzuzfosvftz.supabase.co`).
- Configured in `src/lib/supabase/config.ts` (`PRIMARY_ADMIN_EMAIL = 'markevinalcantara40@gmail.com'`). See [[ADR-001 - Lock Single Vercel Supabase Store]].

## Relational Tables (`supabase/schema.sql`)
1. `public.user_profiles` — `id` (FK `auth.users`), `email`, `full_name`, `role` (`admin` | `user`), `is_suspended`, `profile_data` (`jsonb`), `auto_apply_config` (`jsonb`), `queued_job_ids` (`text[]`), `theme`, `resume_file_path`, `resume_file_name`, `last_scanned_at`, `last_active_at`.
2. `public.user_jobs` — Composite PK `(user_id, id)`. Stores full job metadata, match score, `matched_skills`, `missing_skills`, `experience_fit`, `status` (`suggested` | `saved` | `applied` | `hidden`), lifecycle timestamps (`saved_at`, `applied_at`, `hidden_at`, `status_updated_at`), `application_stage`, `application_notes`, and `tailored_resume_id` (FK `tailored_resumes`).
3. `public.scan_logs` — Composite PK `(user_id, id)` recording `searched_roles`, `total_found`, `new_added`, and `meta` (`jsonb`).
4. `public.tailored_resumes` — `id` (`uuid`), `user_id`, `job_id`, `job_title`, `company`, `tailor_method`, `source_type`, `is_sent`, `sent_at`, `notes`, `resume_data` (`jsonb`).

## Migrations & Indexing for 1,000+ Users
- `0001_scale_1000_users_indexes.sql` & `0002_applications_roles_and_tracking.sql` add composite indexes:
  - `user_profiles_role_active_idx (role, is_suspended, last_active_at desc)`
  - `user_jobs_user_status_score_idx (user_id, status, match_score desc)`
  - `user_jobs_user_status_updated_idx (user_id, status, status_updated_at desc)`
  - `tailored_resumes_user_company_idx (user_id, is_sent, created_at desc)`

## Row-Level Security (RLS)
- RLS enforced on all 4 tables; users only read/write rows matching `(select auth.uid()) = user_id`.
- `public.is_admin()` uses `security definer` with `set search_path = ''` to avoid infinite RLS recursion on `user_profiles`.

## Free-Tier Guardrails (`src/lib/supabase/free-tier-limits.ts`)
- `maxDbSizeMb: 500`, `maxStorageSizeMb: 1024`, `maxMonthlyEgressGb: 5`, `maxFreeMau: 50000`.
- `pruneJobsForFreeTier()` protects `saved`, `applied`, and `queuedJobIds` indefinitely while capping `ephemeralJobs` (`150` suggested), `hiddenJobs` (`500`), `scan_logs` (`25`), `tailored_resumes` (`50`), and job descriptions (`3500` chars; `240` when hidden).
- Keep-Alive Cron (`vercel.json`): `0 8 */4 * *` hitting `/api/supabase/keepalive` so free-tier Postgres never pauses.

## Dual Local Fallback (`src/lib/storage.ts`)
- Mirrors workspace state to browser `localStorage` and local `.data/store.json` when running locally or offline in Electron.

## Related Notes
- [[Feature - Applications Compilation & Submitted Resume Modal]]
- [[Feature - Auth, Admin Control Center & Legal Compliance]]
- [[Architecture - Rate Limiting, Caching & Security]]
