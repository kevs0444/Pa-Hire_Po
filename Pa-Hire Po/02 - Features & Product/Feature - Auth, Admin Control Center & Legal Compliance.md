---
type: feature
status: verified
priority: p0-now
area: auth-admin
milestone: v3-supabase-scale
commit_ref: "44fd508"
files:
  - src/app/login/page.tsx
  - src/features/auth/components/AuthScreen.tsx
  - src/app/auth/callback/route.ts
  - src/app/admin/page.tsx
  - src/features/admin/components/AdminDashboardView.tsx
  - src/features/admin/components/AdminSupabaseSetupDialog.tsx
  - src/features/admin/components/AdminUserInspectDialog.tsx
  - src/features/admin/components/AdminFreeTierCard.tsx
  - src/lib/supabase/email-templates.ts
  - supabase/email-templates/
  - src/app/api/admin/users/route.ts
  - src/app/api/admin/users/[userId]/route.ts
  - src/app/privacy/page.tsx
  - src/app/terms/page.tsx
  - src/features/legal/components/LegalPageShell.tsx
updated: 2026-11-17
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
- **Admin Control Center (`/admin`):**
  - **Supabase Health Diagnostics (`AdminSupabaseSetupDialog.tsx`):** `1. API Key (.env)`, `2. SQL Tables & RLS`, `3. Pa-Hire Po Auth & Security Email Templates`, plus 1-click `Copy schema.sql`.
  - **13 Civic Auth & Security Email Templates Manager:**
    - Step 3 features interactive category filter pills: `All (13)`, `Authentication (6)`, and `Security Notifications (7)`.
    - Every template provides 1-click **Copy Subject** and **Copy HTML** buttons with live visual confirmation.
    - Backed by standalone `.html` files in `supabase/email-templates/` and typed catalog in `src/lib/supabase/email-templates.ts`.
  - **User Directory & Moderation (`/api/admin/users`):** Inspect user profiles (`AdminUserInspectDialog`), promote/demote or suspend users, and monitor free-tier quotas (`AdminFreeTierCard`).
- **Legal Infrastructure (`/privacy`, `/terms`, `LegalPageShell.tsx`):**
  - **Privacy Policy (`/privacy`):** Google API Services User Data Policy disclosure (`openid`, `profile`, `email`), RLS guarantees, stateless Gemini API non-training disclosure, Philippine RA 10173 & GDPR user rights.
  - **Terms of Service (`/terms`):** Civic Career Utility disclaimer, nominative third-party trademark disclaimers (LinkedIn, JobStreet, Indeed), advisory AI notice, 100% user IP ownership of resume content.

## Related Notes
- [[Architecture - Supabase Schema, RLS & 1k-User Scale]]
- [[ADR-001 - Lock Single Vercel Supabase Store]]
- [[ADR-006 - Google OAuth Testing Mode Until Custom Domain]]
- [[Roadmap P0 - Core Function Polish & Public OAuth Launch]]
