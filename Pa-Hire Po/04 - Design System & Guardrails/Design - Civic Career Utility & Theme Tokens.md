---
type: design-system
status: verified
priority: p0-now
area: product
milestone: v2-rebrand
commit_ref: "4dfbd03"
files:
  - AGENTS.md
  - src/lib/theme.ts
  - src/app/layout.tsx
  - src/app/globals.css
updated: 2026-11-16
tags:
  - pahirepo
  - design-system
  - theme
---

# Design — Civic Career Utility & Theme Tokens

## Aesthetic Direction
**Civic Career Utility** — calm, high-contrast, scannable utilitarian interface inspired by LinkedIn and JobStreet, engineered for fast job evaluation and distraction-free resume editing.

## Live Theme Token Comparison (`src/lib/theme.ts`)

| Token Role | Light Civic (Default) | Soft Grayscale Dark Mode (Live `4dfbd03`) |
|---|---|---|
| `pageBg` | `#f3f2ef` (`text-slate-900`) | `#121214` (`text-zinc-100`) |
| `cardSurface` | `#ffffff`, `border-slate-200/90` | `#18181b`, `border-zinc-800/90` |
| `subSurface` | `bg-slate-50/85`, `border-slate-200` | `#202024`, `border-zinc-800/80` |
| `primaryBtn` | `#0a66c2` (hover `#004182`, white ink) | `bg-zinc-100 text-zinc-950 hover:bg-white` |
| `secondaryBtn` | `border-slate-300 bg-white text-slate-700` | `border-zinc-700/80 bg-[#1e1e22] text-zinc-200` |
| `selectedCard` | `border-l-[3px] border-l-[#0a66c2] bg-[#f8fafc]` | `border-l-[3px] border-l-zinc-300 bg-[#222227]` |
| `mutedText` | `text-slate-600` | `text-zinc-400` |

> **Documentation Drift Note:** [`AGENTS.md`](file:///d:/Dev/Pa-Hire%20Po/AGENTS.md) Section 1 still mentions the earlier Dark Slate tokens (`#0b0f17` / `#2563eb`), whereas live code in [`src/lib/theme.ts`](file:///d:/Dev/Pa-Hire%20Po/src/lib/theme.ts) implements the Soft Grayscale Monochrome dark palette designed in commit `4dfbd03`. Legacy `'orange'` local preferences normalize safely to `'light'`.

## Typography Pairing
- **Display / Headings:** `Plus Jakarta Sans` (`--font-display`)
- **Body / Dense Job Text:** `Source Sans 3` (`--font-sans`)
- **Tabular Scores & Metrics:** `JetBrains Mono` (`--font-mono font-mono tabular-nums`)
- **Resume Sheet (`#a4-resume-sheet`):** Exposes Top 5 AI-ATS & Researcher Fonts (`Calibri`, `Helvetica`, `Garamond`, `Arial`, `Georgia`) with `font-variant-ligatures: none`.

## Related Notes
- [[Design - Anti-AI-Slop Rules & Accessibility]]
- [[ADR-005 - Soft Grayscale Dark Mode Replacing Blue Dark Slate]]
- [[Feature - Resume Studio AI & ATS Printing]]
