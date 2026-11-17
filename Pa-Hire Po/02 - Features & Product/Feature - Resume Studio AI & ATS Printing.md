---
type: feature
status: verified
priority: p0-now
area: resume-ai
milestone: v2-rebrand
commit_ref: "dd4f6e7"
files:
  - src/features/resume/components/A4ResumePreview.tsx
  - src/features/resume/components/ResumeFormatToolbar.tsx
  - src/features/resume/components/ResumeVersionsDrawer.tsx
  - src/features/resume/components/DeleteVersionConfirmDialog.tsx
  - src/features/resume/lib/resume-tailor.ts
  - src/features/jobs/components/ApplyFlowModal.tsx
  - src/app/api/resume/tailor/route.ts
updated: 2026-11-17
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
- **In-Sheet Full-Section Direct Editing:**
  - Every resume section is editable in place when entering Edit Mode (`color-scheme: only light` + explicit light paper input contrast on `#a4-resume-sheet`): Contact details (Full Name, Headline, Email, Phones, Location, LinkedIn, GitHub, Portfolio), Tailored Summary, Experience (role, company, location, period, bullets + add/delete/reorder bullets and positions), Projects (name, subtitle, period, bullets + add/delete/reorder), Technical Skills (categories + items + add/delete), Certifications, and Education (degree, school, period, honors + add/delete).
  - Clean `no-print` action buttons ensure in-sheet edit controls never appear during print or PDF export.
- **MS Word / Google Docs Style Text Formatting Toolbar (`ResumeFormatToolbar`):**
  - Two-row Civic header & accessible `role="toolbar"` (`focusgroup="toolbar wrap"` + roving-tabindex arrow-key fallback) unified strictly on `getThemeTokens(theme)`, with live Bold (`**`), Italic (`*`), and Tool Tag (`` ` ``) formatting wired to active edit-mode fields.
  - Text Alignment: Global toggle between **Justified** (`text-justify [hyphens:none] [word-break:normal] [overflow-wrap:break-word] [text-justify:inter-word] [text-wrap:pretty] [text-align-last:left]` for flush margins without mid-word hyphenation) and **Left Align** (`text-left [hyphens:none]` standard ATS ragged right).
- **PDF & Word (`.docx`) Resume Import (`ResumeUploadDialog.tsx`, `resume-parser.ts`, `/api/resume/parse`):**
  - Upload `.pdf` (`unpdf`), `.docx` (`mammoth`), `.txt`, `.md`, or `.json` resumes from Resume Studio or My Profile, preview extracted sections in a native `<dialog>`, sync Smart Profile fields (`user_profiles`), archive an `"Imported: <filename>"` snapshot (`tailored_resumes`), and edit immediately in-sheet.
- **Flexible Version Saving (`A4ResumePreview.tsx`, `ResumeVersionsDrawer.tsx`, `/api/resumes/history`):**
  - Optional `company` (`null` for general edits), `Sent` defaulting to `false` when no target job is active, and `Sync to My Profile & Base CV` (`syncToProfile`) updating `public.user_profiles` alongside `public.tailored_resumes`.
  - Responsive Zoom & Symmetric Compare Scaling: `ResizeObserver`-measured sheet scaling (`Fit Screen`, `75%`, `90%`, `100%`, `110%`) adapting Base and Tailored sheets symmetrically across mobile (375px+) and desktop without clipping, with `@media print` resetting to unscaled physical paper.
  - 1-Click **Apply to Base Profile** button promoting studio edits to the permanent master profile.
- **Resume Versions Drawer, Custom Naming & Deletion Confirmation (`ResumeVersionsDrawer` & `DeleteVersionConfirmDialog`):**
  - Dedicated slide-over drawer and modal showing all saved versions with customizable names (`versionName`), creation timestamps, company/role targets, and tailor method badges (`Personal AI`, `Auto-Tailored`, `Manual Edit`, `Base`).
  - Customizable Version Renaming: In-place rename input with IME-safe keyboard handling (`ime-safe-enter-submit`) and Escape cancel.
  - 1-Click Load & Restore: Restores and previews any historical version into active studio state with a single click.
  - Native `<dialog>` Deletion Confirmation: Safe version deletion prompt (`DeleteVersionConfirmDialog`) using native HTML `<dialog>` with focus trapping and light dismiss (`closedby="any"`).

## Related Notes
- [[Architecture - Gemini AI Pipeline & Anti-Hallucination Grounding]]
- [[Feature - Applications Compilation & Submitted Resume Modal]]
- [[ADR-002 - Gemini 3.1 Flash-Lite with Deterministic Local Fallback]]
- [[ADR-003 - Native HTML Dialog Over Div Overlays]]
