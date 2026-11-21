---
type: design-system
status: active
priority: p0-now
area: product
milestone: v1.0.7
commit_ref: "pending"
files:
  - AGENTS.md
  - src/app/globals.css
  - src/lib/theme.ts
  - src/app/layout.tsx
updated: 2026-11-22
tags:
  - pahirepo
  - agents-rules
  - design-system
  - anti-ai-slop
---

# Agent Rules — UI Design System & Anti-AI-Slop Mandate

Mirrors **Sections 1–4** of root [`AGENTS.md`](file:///d:/Dev/Pa-Hire%20Po/AGENTS.md). Every UI contribution to **Pa-Hire Po** MUST follow the **Civic Career Utility** design system (inspired by LinkedIn and JobStreet) and strictly avoid generic "AI slop" patterns.

---

## 1. Aesthetic Direction & Palette Roles
- **Aesthetic:** *Civic Career Utility* — calm, high-contrast, scannable utilitarian interface built for fast job evaluation and resume editing.
- **Light Civic (Default Theme):**
  - Canvas (`--background`): `#f3f2ef` (`bg-[#f3f2ef]`)
  - Surface / Cards: `#ffffff` (`bg-white`, `border-slate-200/90`)
  - Primary Ink (`--foreground`): `#0f172a` (`text-slate-900`)
  - Muted Ink: `#475569` (`text-slate-600`)
  - Primary Accent (`--accent-light`): `#0a66c2` (LinkedIn civic blue; hover `#004182`)
  - Positive / High Match (`>= 75%`): `#057642` (`emerald-800` / `emerald-50` pill with explicit `✓` prefix)
  - Active Signature: `3px` left accent border (`border-l-[3px] border-l-[#0a66c2]`) on the selected job card.
- **Dark Slate Theme:**
  - Canvas: `#0b0f17` (`bg-[#0b0f17]`)
  - Surface / Cards: `#111827` (`bg-[#111827]`, `border-slate-800`)
  - Primary Ink: `#f8fafc` (`text-slate-100`)
  - Muted Ink: `#94a3b8` (`text-slate-400`)
  - Primary Accent (`--accent-dark`): `#2563eb` / `blue-500` with `border-l-[3px] border-l-blue-500` active card accent. *(Note: See [[ADR-005 - Soft Grayscale Dark Mode Replacing Blue Dark Slate]] for monochrome grayscale evolution.)*

## 2. Typography Pairing
- **Display / Headings:** `Plus Jakarta Sans` (`--font-display`)
- **Body / Dense Job Text:** `Source Sans 3` (`--font-sans`)
- **Tabular Scores & Code Metrics:** `JetBrains Mono` (`--font-mono font-mono tabular-nums`)
- **Banned Voice Fonts:** Do NOT reintroduce `Inter`, `Roboto`, `Arial`, stock `Geist`, or generic `system-ui` as brand typography.

## 3. Strict Anti-AI-Slop Bans & Ruthless UI Architect Mandate
1. **Typography Tells:** No `Inter`, `Roboto`, `Arial`, or bare `system-ui` as primary brand voice.
2. **Color & Gradient Tells:** No purple-on-white or purple-to-indigo gradients; no default warm cream/sand backgrounds; no near-black + single acid-green/lime accent dark themes (`#000000` canvas with `#f97316` or acid-neon glow).
3. **Layout & Card Tells:** No identical 3-column card grids without functional variation; no fake `01/02/03` step markers with no sequential dependency; no nested card-in-card soup (`3+` nested borders; use `divide-y` or `border-t` hairlines instead); no decorative broadsheet hairlines or zero-radius boxes. Standard UI radius is `rounded-lg` (max `rounded-xl` on outer modal shells); NEVER use `rounded-3xl`.
4. **UI Chrome & Fake Data Tells:** No invented metrics, fake case-study counts, phantom testimonials, or re-drawn UI chrome. NEVER import `Sparkles` or `Wand2` from `lucide-react`; avoid shouting `font-black uppercase tracking-widest` micro-labels.
5. **Motion Tells:** No bouncy/elastic easing, random hover-scale transforms (`hover:scale-105`), or scattered micro-animations without a clear interaction purpose.
6. **Non-semantic Overlays & Color-Only State:**
   - All modals MUST use native `<dialog>` opened via `showModal()` (`closedby="any"`, `aria-labelledby`, `dialog.returnValue = ''` reset, inner scroll/flex wrapper so `display` is never set unconditionally on `<dialog>`, and `@media print` resets for `#a4-resume-sheet`).
   - Root `html` / `:root` MUST declare `color-scheme: light dark`, `accent-color`, and `scrollbar-color`, synced with the Light/Dark theme switcher.
   - Never rely on color alone for match tiers or fit status — pair colors with `✓` iconography and explicit text labels.

## 4. Required Build Rules
1. **Structural Variety:** Do not use `Hero -> 3-Feature Cards -> CTA -> Footer`; use product-fit structures (discovery stream + detail reading pane on `/jobs`, ledger on `/applications`, physical A4 sheet in Resume Studio).
2. **Token Discipline:** No inline color or font-size values bypassing design tokens (`getThemeTokens`, `--background`, `--foreground`).
3. **Responsive Safety:** `overflow-x: clip` on `html/body` (never `hidden`); display headers wrap cleanly (`overflow-wrap: anywhere; min-width: 0`); zero horizontal scroll at `375px+`.
4. **Content Truth:** Real copy, real layout pacing, and functional states (`empty`, `loading`, `error`) rather than lorem ipsum or fake statistics.

---

## Related Notes
- [[00 - AGENTS Rules Index]]
- [[Design - Civic Career Utility & Theme Tokens]]
- [[Design - Anti-AI-Slop Rules & Accessibility]]
- [[Design - Ruthless UI Architect & Anti-AI-Slop Rules]]
- [[ADR-003 - Native HTML Dialog Over Div Overlays]]
