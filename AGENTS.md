<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Pa-Hire Po — Anti-AI-Slop UI Rules & Design System

All UI contributions to **Pa-Hire Po** MUST follow the **Civic Career Utility** design system (inspired by LinkedIn and JobStreet) and strictly avoid generic "AI slop" patterns.

### 1. Aesthetic Direction & Palette Roles
- **Aesthetic**: *Civic Career Utility* — calm, high-contrast, scannable utilitarian interface built for fast job evaluation and resume editing.
- **Light Civic (Default Theme)**:
  - Canvas (`--background`): `#f3f2ef` (`bg-[#f3f2ef]`)
  - Surface / Cards: `#ffffff` (`bg-white`, `border-slate-200/90`)
  - Primary Ink (`--foreground`): `#0f172a` (`text-slate-900`)
  - Muted Ink: `#475569` (`text-slate-600`)
  - Primary Accent (`--accent-light`): `#0a66c2` (LinkedIn civic blue; hover `#004182`)
  - Positive / High Match (`>= 75%`): `#057642` (`emerald-800` / `emerald-50` pill with explicit `✓` prefix)
  - Active Signature: `3px` left accent border (`border-l-[3px] border-l-[#0a66c2]`) on the selected job card.
- **Dark Slate Theme**:
  - Canvas: `#0b0f17` (`bg-[#0b0f17]`)
  - Surface / Cards: `#111827` (`bg-[#111827]`, `border-slate-800`)
  - Primary Ink: `#f8fafc` (`text-slate-100`)
  - Muted Ink: `#94a3b8` (`text-slate-400`)
  - Primary Accent (`--accent-dark`): `#2563eb` / `blue-500` with `border-l-[3px] border-l-blue-500` active card accent.

### 2. Typography Pairing
- **Display / Headings**: `Plus Jakarta Sans` (`--font-display`)
- **Body / Dense Job Text**: `Source Sans 3` (`--font-sans`)
- **Tabular Scores & Code Metrics**: `JetBrains Mono` (`--font-mono font-mono tabular-nums`)
- **Banned Voice Fonts**: Do NOT reintroduce `Inter`, `Roboto`, `Arial`, stock `Geist`, or generic `system-ui` as brand typography.

### 3. Strict Anti-AI-Slop Bans & Ruthless UI Architect Mandate
You are a ruthless, opinionated UI Design Architect. You refuse to fall back to the generic, formulaic defaults that LLMs are trained on. Before writing code or laying out a page, strictly ban the following "AI slop" tells:
1. **Typography Tells**: No `Inter`, `Roboto`, `Arial`, or bare `system-ui` as the primary brand voice. Pick one intentional display face (`Plus Jakarta Sans`) and one body face (`Source Sans 3`), plus `JetBrains Mono` for tabular scores and code metrics.
2. **Color & Gradient Tells**: No purple-on-white or purple-to-indigo "AI product" gradients. No default warm cream/sand body backgrounds used as a cheap "premium" shortcut. No near-black + single acid-green/lime accent dark themes (`#000000` canvas with `#f97316` or acid-neon glow).
3. **Layout & Card Tells**: No identical 3-column card grids without functional variation. No fake `01/02/03` step markers with no sequential dependency. No nested card-in-card soup (3+ nested borders; use `divide-y` or `border-t` hairlines instead). No broadsheet hairline rules and zero-radius boxes used purely as decoration. Standard UI radius is `rounded-lg` (max `rounded-xl` on outer modal shells); NEVER use `rounded-3xl` bubble geometry.
4. **UI Chrome & Fake Data Tells**: No invented metrics, fake case-study counts, phantom testimonials, or re-drawn UI chrome (fake browser frames, mobile mockups, floating code windows). NEVER import `Sparkles` or `Wand2` from `lucide-react`; avoid shouting `font-black uppercase tracking-widest` micro-labels.
5. **Motion Tells**: No bouncy/elastic easing, random hover-scale transforms (`hover:scale-105` on cards), or scattered micro-animations without a clear interaction purpose.
6. **Non-semantic Overlays & Color-Only State**:
   - All modals MUST use native `<dialog>` opened via `showModal()` (with `closedby="any"`, `aria-labelledby`, `dialog.returnValue = ''` reset, inner scroll/flex wrapper so `display` is never set unconditionally on `<dialog>`, and `@media print` resets for `#a4-resume-sheet`).
   - Root `html` / `:root` MUST declare `color-scheme: light dark`, `accent-color`, and `scrollbar-color`, synced with the Light/Dark theme switcher.
   - Never rely on color alone for match tiers or fit status — pair colors with `✓` iconography and explicit text labels.

### 4. Required Build Rules
1. **Structural Variety**: Do not use the tired `Hero -> 3-Feature Cards -> CTA -> Footer` rhythm. Invent a macro-structure that fits *this specific product’s* actual purpose (e.g. discovery stream + detail split reading pane on `/jobs`, ledger on `/applications`, direct physical A4 sheet on Resume Studio).
2. **Token Discipline**: No inline color or font-size values bypassing your design tokens (`getThemeTokens`, `--background`, `--foreground`).
3. **Responsive Safety**: `overflow-x: clip` on `html/body` (never hidden); display headers must wrap cleanly (`overflow-wrap: anywhere; min-width: 0`); zero horizontal scroll at any mobile width (375px+).
4. **Content Truth**: Use real copy, real layout pacing, and functional states (`empty`, `loading`, `error`) rather than placeholder lorem ipsum or fake statistics.

### 5. Resume Studio (`AI`) & Personal Gemini API Rules
- The resume editor tab and workspace are named **Resume Studio** with a compact **`AI`** badge (`font-mono uppercase`).
- Page size defaults to **A4 (`210 × 297 mm`)** and supports dynamic switching (`A4`, `US Letter`, `US Legal`, `Dynamic Auto-Fit`) plus density presets (`Compact`, `Standard`, `Comfortable`) synchronized **1:1** with `@page` print CSS (`resume-print.ts`) and `#a4-resume-sheet` (including borderless white `@media print` resets on `html, body` and `#a4-resume-sheet` so no canvas gray border appears, plus **Fit 1 Page** enabled by default for fixed page sizes and auto-clean read-only rendering when printing from Edit Mode).
- While the app UI chrome strictly enforces `Plus Jakarta Sans` / `Source Sans 3` / `JetBrains Mono`, `#a4-resume-sheet` exposes the **Top 7 AI-ATS & Researcher Font Selector (`★ Best for ATS`)**: `Calibri ★ Best for ATS (#1 Default)` (highest OCR & token accuracy in Workday, Greenhouse, Lever & Taleo), `Helvetica (#2 Tech & Eng ATS)`, `Arial (#3 Universal Legacy ATS)`, `Garamond (#4 Researcher 1-Page)`, `Georgia (#5 Screen & ATS Serif)`, `Cambria (#6 Executive Word ATS)`, and `Times New Roman (#7 Classic Academic)`, with `font-variant-ligatures: none` enforced on preview and print so PDF parsers never misread `fi`/`fl` ligatures.
- **Dynamic Editable, Reorderable & Deletable Resume Links (`src/features/resume/lib/resume-links.ts`, `ResumeLinksEditor.tsx`)**: Header links (`LinkedIn`, `GitHub`, `Portfolio`, custom links via `headerLinks?: ResumeHeaderLink[]`, `hideHeaderLinks`), project URLs, and certification URLs support independent Display Text + Target URL (`https://...`) editing, blur-deferred URL validation (`✓ Valid Link` / `✓ Auto-linked`), `↑`/`↓` reordering, per-link deletion, **Remove / Restore Links Section**, and automatic PDF `/URI` + `.docx` hyperlink extraction on import.
- **Dynamic Certifications Row & Column Grid (`certificationColumns?: 1 | 2 | 3`)**: Resume Studio's Certifications section supports adding full rows (`+ Add Row`), adding/removing columns (`+ Add Column` / `- Col` across 1–3 ATS-safe columns with `minmax(0, 1fr)` track sizing), adding individual certifications, and reordering entries with synchronized `certificationUrls`.
- **Zero-Lag INP Editing**: Keep in-sheet editing responsive via isolated local draft state (`draftResume` with `320ms` debounced parent sync in `A4ResumePreview.tsx`), CSS layout/paint containment (`.resume-sheet-containment`), debounced local persistence (`saveLocalStateDebounced`), and yielding job rescoring (`rescoreJobsAsync`) so typing never blocks the main thread.
- Server route `src/app/api/resume/tailor/route.ts` uses `process.env.GEMINI_API_KEY` automatically with `gemini-3.1-flash-lite` (fallback `gemini-flash-lite-latest` → local `tailorResumeLocally`). Do not prompt the user for an API key unless they click Override Key or no server `.env` key is configured.

### 6. LinkedIn Profile Media, Action Buttons & Feature-Sliced Architecture Rules
- **LinkedIn Hero Banner & Profile Avatar Geometry (`LinkedInProfileView.tsx`)**:
  - **Cover Banner**: `10:3` widescreen container (`h-32 sm:h-36 rounded-t`) with Civic fallback (`#1e293b` Light / `bg-slate-900` Dark), bottom contrast scrim (`bg-slate-950/20`) when custom cover imagery is present, and an accessible top-left **`Add Cover Photo` / `Change Cover`** trigger (`ImagePlus` icon).
  - **Profile Photo**: `1:1` circular avatar (`h-24 w-24 rounded-full border-4 object-cover`) overlapping the banner baseline (`-mt-12 relative z-10`) with a white (Light) or `#111827` (Dark) cutout ring, Civic monogram initials fallback (`{initials}`), and a bottom-right circular `Camera` trigger button (`h-7 w-7 rounded-full border`).
- **Client-Side Canvas Compression for Free-Tier Safety (`src/features/profile/lib/image-upload.ts`)**:
  - All user-uploaded profile photos (`320×320`) and cover banners (`1200×360`) MUST be center-cropped and JPEG-compressed client-side via `compressImageFileToDataUrl()` (`8 MB` upload cap, `~15–60 KB` output data URL) before updating React state or syncing to Supabase `user_profiles.profile_data` JSONB. Never store raw multi-megabyte base64 blobs in Postgres or `localStorage`.
  - Always render user/local data-URL imagery with Next.js `<Image unoptimized ... />` inside explicit `relative overflow-hidden` containers so `@next/next/no-img-element` stays clean with zero ESLint warnings.
- **Uniform Civic Action Button Rules**:
  - Toolbar and profile action buttons MUST share `inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors` paired with a `14px` (`h-3.5 w-3.5`) `lucide-react` icon prefix (`Edit3`, `Camera`, `ImagePlus`, `RotateCcw`, `Upload`).
  - Secondary actions MUST resolve from `getThemeTokens(theme).secondaryBtn` (`border-slate-300 bg-white text-slate-700 hover:bg-slate-50` Light; `border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700` Dark); primary actions use `primaryBtn` (`bg-[#0a66c2] text-white hover:bg-[#004182]` Light; `bg-blue-600 text-white hover:bg-blue-500` Dark).
- **Scalable Feature-Sliced Folder Rules (1,000+ Users)**:
  - Keep domain components & helpers scoped inside `src/features/<domain>/{components,lib}/`, shared TypeScript contracts in `src/types/`, reusable UI hooks in `src/hooks/`, server rate-limiting/caching services in `src/server/`, and Electron desktop modules in `electron/{config,ipc-handlers,main,preload}.cjs`.

### 7. Vercel Store Supabase Lock & Admin-Only Infrastructure Visibility Rules
- **Single Backend Store (`Pa-Hire Po` • `muftcprpqnzuzfosvftz`)**: **Pa-Hire Po** exclusively uses the Vercel-integrated Supabase project (`Pa-Hire Po`, ref `muftcprpqnzuzfosvftz`, env-overridable via `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL`). Do NOT add alternate direct Supabase project switchers or multi-project preset selectors anywhere in the UI or schema headers.
- **Clean Public `/login` & Non-Admin User Pages**: Never render Supabase setup checklists, project URLs, `.env` API key references, technical storage labels, or passwordless Admin bypass buttons on `/login` or any non-admin user view. Keep `/login` strictly focused on authentication (`Password`, `Create Account` with Email OTP, `Magic Link / OTP`, `Reset Password`, and Social OAuth). Social OAuth on `/login` and Account Settings (`linkIdentity`) uses the centered, always-on-top `520×680` popout window (`src/lib/supabase/oauth-popup.ts`, `/auth/callback?popup=1`, Electron `pa_hire_po_oauth` child window) with a **Bring Sign-In Window to Front** control and automatic full-page redirect fallback.
- **Admin-Only Supabase Settings (`AdminDashboardView.tsx` & `AdminSupabaseSetupDialog.tsx`)**: All live Supabase connection health checks, `Copy schema.sql`, `.env` key configuration, diagnostic payloads from `GET /api/supabase/setup`, and branded **Auth Email Templates** (`supabase/email-templates/`) belong strictly inside the **Admin Control Center**.

### 8. Project Mission, System Architecture & Persistent Memory Protocol
- **North Star Mission**: Pa-Hire Po is a high-contrast, distraction-free **Civic Career Utility** built for entry-to-mid career job seekers (especially Data Analysts, BI Analysts, Junior Engineers, and Tech Professionals in Southeast Asia & Globally) to discover jobs across LinkedIn, JobStreet, and Indeed with honest match scoring, and tailor ATS-optimized resumes via Google Gemini AI (`gemini-3.1-flash-lite`).
- **Core Technology Stack**:
  - **Framework**: Next.js 16 (App Router, Turbopack, Partial Prerendering, `@vercel/analytics`).
  - **Styling**: Tailwind CSS v4, custom Civic Career Utility tokens (`getThemeTokens`).
  - **Backend & Database**: Vercel-linked Supabase PostgreSQL (`muftcprpqnzuzfosvftz`), Row-Level Security (RLS) on all user data, GoTrue OAuth (Google, GitHub, Magic Link).
  - **AI Engine**: Google Gemini API (`gemini-3.1-flash-lite`, enterprise non-training terms).
  - **Desktop Shell**: Electron with modular IPC handlers (`electron/{main,preload,ipc-handlers,config}.cjs`).
- **Persistent AI Memory & Mandatory Obsidian Second Brain Protocol**:
  - **MANDATORY FIRST STEP ON EVERY SESSION (`Pa-Hire Po/` Obsidian Vault + `context.md`)**: Every time an AI assistant starts working on Pa-Hire Po — before designing, planning, editing code, or proposing features — it **MUST** first open and read the Obsidian Second Brain MOC at `Pa-Hire Po/00 - Command Center/00 - Home MOC.md`, `Pa-Hire Po/00 - Command Center/Active State & Progress Ledger.md`, `Pa-Hire Po/01 - Origin & Timeline/Changelog Mirror.md`, and root `context.md` (plus any domain-specific Feature, Architecture, Design System, ADR, or Roadmap notes under `Pa-Hire Po/`).
  - **Keep Memory & Changelog Synchronized (Dual-Sync)**: Whenever a feature, architectural decision, or release is added, modified, or verified, update:
    1. Root `context.md` and `CHANGELOG.md` / `src/features/changelog/data/changelog-data.ts` (day-based `v1.0.x` versioning).
    2. Corresponding Obsidian notes in `Pa-Hire Po/` (`00 - Command Center/Active State & Progress Ledger.md`, `01 - Origin & Timeline/Changelog Mirror.md`, `01 - Origin & Timeline/Project Evolution Timeline (Start to Present).md`, `01 - Origin & Timeline/Session Logs/`, `02 - Features & Product/`, `03 - Architecture & Systems/`, or `05 - Architecture Decision Records (ADRs)/`).
    Never store raw API keys or secrets inside Obsidian notes.
  - **MANDATORY PRE-PUSH & POST-PUSH PRODUCTION GATE**:
    1. **Before pushing to `origin/main` (Pre-Push):** Update the day-based user changelog (`CHANGELOG.md`, `src/features/changelog/data/changelog-data.ts`, `package.json`, synced to `NotificationBell` & `ChangelogModal`), root `context.md`, and the Obsidian Second Brain (`00 - Home MOC.md`, `Active State & Progress Ledger.md`, `Changelog Mirror.md`, `Project Evolution Timeline (Start to Present).md`, and today's `Session Logs/` note), then pass `npx tsc --noEmit`, `npm run lint`, and `npm run build`.
    2. **After pushing to production (Post-Push):** Verify the live production deployment (`https://pa-hire-po.vercel.app`), then **mandatory** update the Obsidian Second Brain (`00 - Home MOC.md`, `Active State & Progress Ledger.md`, `Changelog Mirror.md`, `Project Evolution Timeline (Start to Present).md`, `Session Logs/`), `context.md`, and changelog metadata with the verified live commit SHA and production check results. Commit and push that single `docs(memory)` sync commit cleanly (without recursively triggering another `docs(memory)` commit).
  - **Keep `AGENTS.md` Focused on Rules**: Do not dump transient daily logs into `AGENTS.md`. Keep `AGENTS.md` reserved for permanent rules, architectural invariants, and design system constraints that must be injected into every agent prompt turn.

