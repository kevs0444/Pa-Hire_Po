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
- Server route `src/app/api/resume/tailor/route.ts` uses `process.env.GEMINI_API_KEY` automatically with `gemini-3.1-flash-lite` (fallback `gemini-flash-lite-latest` → local `tailorResumeLocally`). Do not prompt the user for an API key unless they click Override Key or no server `.env` key is configured.
