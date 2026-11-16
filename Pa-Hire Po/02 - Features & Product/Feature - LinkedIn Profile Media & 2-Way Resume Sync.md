---
type: feature
status: verified
priority: p0-now
area: profile
milestone: v3-supabase-scale
commit_ref: "95eb666"
files:
  - src/features/profile/components/LinkedInProfileView.tsx
  - src/features/profile/lib/image-upload.ts
  - src/lib/default-profile.ts
  - src/app/api/resume/parse/route.ts
updated: 2026-11-16
tags:
  - pahirepo
  - feature
  - profile
---

# Feature — LinkedIn Profile Media & 2-Way Resume Sync

## Purpose & User Outcome
Provides a familiar LinkedIn-style career profile (`My Profile`) where edits to experience, skills, projects, certifications, and media stay synchronized 2-way with **Resume Studio (`AI`)** and the job match scorer.

## Sub-Features & Behavior
- **LinkedIn Hero Banner & Profile Photo Geometry:**
  - **Cover Banner:** `10:3` widescreen container (`h-32 sm:h-36`) with `#1e293b` / `bg-slate-900` fallback, bottom contrast scrim, and top-left `Add Cover Photo` / `Change Cover` button (`ImagePlus`).
  - **Profile Photo:** `1:1` circular avatar (`h-24 w-24 rounded-full border-4`) overlapping the banner (`-mt-12 relative z-10`), monogram initials fallback, and bottom-right `Camera` trigger.
- **Client-Side Canvas Compression (`image-upload.ts`):** Center-crops and JPEG-compresses uploads client-side (`320×320` avatar, `1200×360` cover banner; `8 MB` upload cap compressed to `~15–60 KB` data URL) before syncing to `user_profiles.profile_data` JSONB and rendering via Next.js `<Image unoptimized />`.
- **Full Inline CRUD + Career Journey Markdown Vault:** Edit Experience, Projects, Licenses & Certifications, Education, Technical Skills, Open-to-Work chips, and free-form Career Journey Markdown synced directly to AI tailoring.
- **Resume File Parser (`/api/resume/parse`):** Upload `.pdf`, `.txt`, `.md`, or `.json` CVs to extract skills, summary text, and inferred roles.
- **Multi-User Profile Switcher:** Pre-loaded default profile (`MAR_KEVIN_PROFILE`) plus `+ Add Profile` local switcher.

## Related Notes
- [[Feature - Resume Studio AI & ATS Printing]]
- [[ADR-004 - Client-Side Canvas Compression for Profile Media]]
- [[Design - Anti-AI-Slop Rules & Accessibility]]
