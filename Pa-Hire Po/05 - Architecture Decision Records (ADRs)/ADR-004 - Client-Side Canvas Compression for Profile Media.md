---
type: adr
status: accepted
priority: p0-now
area: profile
milestone: v3-supabase-scale
commit_ref: "95eb666"
files:
  - src/features/profile/lib/image-upload.ts
  - src/features/profile/components/LinkedInProfileView.tsx
updated: 2026-11-16
tags:
  - pahirepo
  - adr
  - supabase
  - performance
---

# ADR-004 — Client-Side Canvas Compression for Profile Media

## Context
Supabase free tier caps Postgres storage at `500 MB` and monthly egress at `5 GB` (`FREE_TIER_LIMITS`). Allowing users to upload raw 4–8 MB profile avatars or cover banners as base64 or unoptimized storage blobs would rapidly exhaust quotas and bloat `user_profiles.profile_data` JSONB.

## Decision
Center-crop and JPEG-compress all uploaded avatars (`320×320`) and cover banners (`1200×360`) client-side via HTML5 `<canvas>` in `compressImageFileToDataUrl()` (`8 MB` input cap → `~15–60 KB` output), rendered via `<Image unoptimized />`.

## Alternatives Considered & Rejected
- **Raw base64 in JSONB / localStorage:** Immediately exceeds `localStorage` 5 MB quota and spikes Postgres egress.
- **Mandatory Supabase Storage upload + server sharp resize:** Adds server CPU/egress overhead and extra bucket lifecycle complexity for simple avatar/banner thumbnails.

## Consequences
- **Positive:** Zero extra server processing, tiny `15–60 KB` footprint, instant preview & 2-way sync across web and Electron.
- **Tradeoffs:** Stored as JPEG data URLs in `profile_data`; if user media expands beyond avatars/banners later, migrating to Supabase Storage signed URLs stays straightforward.

## Related Notes
- [[Feature - LinkedIn Profile Media & 2-Way Resume Sync]]
- [[Architecture - Supabase Schema, RLS & 1k-User Scale]]
