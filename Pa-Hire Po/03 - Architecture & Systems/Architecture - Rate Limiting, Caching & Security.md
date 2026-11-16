---
type: architecture
status: verified
priority: p0-now
area: infra
milestone: v3-supabase-scale
commit_ref: "169ae5a"
files:
  - src/server/rate-limit/api-rate-limiter.ts
  - src/server/cache/ttl-cache.ts
  - src/lib/supabase/server-env.ts
  - src/lib/supabase/admin.ts
  - src/proxy.ts
updated: 2026-11-16
tags:
  - pahirepo
  - architecture
  - security
  - performance
---

# Architecture — Rate Limiting, Caching & Security

## Rate Limiting (`src/server/rate-limit/api-rate-limiter.ts`)
- Fixed/sliding in-memory bucket guard keyed by `getClientRateLimitKey(request, prefix)` (`x-forwarded-for` → `x-real-ip` → `'local-client'`).
- Bounded at `MAX_BUCKETS = 5000` with expired-bucket eviction to avoid memory leaks in long-lived server processes.
- Protects `/api/jobs/search` at `30 requests / 60s` (`429` + `Retry-After` header).

## Single-Flight LRU + TTL Cache (`src/server/cache/ttl-cache.ts`)
- Bounded LRU cache (`maxEntries = 250`) with `inFlight` promise deduplication (`getOrFetch`).
- Prevents thundering-herd scraping against LinkedIn/JobStreet/Indeed when multiple users query identical roles concurrently (`90s` TTL for `boardScrapeCache`; `30m` TTL for `roleSearchCache` and `escoSkillCache`).

## Secret & Session Isolation
- **Server-Only Env Vars:** `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are read exclusively in server routes (`src/app/api/**`, `src/lib/supabase/admin.ts`, `server-env.ts`) and never shipped to `NEXT_PUBLIC_*` client bundles.
- **Admin Escalation Protection:** `is_admin()` runs as a PostgreSQL `security definer` function with `set search_path = ''`, and `/api/admin/**` verifies admin identity before invoking service-role queries.
- **Local Admin Guard:** `LOCAL_ADMIN_COOKIE` bypass in `src/proxy.ts` is explicitly gated by `!process.env.VERCEL`, preventing any sandbox bypass in Vercel production.
- **OAuth Guarding:** `/api/supabase/setup` verifies live GoTrue provider status so unconfigured providers cannot fail mid-redirect.

## Related Notes
- [[Architecture - Next.js 16 App Router & API Map]]
- [[Architecture - Supabase Schema, RLS & 1k-User Scale]]
- [[Feature - Auth, Admin Control Center & Legal Compliance]]
