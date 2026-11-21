---
type: architecture
status: active
priority: p0-now
area: resume-ai
milestone: v1.0.7
commit_ref: "db3b4ea"
files:
  - AGENTS.md
  - src/features/resume/components/A4ResumePreview.tsx
  - src/features/resume/lib/resume-links.ts
  - src/features/profile/components/LinkedInProfileView.tsx
  - src/features/profile/lib/image-upload.ts
  - src/lib/supabase/oauth-popup.ts
updated: 2026-11-22
tags:
  - pahirepo
  - agents-rules
  - resume-studio
  - profile-media
  - supabase
---

# Agent Rules — Resume Studio, Profile Media & Supabase Lock

Mirrors **Sections 5–7** of root [`AGENTS.md`](file:///d:/Dev/Pa-Hire%20Po/AGENTS.md).

---

## 5. Resume Studio (`AI`) & Personal Gemini API Rules
- **Naming & Branding:** Workspace and tab are named **Resume Studio** with a compact **`AI`** badge (`font-mono uppercase`).
- **Paper Sizing & Borderless Print:** Page size defaults to **A4 (`210 × 297 mm`)** and supports `A4`, `US Letter`, `US Legal`, and `Dynamic Auto-Fit`, plus density presets (`Compact`, `Standard`, `Comfortable`), synchronized with `@page` print CSS and `#a4-resume-sheet` (including pure white borderless `@media print` resets on `html, body` and `#a4-resume-sheet`).
- **Top 7 AI-ATS & Researcher Font Selector (`★ Best for ATS`):** `Calibri ★ Best for ATS (#1 Default)`, `Helvetica (#2 Tech & Eng ATS)`, `Arial (#3 Universal Legacy ATS)`, `Garamond (#4 Researcher 1-Page)`, `Georgia (#5 Screen & ATS Serif)`, `Cambria (#6 Executive Word ATS)`, and `Times New Roman (#7 Classic Academic)`, with `font-variant-ligatures: none` enforced on preview and print.
- **Dynamic Editable, Reorderable & Deletable Resume Links (`resume-links.ts`, `ResumeLinksEditor.tsx`):** Header links (`LinkedIn`, `GitHub`, `Portfolio`, custom links via `headerLinks?: ResumeHeaderLink[]`, `hideHeaderLinks`), project URLs, and certification URLs support independent Display Text + Target URL (`https://...`) editing, blur-deferred URL validation (`✓ Valid Link` / `✓ Auto-linked`), `↑`/`↓` reordering, per-link deletion, **Remove / Restore Links Section**, and automatic PDF `/URI` + `.docx` hyperlink extraction on import.
- **Dynamic Certifications Row & Column Grid (`certificationColumns?: 1 | 2 | 3`):** Supports adding full rows (`+ Add Row`), adding/removing columns (`+ Add Column` / `- Col` across 1–3 ATS-safe columns with `minmax(0, 1fr)` track sizing), adding individual certifications, and reordering entries with synchronized `certificationUrls`.
- **Zero-Lag INP Editing:** Isolated local draft state (`draftResume` with `320ms` debounced parent sync in `A4ResumePreview.tsx`), CSS layout/paint containment (`.resume-sheet-containment`), debounced local persistence (`saveLocalStateDebounced`), and yielding job rescoring (`rescoreJobsAsync`).
- **Gemini API Route (`src/app/api/resume/tailor/route.ts`):** Uses `process.env.GEMINI_API_KEY` automatically with `gemini-3.1-flash-lite` (fallback `gemini-flash-lite-latest` → local `tailorResumeLocally`). Never prompt standard users for an API key unless they click Override Key or no server `.env` key is configured.

## 6. LinkedIn Profile Media, Action Buttons & Feature-Sliced Architecture
- **Hero Banner & Profile Avatar Geometry (`LinkedInProfileView.tsx`):**
  - Cover Banner: `10:3` widescreen (`h-32 sm:h-36 rounded-t`), `#1e293b` Light / `bg-slate-900` Dark fallback, `bg-slate-950/20` bottom scrim when custom cover imagery is present, top-left **`Add Cover Photo` / `Change Cover`** trigger (`ImagePlus`).
  - Profile Photo: `1:1` circular avatar (`h-24 w-24 rounded-full border-4 object-cover`) overlapping the banner baseline (`-mt-12 relative z-10`), white (Light) or `#111827` (Dark) cutout ring, Civic monogram initials fallback (`{initials}`), bottom-right circular `Camera` trigger (`h-7 w-7 rounded-full border`).
- **Client-Side Canvas Compression (`src/features/profile/lib/image-upload.ts`):**
  - Profile photos (`320×320`) and cover banners (`1200×360`) MUST be center-cropped and JPEG-compressed client-side via `compressImageFileToDataUrl()` (`8 MB` upload cap, `~15–60 KB` output) before updating state or syncing to `user_profiles.profile_data` JSONB.
  - Render user/local data-URL imagery with Next.js `<Image unoptimized ... />` inside explicit `relative overflow-hidden` containers.
- **Uniform Civic Action Buttons:** Toolbar/profile actions share `inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors` with a `14px` (`h-3.5 w-3.5`) `lucide-react` icon prefix, using `getThemeTokens(theme).secondaryBtn` or `primaryBtn`.
- **Feature-Sliced Folder Rules (`1,000+` Users):** Domain components/helpers live under `src/features/<domain>/{components,lib}/`, shared contracts in `src/types/`, UI hooks in `src/hooks/`, server rate-limiting/caching in `src/server/`, and Electron desktop modules in `electron/{config,ipc-handlers,main,preload}.cjs`.

## 7. Vercel Store Supabase Lock & Admin-Only Infrastructure Visibility
- **Single Backend Store (`Pa-Hire Po` • `muftcprpqnzuzfosvftz`):** Exclusively uses the Vercel-integrated Supabase project (`muftcprpqnzuzfosvftz`, env-overridable via `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL`). Do NOT add alternate project switchers.
- **Clean Public `/login` & Non-Admin User Pages:** Never render Supabase setup checklists, project URLs, `.env` references, storage diagnostics, or passwordless Admin bypass buttons on `/login` or non-admin views. Social OAuth (`signInWithOAuth` & `linkIdentity`) uses the centered `520×680` always-on-top popout (`oauth-popup.ts`, `/auth/callback?popup=1`, Electron `pa_hire_po_oauth`) with automatic full-page redirect fallback.
- **Admin-Only Supabase Settings (`AdminDashboardView.tsx`, `AdminSupabaseSetupDialog.tsx`):** Connection health checks, `Copy schema.sql`, `.env` configuration, `GET /api/supabase/setup` diagnostics, and branded **Auth Email Templates** (`supabase/email-templates/`) belong strictly inside the **Admin Control Center**.

---

## Related Notes
- [[00 - AGENTS Rules Index]]
- [[Feature - Resume Studio AI & ATS Printing]]
- [[Feature - LinkedIn Profile Media & 2-Way Resume Sync]]
- [[ADR-001 - Lock Single Vercel Supabase Store]]
- [[ADR-004 - Client-Side Canvas Compression for Profile Media]]
