---
type: adr
status: accepted
priority: p0-now
area: product
milestone: v2-rebrand
commit_ref: "4dfbd03"
files:
  - src/lib/theme.ts
  - docs/superpowers/specs/2026-11-15-soft-grayscale-dark-theme-design.md
  - AGENTS.md
updated: 2026-11-16
tags:
  - pahirepo
  - adr
  - design-system
---

# ADR-005 — Soft Grayscale Dark Mode Replacing Blue Dark Slate

## Context
After pivoting away from the initial 3-color orange UI (`ad54cde`), Dark Mode initially used navy slate (`#0b0f17` / `#111827`) with saturated blue accents (`#2563eb`). For extended late-night job hunting and resume editing, saturated blue on navy felt visually noisy, while pure `#000000` + `#FFFFFF` caused eye strain.

## Decision
Implement a **Soft Grayscale Monochrome** Dark Mode (`#121214` page canvas, `#18181b` card surface, `#202024` subsurface, `zinc-100` / `zinc-400` text, `border-l-zinc-300` active indicator) in [`src/lib/theme.ts`](file:///d:/Dev/Pa-Hire%20Po/src/lib/theme.ts), keeping external board logos (`LinkedIn`, `JobStreet`, `Indeed`) in their true brand colors.

## Alternatives Considered & Rejected
- **Pure `#000000` OLED Black + Neon Accents:** Explicitly banned by Anti-AI-Slop guidelines due to halation and glare.
- **Dark Navy + Saturated Blue:** Retained more visual noise than needed in dark mode.

## Consequences
- **Positive:** Calm, low-glare reading surface for long job/resume review sessions.
- **Tradeoffs:** `AGENTS.md` Section 1 still references the earlier `#0b0f17` / `#2563eb` Dark Slate description — tracked here so future updates keep `src/lib/theme.ts` as authoritative.

## Related Notes
- [[Design - Civic Career Utility & Theme Tokens]]
- [[Specs & Plans Archive Index]]
