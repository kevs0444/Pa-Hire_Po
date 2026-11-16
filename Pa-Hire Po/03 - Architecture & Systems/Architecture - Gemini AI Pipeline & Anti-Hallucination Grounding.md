---
type: architecture
status: verified
priority: p0-now
area: resume-ai
milestone: v2-rebrand
commit_ref: "288ca06"
files:
  - src/app/api/resume/tailor/route.ts
  - src/features/resume/lib/resume-tailor.ts
  - src/features/resume/components/A4ResumePreview.tsx
updated: 2026-11-16
tags:
  - pahirepo
  - architecture
  - gemini
  - ai
---

# Architecture — Gemini AI Pipeline & Anti-Hallucination Grounding

## Server-First Credential Flow
- `POST /api/resume/tailor` reads `process.env.GEMINI_API_KEY` automatically on the server (or optional per-request `geminiApiKey` override).
- `GET /api/resume/tailor` and `GET /api/state` return `personalApiConfigured: boolean` so the client displays **Personal AI Active** without ever exposing the raw API key in client bundles.

## Model Resilience Chain
`GEMINI_TAILOR_MODELS` in `src/app/api/resume/tailor/route.ts` tries models in order:
1. `gemini-3.1-flash-lite` (primary — fast, low-cost, enterprise non-training API terms)
2. `gemini-flash-lite-latest`
3. `gemini-2.5-flash`
4. **Deterministic Fallback (`tailorResumeLocally`):** If no API key is present or upstream calls fail, `src/features/resume/lib/resume-tailor.ts` deterministically selects relevant experience bullets, projects, and Career Journey highlights matching the target job.

## Anti-Hallucination Prompt Contract
The system prompt enforces 5 strict rules:
1. **Never** invent companies, dates, degrees, certifications, job titles, or unused tools.
2. Draw facts, metrics, and projects **only** from `baseResume` and `careerJourneyMarkdown` (truncated safely to `6000` chars; JD to `2200` chars).
3. Wrap matched tools and quantified metrics in `**double asterisks**` for visual highlighting.
4. Keep at most `3–4` concise bullets per role and max `2` projects tailored for `PAGE_SIZE_GUIDANCE` (`a4`, `letter`, `legal`, `auto`).
5. Return strict JSON matching `GeminiTailorPayload` (`targetHeadline`, `tailoredSummary`, `experience`, `projects`, `skillCategories`, `tailorNotes`).

## Related Notes
- [[Feature - Resume Studio AI & ATS Printing]]
- [[ADR-002 - Gemini 3.1 Flash-Lite with Deterministic Local Fallback]]
