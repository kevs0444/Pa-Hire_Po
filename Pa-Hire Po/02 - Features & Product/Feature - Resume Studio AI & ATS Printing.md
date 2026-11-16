---
type: feature
status: verified
priority: p0-now
area: resume-ai
milestone: v2-rebrand
commit_ref: "dd4f6e7"
files:
  - src/features/resume/components/A4ResumePreview.tsx
  - src/features/resume/lib/resume-tailor.ts
  - src/features/jobs/components/ApplyFlowModal.tsx
  - src/app/api/resume/tailor/route.ts
updated: 2026-11-16
tags:
  - pahirepo
  - feature
  - resume-studio
  - gemini
---

# Feature — Resume Studio AI & ATS Printing

## Purpose & User Outcome
Enables job seekers to tailor their factual resume to any target posting using Google Gemini without inventing experience, compare changes side-by-side against their base CV, and export ligature-free PDFs optimized for enterprise ATS parsers.

## Sub-Features & Behavior
- **Native `<dialog>` Application Flow (`ApplyFlowModal`):**
  - **Step 1:** Choose direct board application or 1-click AI tailoring in **Resume Studio (`AI`)**.
  - **Step 2:** Live tailored preview with dynamic sizing, **Print / Save PDF**, **Save Version**, and **Continue to [Board] & Mark Applied**.
- **Personal Gemini AI + Grounded Local Fallback (`/api/resume/tailor`):**
  - Prioritizes server-side `GEMINI_API_KEY` from `.env` (`personalApiConfigured` flag exposed safely without leaking keys).
  - Model fallback chain: `gemini-3.1-flash-lite` → `gemini-flash-lite-latest` → `gemini-2.5-flash` → deterministic `tailorResumeLocally`.
  - Strict prompt grounding prevents inventing companies, dates, degrees, or unused tools.
- **Side-by-Side Comparison & AI Change Highlighting:**
  - Toggle **Side-by-Side Compare** (`Base Profile CV` vs `AI Tailored CV`) and **Highlight AI Changes** (`✓ AI Tailored` / `↑ Reordered` tags + color indicators, automatically stripped when printing PDF).
- **Dynamic Paper Sizing & Density:**
  - Paper sizes: **A4 (`210 × 297 mm`, default)**, **US Letter (`8.5 × 11 in`)**, **US Legal (`8.5 × 14 in`)**, and **Dynamic Auto-Fit**, synchronized with `@media print { @page { size: ...; margin: 8mm; } }`.
  - Density presets: `Compact`, `Standard`, `Comfortable`.
- **Top 5 AI-ATS & Researcher Fonts:**
  - **Calibri** (Default • #1 AI ATS Standard), **Helvetica** (#2 Tech & Engineering), **Garamond** (#3 Researcher & Academic), **Arial** (#4 Universal Legacy ATS), **Georgia** (#5 High-Contrast Research Serif).
  - Enforces `font-variant-ligatures: none` on preview and print so PDF parsers (Workday, Greenhouse, Lever, PDFBox) never corrupt `fi`/`fl` glyphs.

## Related Notes
- [[Architecture - Gemini AI Pipeline & Anti-Hallucination Grounding]]
- [[Feature - Applications Compilation & Submitted Resume Modal]]
- [[ADR-002 - Gemini 3.1 Flash-Lite with Deterministic Local Fallback]]
- [[ADR-003 - Native HTML Dialog Over Div Overlays]]
