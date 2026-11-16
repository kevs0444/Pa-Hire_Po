---
type: design-system
status: verified
priority: p0-now
area: product
milestone: v2-rebrand
commit_ref: "288ca06"
files:
  - AGENTS.md
  - src/hooks/useNativeDialog.ts
  - src/app/globals.css
updated: 2026-11-16
tags:
  - pahirepo
  - design-system
  - anti-ai-slop
  - accessibility
---

# Design — Anti-AI-Slop Rules & Accessibility

## Strict Banned Patterns
1. **No Neon / Pure-Black Dark Slop:** Never use `#000000` canvas, `#f97316` neon orange, or mud-brown cards.
2. **No Purple/Indigo Gradients or Glow:** Never add `blur-3xl` glow orbs, gradient buttons, or neon halos.
3. **No Bubble Geometry or Card Nesting Bloat:** Radius stays `rounded-lg` (`rounded-xl` max on outer modal shells). Never use `rounded-3xl`, never nest 3+ card borders (use `divide-y` or `border-t` hairlines), and never add filler `01/02/03` or `Stage 1–4` marketing grids.
4. **No Decorative Icon Spam or Banned Fonts:** Never import `Sparkles` or `Wand2` from `lucide-react`; never reintroduce `Inter`, `Roboto`, `Arial`, stock `Geist`, or `system-ui` as brand UI chrome.
5. **No `fixed inset-0` Div Overlays:** Never build custom `<div>` modal backdrops.

## Mandatory Craft & Accessibility Standards
- **Native Top-Layer `<dialog>` (`useNativeDialog.ts`):** All modals (`ApplyFlowModal`, `HowItWorksModal`, `SubmittedResumeModal`, `ChangelogModal`, `AdminSupabaseSetupDialog`, `AdminUserInspectDialog`) use `showModal()`, `closedby="any"`, `aria-labelledby`, `dialog.returnValue = ''` reset, inner scroll wrappers (so `display` is never forced unconditionally on `<dialog>`), and `@media print` resets for `#a4-resume-sheet`.
- **Root Color Scheme:** `:root` declares `color-scheme: light dark`, `accent-color`, and `scrollbar-color` synced to Light/Dark selection.
- **Non-Color-Only State Cues:** Always pair match colors with explicit `✓` iconography and text labels (`>= 75%` High Match).
- **Uniform Civic Buttons:** `inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors` with `h-3.5 w-3.5` `lucide-react` icons.
- **Next.js Media Discipline:** User/local data-URL photos use `<Image unoptimized ... />` inside `relative overflow-hidden` containers so ESLint `@next/next/no-img-element` stays clean.

## Related Notes
- [[Design - Civic Career Utility & Theme Tokens]]
- [[ADR-003 - Native HTML Dialog Over Div Overlays]]
- [[ADR-004 - Client-Side Canvas Compression for Profile Media]]
