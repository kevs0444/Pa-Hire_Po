---
type: roadmap
status: backlog
priority: p2-later
area: resume-ai
milestone: roadmap
commit_ref: "a1059ca"
files:
  - src/app/api/resume/tailor/route.ts
  - src/features/applications/components/ApplicationsCompilationView.tsx
updated: 2026-11-16
tags:
  - pahirepo
  - roadmap
  - backlog
  - interview-prep
---

# Roadmap P2 — AI Interview Prep & Cover Letter Suite

> **Priority Note:** Deferred (`p2-later` / `backlog`) while focusing on the main core job-search & resume-tailoring loop.

## Strategic Why
Once a user moves an application to `Applied` or `Interviewing` in `/applications`, Pa-Hire Po already holds the exact job description, skill gaps (`missingSkills`), and the exact tailored resume sent (`tailored_resumes`). That context makes targeted interview prep and outreach uniquely accurate.

## Scope Ideas (When Ready)
- **AI Interview Prep Module:** Generate role-specific technical & behavioral questions grounded in the submitted resume + JD gap areas, with STAR-method coaching prompts via `gemini-3.1-flash-lite`.
- **AI Cover Letter & Recruiter Outreach Templates:** Generate concise, non-generic cover letters and LinkedIn recruiter messages tied directly to the tailored resume snapshot.

## Related Notes
- [[Feature - Applications Compilation & Submitted Resume Modal]]
- [[Architecture - Gemini AI Pipeline & Anti-Hallucination Grounding]]
- [[Roadmap P0 - Core Function Polish & Public OAuth Launch]]
