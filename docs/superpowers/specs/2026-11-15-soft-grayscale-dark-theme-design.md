# Design Doc: Soft Grayscale & Black/White Dark Mode

- **Date**: 2026-11-15
- **Status**: Draft (Awaiting Approval)
- **Topic**: Soft Monochrome & Black/White Theme for Dark Mode

---

## 1. Intent & Context
The user requested a **Black and White theme** for dark mode that is **not harsh / not high contrast**.
Currently, dark mode uses a dark navy/slate canvas (`#0b0f17`) with saturated blue accents (`#2563eb`, `#3b82f6`) for buttons, active card borders, tabs, and badges.

This design replaces all dark-mode color accents with a refined, soft grayscale / charcoal palette:
- Eliminates saturated blue, purple, and colored accents from the dark mode UI chrome.
- Avoids harsh, eye-straining pure `#000000` against piercing `#FFFFFF` (low/moderate eye-friendly contrast).
- Retains external brand logos (LinkedIn, JobStreet, Indeed) in their recognized marks so boards remain identifiable.

---

## 2. Palette Architecture

| Role | Light Theme (Civic Utility) | New Dark Theme (Soft Grayscale Monochrome) |
|---|---|---|
| **Canvas / Background (`pageBg`)** | `#f3f2ef` (Light Civic) | `#121214` (Soft Charcoal Dark) |
| **Card Surface (`cardSurface`)** | `#ffffff`, `border-slate-200/90` | `#18181b` (Muted Zinc Surface), `border-zinc-800/90` |
| **Subsurface (`subSurface`)** | `bg-slate-50/85`, `border-slate-200` | `#202024` (Subtle Elevation), `border-zinc-800/80` |
| **Primary Ink (`strongText`)** | `text-slate-900` | `text-zinc-100` (Soft White, non-glaring) |
| **Muted Ink (`mutedText`)** | `text-slate-600` | `text-zinc-400` (Calm Muted Gray) |
| **Primary Button (`primaryBtn`)** | `#0a66c2` (Civic Blue) | `bg-zinc-100 text-zinc-950 hover:bg-white` (Clean Off-White) |
| **Secondary Button (`secondaryBtn`)** | `border-slate-300 bg-white text-slate-700` | `border-zinc-700/80 bg-[#1e1e22] text-zinc-200 hover:bg-zinc-800` |
| **Active Nav Tabs** | `border-b-2 border-[#0a66c2] text-[#0a66c2]` | `border-b-2 border-zinc-200 text-zinc-100` |
| **Selected Job Card Signature** | `border-l-[3px] border-l-[#0a66c2]` | `border-l-[3px] border-l-zinc-300 bg-[#222227]` |
| **Match Score Ring (`MatchScoreRing`)** | `#057642` / `#0a66c2` | `text-zinc-100` (&ge;75%), `text-zinc-400` (&ge;55%), `text-zinc-600` (<55%) |
| **Status / Fit Badges** | `emerald-50` / `emerald-800` | `bg-zinc-800/80 text-zinc-200 border-zinc-700` |
| **Inputs (`inputSurface`)** | `bg-white border-slate-300 focus:border-[#0a66c2]` | `bg-[#121214] border-zinc-700 text-zinc-100 focus:border-zinc-400` |

---

## 3. Files to Touch

1. **`src/lib/theme.ts`**:
   - Update `getThemeTokens('dark')`:
     - Canvas from `#0b0f17` &rarr; `#121214`.
     - Surfaces from `#111827` &rarr; `#18181b` / `#202024`.
     - Primary button from `#2563eb` &rarr; `bg-zinc-100 text-zinc-950 hover:bg-white`.
     - Active card signature border from `border-l-blue-500` &rarr; `border-l-zinc-300`.
     - Bar fill from `bg-blue-500` &rarr; `bg-zinc-300`.
     - Badges from blue tint &rarr; `border-zinc-700 bg-zinc-800/60 text-zinc-200`.

2. **`src/app/globals.css`**:
   - Update `:root` dark mode CSS variables (`--background: #121214; --foreground: #f4f4f5; --accent-color: #e4e4e7;`).
   - Update scrollbar track/thumb to match `#18181b` and `#3f3f46`.

3. **`src/components/ui/MatchScoreRing.tsx`**:
   - In dark mode, map SVG ring stroke and text to soft zinc tones (`zinc-100` for high match, `zinc-400` for mid match, `zinc-600` for lower match, `zinc-800` for track) instead of bright emerald/blue.

4. **`src/components/PleaseHireMeDashboard.tsx`**:
   - Update active nav tab underlines in dark mode from `border-blue-400 text-blue-400` &rarr; `border-zinc-200 text-white`.
   - Update match pill badges in dark mode from `emerald` &rarr; `border-zinc-700 bg-zinc-800/80 text-zinc-200`.

5. **`src/features/jobs/components/JobDetailPane.tsx` & `TopChoicesSpotlight.tsx`**:
   - Update dark mode match score badges and action highlights to soft monochrome zinc/white.

6. **`src/components/LandingPageView.tsx`**:
   - Replace any remaining `text-blue-400` dark mode link with `text-zinc-200 hover:text-white`.

---

## 4. Verification Plan
- **Type safety**: Run `npx tsc --noEmit` to confirm zero TypeScript compilation errors.
- **Visual Inspection**:
  - Switch to Dark Theme in the app header.
  - Verify background is soft charcoal (`#121214`), cards are `#18181b`, and text is non-glaring off-white.
  - Check buttons: Primary buttons are clean off-white with dark text; secondary buttons are dark charcoal.
  - Check selected job card: Active left border is crisp silver/light-zinc, not electric blue.
  - Check match score rings: Renders in clean silver/gray monochrome.
  - Switch back to Light Theme to confirm zero regression on the default Civic Utility theme.
