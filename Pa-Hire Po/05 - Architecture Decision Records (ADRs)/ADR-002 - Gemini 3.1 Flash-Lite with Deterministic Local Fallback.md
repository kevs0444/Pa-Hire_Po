---
type: adr
status: accepted
priority: p0-now
area: resume-ai
milestone: v2-rebrand
commit_ref: "288ca06"
files:
  - src/app/api/resume/tailor/route.ts
  - src/features/resume/lib/resume-tailor.ts
updated: 2026-11-16
tags:
  - pahirepo
  - adr
  - gemini
---

# ADR-002 — Gemini 3.1 Flash-Lite with Deterministic Local Fallback

## Context
Tailoring resumes per job posting must be fast (< 2–3s), inexpensive for high-frequency iteration, non-hallucinating, and functional even when `GEMINI_API_KEY` is absent or rate-limited.

## Decision
Use `gemini-3.1-flash-lite` as the primary server-side model (`process.env.GEMINI_API_KEY`) with automatic fallback through `gemini-flash-lite-latest` → `gemini-2.5-flash` → deterministic `tailorResumeLocally()`. Enforce strict JSON grounding against `baseResume` and `careerJourneyMarkdown`.

## Alternatives Considered & Rejected
- **Forcing users to paste an API key in the browser:** High friction and insecure if stored carelessly; kept only as an optional Override Key.
- **LLM-only with hard failure on error:** Breaks the application flow if quota hits or offline in Electron.

## Consequences
- **Positive:** Zero-friction **Personal AI Active** tailoring, graceful offline/fallback behavior, factual CV integrity.
- **Tradeoffs:** Deterministic fallback cannot synthesize prose summaries as fluidly as Gemini, so the UI surfaces which engine produced the draft (`tailor_method`).

## Related Notes
- [[Architecture - Gemini AI Pipeline & Anti-Hallucination Grounding]]
- [[Feature - Resume Studio AI & ATS Printing]]
