---
type: feature
status: verified
priority: p0-now
area: auth-admin
milestone: v1.0.6
commit_ref: "d20fc8f"
files:
  - src/app/login/page.tsx
  - src/features/auth/components/AuthScreen.tsx
  - src/lib/supabase/oauth-popup.ts
  - src/app/auth/callback/route.ts
  - electron/main.cjs
  - src/app/admin/page.tsx
  - src/features/admin/components/AdminDashboardView.tsx
  - src/features/admin/components/AdminOverviewTab.tsx
  - src/features/admin/components/AdminUserDirectoryTab.tsx
  - src/features/admin/components/AdminInfraTab.tsx
  - src/features/admin/components/AdminSupabaseSetupDialog.tsx
  - src/features/admin/components/AdminUserInspectDialog.tsx
  - src/features/admin/components/AdminFreeTierCard.tsx
  - src/features/admin/lib/status-helpers.ts
  - src/lib/supabase/email-templates.ts
  - supabase/email-templates/
  - src/app/api/admin/platform-status/route.ts
  - src/app/api/admin/users/route.ts
  - src/app/api/admin/users/[userId]/route.ts
  - src/app/privacy/page.tsx
  - src/app/terms/page.tsx
  - src/features/legal/components/LegalPageShell.tsx
updated: 2026-11-21
tags:
  - pahirepo
  - feature
  - auth
  - admin
  - legal
---

# Feature — Auth, Admin Control Center & Legal Compliance

## Purpose & User Outcome
Provides secure multi-provider authentication on a clean `/login` screen, isolates Supabase cloud diagnostics inside the Admin Control Center (`/admin`), and establishes full legal compliance (`/privacy`, `/terms`) for Google OAuth publishing and Philippine RA 10173 / GDPR.

## Sub-Features & Behavior
- **Clean Public `/login` Screen (`AuthScreen.tsx`):**
  - Strictly focused on `Password`, `Create Account`, `Magic Link / OTP`, `Reset Password`, and Social OAuth (`Google`, `GitHub`), plus footer links to `/privacy` and `/terms`.
  - Queries `/api/supabase/setup` (`/auth/v1/settings`) dynamically so only configured OAuth providers render buttons, avoiding `Unsupported provider` errors.
  - **No Passwordless Admin Bypass**: Public authentication strictly isolates user sessions; no mock admin cookies or direct admin bypasses exist on the public login page.
- **Email OTP Signup Verification (`verifyOtp`):**
  - New user email registrations trigger a 6-digit verification code (`{{ .Token }}`) with inline OTP verification screen (`verifyOtp({ email, token, type: 'signup' })`), preventing unauthorized or unverified email accounts.
- **Connected Logins (`linkIdentity` in `SettingsSidepanel.tsx`):**
  - Logged-in users can link and unlink alternative OAuth sign-in methods (Google, GitHub) directly from their Account Settings, allowing them to sign in via either credentials or connected social providers.
- **Always-on-Top Centered OAuth Popout Window (`oauth-popup.ts`, `/auth/callback?popup=1`, `AuthScreen.tsx`, `SettingsSidepanel.tsx`, `electron/main.cjs`):**
  - Social OAuth (`signInWithOAuth` and Settings `linkIdentity`) uses `skipBrowserRedirect: true` to open a centered `520×680` popout window above the visible `/login` or Settings page.
  - Displays a translucent native `<dialog>` overlay on `/login` with **Bring Sign-In Window to Front** (`focusActiveOAuthPopup()`) and **Cancel** (`cancelActiveOAuthPopup()`), plus `focus`/`pointerdown` re-focus listeners keeping the sign-in window on top, automatic full-page redirect fallback when popups are blocked, and an Electron child modal window (`frameName === 'pa_hire_po_oauth'`, `parent: mainWindow`, `alwaysOnTop: true`, `setAlwaysOnTop(true, 'pop-up-menu')`).
  - `/auth/callback?popup=1` exchanges the OAuth code, sends an origin-verified result via `BroadcastChannel('pa-hire-po-oauth')` + `window.opener.postMessage` (validated via `isTrustedSameOriginMessage` using `Origin.from()` / `isSameOrigin()` with opaque `"null"` rejection), and closes the popout automatically.
- **Admin Control Center (`/admin`):**
  - **Accessible 3-Tab Civic Workspace (`AdminDashboardView.tsx`):** Uses `role="tablist"` with `focusgroup="tablist nomemory"`, arrow/Home/End keyboard navigation, and WCAG 1.4.1 underline indicators across `Overview & Platform Status`, `Users`, and `Infrastructure & Free-Tier`.
  - **Live Vercel & Supabase Status (`AdminOverviewTab.tsx`, `/api/admin/platform-status`):** Admin-only 60s-cached probe endpoint tracking Vercel Hobby runtime (`VERCEL_ENV`, region, git commit/branch, keep-alive cron `0 8 */4 * *`, optional `VERCEL_TOKEN`, `vercel-status.com` components/incidents) alongside Supabase Free-Tier probes (Auth GoTrue, Postgres DB & RLS, Storage `resumes` bucket latencies + `status.supabase.com` components/incidents), unified 5-col KPI ledger, and MOC-aligned **P0 Launch Readiness** checklist.
  - **Responsive User Directory & Moderation (`AdminUserDirectoryTab.tsx`, `/api/admin/users`):** `<search>` bar, role filter pills, `@container (width < 640px)` mobile stacked table cards, WCAG 2.5.3 disambiguated action labels, inspect modal (`AdminUserInspectDialog`), and role/suspend/delete controls.
  - **Infrastructure, Free-Tier Guardrails & Diagnostics (`AdminInfraTab.tsx`, `AdminFreeTierCard.tsx`, `AdminSupabaseSetupDialog.tsx`):** Hairline-divided Postgres/Storage/MAU quota ledger, Vercel Hobby limits reference, 5-step Supabase setup checklist, `Copy schema.sql`, and **13 Civic Auth & Security Email Templates** (`All (13)`, `Authentication (6)`, `Security Notifications (7)`).
- **Legal Infrastructure (`/privacy`, `/terms`, `LegalPageShell.tsx`):**
  - **Privacy Policy (`/privacy`):** Google API Services User Data Policy disclosure (`openid`, `profile`, `email`), RLS guarantees, stateless Gemini API non-training disclosure, Philippine RA 10173 & GDPR user rights.
  - **Terms of Service (`/terms`):** Civic Career Utility disclaimer, nominative third-party trademark disclaimers (LinkedIn, JobStreet, Indeed), advisory AI notice, 100% user IP ownership of resume content.

## Related Notes
- [[Architecture - Supabase Schema, RLS & 1k-User Scale]]
- [[ADR-001 - Lock Single Vercel Supabase Store]]
- [[ADR-006 - Google OAuth Testing Mode Until Custom Domain]]
- [[Roadmap P0 - Core Function Polish & Public OAuth Launch]]
