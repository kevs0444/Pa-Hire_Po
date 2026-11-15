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

### 3. Strict Anti-AI-Slop Bans
Never introduce any of the following into components or styles:
1. **Pitch-black + acid neon dark-by-default palettes**: No `#000000` canvas, `#f97316` orange neon / amber gradients, or `#0d0603` mud-brown cards. Keep `'orange'` theme keys mapped cleanly to `'light'` only for storage backward compatibility.
2. **Purple/indigo gradients, warm parchment/cream marketing tropes, or decorative glow**: No `blur-3xl` glow orbs, gradient buttons, or drop-shadow neon halos.
3. **Bubble geometry & card nesting bloat**: Standard UI radius is `rounded-lg` (max `rounded-xl` on outer modal shells); NEVER use `rounded-3xl`, never nest 3+ card borders inside one another (use `divide-y` or `border-t` hairlines instead), and never add identical filler marketing card grids or fake `01/02/03` / `Stage 1–4` roadmap steps.
4. **Decorative icon & typographic spam**: NEVER import `Sparkles` or `Wand2` from `lucide-react`; avoid shouting `font-black uppercase tracking-widest` micro-labels.
5. **Non-semantic modal overlays & color-only state**:
   - All modals MUST use native `<dialog>` opened via `showModal()` (with `closedby="any"`, `aria-labelledby`, `dialog.returnValue = ''` reset, inner scroll/flex wrapper so `display` is never set unconditionally on `<dialog>`, and `@media print` resets for `#a4-resume-sheet`).
   - Root `html` / `:root` MUST declare `color-scheme: light dark`, `accent-color`, and `scrollbar-color`, synced with the Light/Dark theme switcher.
   - Never rely on color alone for match tiers or fit status — pair colors with `✓` iconography and explicit text labels.

### 4. Resume Studio (`AI`) & Personal Gemini API Rules
- The resume editor tab and workspace are named **Resume Studio** with a compact **`AI`** badge (`font-mono uppercase`).
- Page size defaults to **A4 (`210 × 297 mm`)** and supports dynamic switching (`A4`, `US Letter`, `US Legal`, `Dynamic Auto-Fit`) plus density presets (`Compact`, `Standard`, `Comfortable`) synchronized with `@page` print CSS and `#a4-resume-sheet`.
- While the app UI chrome strictly enforces `Plus Jakarta Sans` / `Source Sans 3` / `JetBrains Mono`, `#a4-resume-sheet` exposes the **Top 5 AI-ATS & Researcher Font Selector**: `Calibri` (Default, #1 AI ATS standard), `Helvetica` (#2 Tech & Engineering), `Garamond` (#3 Researcher & Academic), `Arial` (#4 Universal Legacy ATS), and `Georgia` (#5 High-Contrast Research Serif), with `font-variant-ligatures: none` enforced on preview and print so PDF parsers never misread `fi`/`fl` ligatures.
- Server route `src/app/api/resume/tailor/route.ts` uses `process.env.GEMINI_API_KEY` automatically with `gemini-3.1-flash-lite` (fallback `gemini-flash-lite-latest` → local `tailorResumeLocally`). Do not prompt the user for an API key unless they click Override Key or no server `.env` key is configured.

### 5. LinkedIn Profile Media, Action Buttons & Feature-Sliced Architecture Rules
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

### 6. Vercel Store Supabase Lock & Public Login Surface Rules
- **Single Backend Store (`supabase-erin-elephant` • `muftcprpqnzuzfosvftz`)**: **Pa-Hire Po** exclusively uses the Vercel-integrated Supabase project (`https://muftcprpqnzuzfosvftz.supabase.co`). Do NOT add alternate direct Supabase project switchers or multi-project preset selectors anywhere in the UI or schema headers.
- **Clean Public `/login` Route (`AuthScreen.tsx`)**: Never render Supabase setup checklists, project URLs, `.env` API key inputs, or `schema.sql` snippets on the public `/login` screen. Keep `/login` strictly focused on authentication (`Password`, `Create Account`, `Magic Link / OTP`, `Reset Password`, and Social OAuth), plus a conditional local Admin sandbox button only when `keyValid` or `schemaReady` is incomplete (or when running locally in development).
- **Admin-Only Supabase Settings (`AdminDashboardView.tsx` & `AdminSupabaseSetupDialog.tsx`)**: All live Supabase connection health checks (`1. API Key (.env)`, `2. SQL Tables & RLS`, `3. Admin User Directory Key`, `4. Backend Runtime & Gemini AI`), `Copy schema.sql`, and `.env` key configuration belong strictly inside the **Admin Control Center**.
