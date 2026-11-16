---
type: feature
status: verified
priority: p0-now
area: jobs
milestone: v1-pleasehireme
commit_ref: "94ac0e1"
files:
  - src/features/resume/lib/resume-analyzer.ts
  - src/features/jobs/components/TopChoicesSpotlight.tsx
  - src/components/ui/MatchScoreRing.tsx
updated: 2026-11-16
tags:
  - pahirepo
  - feature
  - scoring
---

# Feature — Match Scorer & Experience Analyzer

## Purpose & User Outcome
Gives job seekers an **honest, transparent `28–98%` fit score** and seniority reality check before they waste time applying to mismatched or senior-gated roles.

## Weighted Scoring Formula (`scoreJobAgainstProfile`)
- **Title Alignment (up to `38 pts`):** Matches candidate target role, compound `/` variants, and searched role keywords.
- **Skill Coverage (up to `40 pts`):** Compares job requirements against user profile skills, outputting explicit `matchedSkills` (`✓`) vs `missingSkills` (`+`).
- **Resume Context Overlap (up to `16 pts`):** Token overlap between the full job description and the candidate's resume / Career Journey Markdown.
- **Work Setup & Location Bonus (`2–6 pts`):** Rewards matching `Remote` / `Hybrid` / `Onsite` preferences.
- **Experience Fit Adjustment (`+5` / `-4` / `-15 pts`):** Boosts entry-applicable listings and penalizes senior-only roles.

## Experience Requirement Extractor (`extractExperienceRequirement`)
Parses required years from job titles and descriptions (e.g., `1–3 yrs experience`, `Fresh Grad / Entry Level`, `5+ yrs`, `Open / Not Specified`) and assigns:
- `fit` — *✓ Matches Your Level*
- `stretch` — *Slight Stretch*
- `senior-warning` — *Senior Exp Requested*

## Recommended Top 3 Strip (`TopChoicesSpotlight.tsx`)
Surfaces the top 3 applicable jobs (explicitly excluding `hidden`, `isFallback`, and `senior-warning` listings) with 1-click **Tailor & Apply** and **Queue** triggers.

## Related Notes
- [[Feature - Multi-Board Job Scraper Engine]]
- [[Feature - 2-Column Job Explorer & Date Sorting]]
- [[Feature - Job Market Analytics & Screening Queue]]
