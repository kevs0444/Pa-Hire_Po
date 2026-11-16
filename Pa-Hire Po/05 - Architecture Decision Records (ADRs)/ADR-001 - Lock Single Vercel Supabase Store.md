---
type: adr
status: accepted
priority: p0-now
area: infra
milestone: v3-supabase-scale
commit_ref: "9a61551"
files:
  - src/lib/supabase/config.ts
  - src/features/auth/components/AuthScreen.tsx
  - src/features/admin/components/AdminSupabaseSetupDialog.tsx
updated: 2026-11-16
tags:
  - pahirepo
  - adr
  - supabase
---

# ADR-001 — Lock Single Vercel Supabase Store

## Context
Early setup included multi-project Supabase preset selectors and setup checklists near authentication screens, creating confusion about which backend held production data and cluttering the public `/login` screen.

## Decision
Lock Pa-Hire Po exclusively to the Vercel-integrated Supabase store (`supabase-erin-elephant` • `muftcprpqnzuzfosvftz` at `https://muftcprpqnzuzfosvftz.supabase.co`) and move all health diagnostics, `schema.sql` copying, and `.env` instructions strictly inside the Admin Control Center (`/admin`).

## Alternatives Considered & Rejected
- **Multi-tenant BYO-Supabase Switcher on `/login`:** Exposed internal setup complexity to public job seekers and risked split-brain state across projects.

## Consequences
- **Positive:** Clean public `/login` UX, single authoritative PostgreSQL store, deterministic OAuth callback URL (`https://muftcprpqnzuzfosvftz.supabase.co/auth/v1/callback`).
- **Tradeoffs:** Self-hosting on a different Supabase project requires updating `DEFAULT_SUPABASE_URL` / `.env` variables intentionally.

## Related Notes
- [[Architecture - Supabase Schema, RLS & 1k-User Scale]]
- [[Feature - Auth, Admin Control Center & Legal Compliance]]
