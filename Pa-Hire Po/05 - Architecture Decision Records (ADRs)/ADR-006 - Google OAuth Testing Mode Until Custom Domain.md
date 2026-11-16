---
type: adr
status: accepted
priority: p0-now
area: auth-admin
milestone: v3-supabase-scale
commit_ref: "44fd508"
files:
  - src/features/auth/components/AuthScreen.tsx
  - src/app/privacy/page.tsx
  - src/app/terms/page.tsx
updated: 2026-11-16
tags:
  - pahirepo
  - adr
  - oauth
---

# ADR-006 — Google OAuth Testing Mode Until Custom Domain

## Context
Google Cloud Console rejects `.vercel.app` as an authorized top private domain (Mozilla Public Suffix List constraint: `must be a top private domain`), blocking immediate public Google OAuth verification while running solely on `pa-hire-po.vercel.app`.

## Decision
Keep Google OAuth in **Testing Mode** using `supabase.co` as the authorized callback domain (`https://muftcprpqnzuzfosvftz.supabase.co/auth/v1/callback`) with up to 100 whitelisted test users, while pairing it with **GitHub OAuth** (zero domain restrictions) and **Password / Magic Link OTP** (zero third-party console restrictions), plus live `/privacy` and `/terms` compliance pages.

## Alternatives Considered & Rejected
- **Blocking launch on custom domain purchase:** Delayed shipping working auth, GitHub OAuth, and core job/resume workflows.

## Consequences
- **Positive:** All users can sign in today via GitHub, Email/Password, or Magic Link OTP, and whitelisted testers can test Google OAuth immediately.
- **Tradeoffs:** Full public Google OAuth publishing waits for custom domain acquisition (see [[Roadmap P0 - Core Function Polish & Public OAuth Launch]]).

## Related Notes
- [[Feature - Auth, Admin Control Center & Legal Compliance]]
- [[Roadmap P0 - Core Function Polish & Public OAuth Launch]]
