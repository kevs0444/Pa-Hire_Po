---
type: architecture
status: verified
priority: p0-now
area: infra
milestone: v4-ux-polish
commit_ref: "a1059ca"
files:
  - src/proxy.ts
  - src/app/layout.tsx
  - src/app/page.tsx
  - src/app/jobs/page.tsx
  - src/app/analytics/page.tsx
  - src/app/applications/page.tsx
  - src/app/admin/page.tsx
  - src/app/login/page.tsx
  - src/app/privacy/page.tsx
  - src/app/terms/page.tsx
updated: 2026-11-16
tags:
  - pahirepo
  - architecture
  - nextjs
---

# Architecture — Next.js 16 App Router & API Map

## Framework & Runtime
- **Next.js `16.4.6`** (App Router, Turbopack), **React `19.3.0`**, **TypeScript `^5`**, **Tailwind CSS `4.3.3`**, **`@vercel/analytics`**.
- Request interception via [`src/proxy.ts`](file:///d:/Dev/Pa-Hire%20Po/src/proxy.ts) (`proxy()` export, Next.js 16 convention replacing legacy middleware naming), checking Supabase session cookies, suspended status (`is_suspended`), and local-only dev admin sandbox (`!process.env.VERCEL && LOCAL_ADMIN_COOKIE === '1'`).

## App Router Pages

| Route | Component / Entry | Access | Notes |
|---|---|---|---|
| `/` | `src/app/page.tsx` | Authenticated / Local | Workspace Home Overview |
| `/jobs` | `src/app/jobs/page.tsx` | Authenticated / Local | 2-Column Job Explorer |
| `/analytics` | `src/app/analytics/page.tsx` | Authenticated / Local | Market & Board Analytics |
| `/applications` | `src/app/applications/page.tsx` | Authenticated / Local | Applied Companies & Submitted Resumes |
| `/admin` | `src/app/admin/page.tsx` | Admin Only | User Directory & Supabase Diagnostics |
| `/login` | `src/app/login/page.tsx` | Public | Clean Auth Screen |
| `/auth/callback` | `src/app/auth/callback/route.ts` | Public | Supabase OAuth PKCE callback |
| `/privacy` | `src/app/privacy/page.tsx` | Public (Static `○`) | Privacy Policy |
| `/terms` | `src/app/terms/page.tsx` | Public (Static `○`) | Terms of Service |

## API Route Inventory (12 Handlers)

| Endpoint | Methods | Purpose | Key Guards / Services |
|---|---|---|---|
| `/api/jobs/search` | `POST` | 3-board concurrent scrape + scoring | `checkRateLimit(30/60s)`, `TtlCache(90s)`, `maxDuration = 30` |
| `/api/jobs/status` | `POST` | Immediate `user_jobs` lifecycle updates | Session auth + RLS |
| `/api/resume/tailor` | `POST`, `GET` | Gemini tailoring + capability check | `GEMINI_TAILOR_MODELS` → `tailorResumeLocally` |
| `/api/resume/parse` | `POST` | Parse `.pdf`, `.txt`, `.md`, `.json` resumes | `4.5 MB` free-tier upload cap |
| `/api/resumes/history` | `GET`, `POST` | Read/save `public.tailored_resumes` | Session auth + `50` snapshot cap |
| `/api/roles/search` | `GET` | ESCO + cross-industry role search | `TtlCache(30m)`, max `250` entries |
| `/api/state` | `GET`, `POST` | Hydrate/sync full workspace state | `pruneJobsForFreeTier` + `store-mapper.ts` |
| `/api/admin/platform-status` | `GET` | Vercel Hobby & Supabase Free-Tier probes + global status feeds | `is_admin()`, `checkRateLimit(30/60s)`, 60s cache (`?force=1`) |
| `/api/admin/users` | `GET`, `POST` | List platform users & free-tier DB prune | `is_admin()` + Service Role |
| `/api/admin/users/[userId]` | `PATCH`, `DELETE` | Suspend, promote, inspect, delete | `is_admin()` + Service Role |
| `/api/supabase/keepalive` | `GET` | Cron (`0 8 */4 * *`) DB heartbeat | `vercel.json` scheduled |
| `/api/supabase/setup` | `GET`, `POST` | Schema probe & OAuth settings check | Admin diagnostics |

## Related Notes
- [[System Architecture.canvas]]
- [[Architecture - Supabase Schema, RLS & 1k-User Scale]]
- [[Architecture - Rate Limiting, Caching & Security]]
